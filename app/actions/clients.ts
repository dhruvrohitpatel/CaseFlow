"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { type ActionState } from "@/lib/actions/form-state";
import { requireRole } from "@/lib/auth";
import {
  getActiveCustomFieldDefinitions,
  parseCustomFieldFormValues,
  replaceClientCustomFieldValues,
} from "@/lib/custom-fields";
import { createClientSchema } from "@/lib/validators/client";

function getFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return error.flatten().fieldErrors;
}

export async function createClientAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
