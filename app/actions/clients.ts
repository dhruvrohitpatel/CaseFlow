"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { type ActionState } from "@/lib/actions/form-state";
import { formatAiFeatureError, getAiCapabilities, getAiFeatureState } from "@/lib/ai/capabilities";
import { extractIntakeFromImage } from "@/lib/ai/workflows";
import { requireRole } from "@/lib/auth";
import {
  getActiveCustomFieldDefinitions,
  getSelectOptions,
  parseCustomFieldFormValues,
  replaceClientCustomFieldValues,
} from "@/lib/custom-fields";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClientSchema } from "@/lib/validators/client";

function getFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return error.flatten().fieldErrors;
}

const INTAKE_SOURCE_BUCKET = "intake-source-images";
const allowedIntakeImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function uploadIntakeImage(file: File) {
  if (!allowedIntakeImageTypes.has(file.type)) {
    throw new Error("Upload a JPG, PNG, or WEBP intake photo.");
  }

  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Keep intake photos under 6 MB.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined;
  const safeExtension = extension && extension.length <= 5 ? extension : "jpg";
  const path = `uploads/${randomUUID()}.${safeExtension}`;
  const bytes = await file.arrayBuffer();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(INTAKE_SOURCE_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function processIntakePhotoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const adminAi = getAiFeatureState("admin_ai");

  if (!adminAi.enabled) {
    return {
      message: adminAi.unavailableMessage,
      status: "error",
    };
  }

  const uploaded = formData.get("intakePhoto");

  if (!(uploaded instanceof File) || uploaded.size === 0) {
    return {
      message: "Choose an intake image before starting photo-to-intake.",
      status: "error",
    };
  }

  const { profile, supabase } = await requireRole(["admin", "staff"]);
  const customFieldDefinitions = await getActiveCustomFieldDefinitions(supabase, "client");
  const adminSupabase = createSupabaseAdminClient();
  const { aiProvider } = getAiCapabilities();
  const providerLabel = aiProvider === "openai" ? "openai" : "gemini";
  let sessionId: string | null = null;

  try {
    const sourceImagePath = await uploadIntakeImage(uploaded);
    const { data: createdSession, error: createError } = await adminSupabase
      .from("intake_capture_sessions")
      .insert({
        created_by: profile.id,
        model: aiProvider === "openai" ? process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4.1-mini" : null,
        provider: providerLabel,
        source_filename: uploaded.name,
        source_image_path: sourceImagePath,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (createError || !createdSession) {
      throw new Error(createError?.message ?? "The intake session could not be created.");
    }

    sessionId = createdSession.id;
    const extraction = await extractIntakeFromImage({
      customFields: customFieldDefinitions.map((definition) => ({
        definitionId: definition.id,
        fieldKey: definition.field_key,
        fieldType: definition.field_type,
        isRequired: definition.is_required,
        label: definition.label,
        options: definition.field_type === "select" ? getSelectOptions(definition.select_options) : [],
      })),
      file: uploaded,
    });
    const { error: updateError } = await adminSupabase
      .from("intake_capture_sessions")
      .update({
        confidence_json: extraction.fieldConfidence,
        core_fields_json: extraction.coreFields,
        custom_fields_json: extraction.customFields,
        raw_model_output_json: extraction,
        status: "processed",
        warnings_json: [...extraction.warnings, ...extraction.unmappedObservations],
      })
      .eq("id", sessionId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    console.error("Photo-to-intake processing failed:", error);

    if (sessionId) {
      await adminSupabase
        .from("intake_capture_sessions")
        .update({
          raw_model_output_json: {
            error: error instanceof Error ? error.message : String(error ?? "unknown"),
          },
          status: "failed",
        })
        .eq("id", sessionId);
    }

    return {
      message: formatAiFeatureError("admin_ai", error),
      status: "error",
    };
  }

  revalidatePath("/clients/new");
  redirect(`/clients/new?intake=${sessionId}`);
}

export async function discardIntakeCaptureSessionAction(formData: FormData) {
  const sessionId = String(formData.get("intakeSessionId") ?? "").trim();

  if (!sessionId) {
    redirect("/clients/new");
  }

  await requireRole(["admin", "staff"]);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("intake_capture_sessions")
    .update({
      status: "discarded",
    })
    .eq("id", sessionId);

  if (error) {
    redirect("/clients/new?error=intake-discard");
  }

  revalidatePath("/clients/new");
  redirect("/clients/new?discarded=1");
}

export async function createClientAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const intakeSessionId = String(formData.get("intakeSessionId") ?? "").trim();
  const parsed = createClientSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    housingStatus: formData.get("housingStatus"),
    phone: formData.get("phone"),
    preferredLanguage: formData.get("preferredLanguage"),
    preferredName: formData.get("preferredName"),
    pronouns: formData.get("pronouns"),
    referralSource: formData.get("referralSource"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted fields and try again.",
      status: "error",
    };
  }

  const { profile, supabase } = await requireRole(["admin", "staff"]);
  const definitions = await getActiveCustomFieldDefinitions(supabase, "client");
  const customFields = parseCustomFieldFormValues(definitions, formData);

  if (!customFields.success) {
    return {
      fieldErrors: customFields.fieldErrors,
      message: "Fix the highlighted custom fields and try again.",
      status: "error",
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      created_by: profile.id,
      date_of_birth: parsed.data.dateOfBirth,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      housing_status: parsed.data.housingStatus,
      phone: parsed.data.phone,
      preferred_language: parsed.data.preferredLanguage,
      preferred_name: parsed.data.preferredName,
      pronouns: parsed.data.pronouns,
      referral_source: parsed.data.referralSource,
      status: parsed.data.status,
    })
    .select("id, client_id")
    .single();

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  await replaceClientCustomFieldValues(supabase, data.id, customFields.values);
  if (intakeSessionId) {
    const adminSupabase = createSupabaseAdminClient();
    await adminSupabase
      .from("intake_capture_sessions")
      .update({
        created_client_id: data.id,
        status: "submitted",
      })
      .eq("id", intakeSessionId);
  }

  redirect(`/clients/${data.client_id}?created=1`);
}

export async function updateClientStatusAction(formData: FormData) {
  const parsed = createClientSchema.pick({
    status: true,
  }).safeParse({
    status: formData.get("status"),
  });

  const clientPublicId = String(formData.get("clientPublicId") ?? "").trim();

  if (!parsed.success || !clientPublicId) {
    redirect(`/clients/${clientPublicId || ""}?error=status`);
  }

  const { supabase } = await requireRole(["admin", "staff"]);
  const { error } = await supabase
    .from("clients")
    .update({
      status: parsed.data.status,
    })
    .eq("client_id", clientPublicId);

  if (error) {
    redirect(`/clients/${clientPublicId}?error=status`);
  }

  revalidatePath(`/clients/${clientPublicId}`);
  revalidatePath("/dashboard");
  redirect(`/clients/${clientPublicId}?updated=1`);
}
