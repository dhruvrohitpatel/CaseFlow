"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "@/lib/database.types";
import {
  formatAiFeatureError,
  getAiFeatureState,
  isSemanticSearchEnabled,
} from "@/lib/ai/capabilities";
import { generateEmbedding, serializeVector } from "@/lib/ai/embeddings";
import { inferImportPlan } from "@/lib/ai/workflows";
import { requireRole } from "@/lib/auth";
import {
  buildImportPreview,
  getImportPromptPayload,
  importTargetEntitySchema,
} from "@/lib/import-assistant";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CSV_UPLOAD_RULE, validateUploadFile } from "@/lib/uploads";

function redirectWithError(error: string): never {
  redirect(`/admin/import-assistant?error=${error}`);
}

function redirectWithErrorMessage(error: string, message: string): never {
  redirect(
    `/admin/import-assistant?error=${error}&message=${encodeURIComponent(message)}`,
  );
}

export async function analyzeImportAssistantAction(formData: FormData) {
  const { profile } = await requireRole(["admin"]);
  const adminAi = getAiFeatureState("admin_ai");
  const uploadedValue = formData.get("csvFile");

  if (!adminAi.enabled) {
    redirectWithError("admin-ai-disabled");
  }

  if (!(uploadedValue instanceof File) || uploadedValue.size === 0) {
    redirectWithError("missing-file");
  }

  const file = uploadedValue as File;
  const fileValidationError = validateUploadFile(file, CSV_UPLOAD_RULE);

  if (fileValidationError) {
    redirectWithErrorMessage("missing-file", fileValidationError);
  }

  const text = await file.text();
  const payload = getImportPromptPayload(file.name, text);

  if (payload.headers.length === 0) {
    redirectWithError("empty-file");
  }

  let plan: Awaited<ReturnType<typeof inferImportPlan>>;

  try {
    plan = await inferImportPlan(payload);
  } catch (error) {
    console.error("Import assistant analysis failed:", error);
    redirect(`/admin/import-assistant?error=assistant-unavailable&message=${encodeURIComponent(formatAiFeatureError("admin_ai", error))}`);
  }

  const preview = buildImportPreview(text, plan);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_assistant_sessions")
    .insert({
      created_by: profile.id,
      mapping_plan: plan,
      preview_rows: preview.normalizedRows,
      source_filename: file.name,
      source_headers: payload.headers,
      status: "review",
      target_entity: plan.target_entity,
      warnings: preview.issues,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError("save-failed");
  }

  revalidatePath("/admin/import-assistant");
  const savedSession = data;
  redirect(`/admin/import-assistant?session=${savedSession.id}`);
}

export async function confirmImportAssistantAction(formData: FormData) {
  const { profile } = await requireRole(["admin"]);
  const sessionId = String(formData.get("sessionId") ?? "");
  const supabase = createSupabaseAdminClient();
  const { data: session, error: sessionError } = await supabase
    .from("import_assistant_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    redirectWithError("session");
  }

  const importSession = session;
  const targetEntity = importTargetEntitySchema.parse(importSession.target_entity);
  const normalizedRows = Array.isArray(importSession.preview_rows)
    ? (importSession.preview_rows as Array<Record<string, string | null>>)
    : [];

  type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
  type ServiceEntryInsert = Database["public"]["Tables"]["service_entries"]["Insert"];
  type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];

  if (normalizedRows.length === 0) {
    redirectWithError("no-rows");
  }

  if (targetEntity === "clients") {
    const clientRows: ClientInsert[] = normalizedRows.map((row) => ({
        created_by: profile.id,
        date_of_birth: row.date_of_birth,
        email: row.email,
        full_name: row.full_name ?? "Unknown client",
        housing_status: row.housing_status ?? "Not provided",
        phone: row.phone,
        preferred_language: row.preferred_language ?? "English",
        preferred_name: row.preferred_name,
        pronouns: row.pronouns,
        referral_source: row.referral_source ?? "Imported",
        status:
          row.status === "inactive" || row.status === "archived" ? row.status : "active",
      }));
    const { error } = await supabase.from("clients").insert(clientRows);

    if (error) {
      redirectWithError("import-clients");
    }
  }

  if (targetEntity === "service_entries") {
    const semanticSearchEnabled = isSemanticSearchEnabled();
    const uniqueServiceTypes = Array.from(
      new Set(normalizedRows.map((row) => row.service_type_name).filter(Boolean)),
    );
    const { data: existingServiceTypes, error: typeError } = await supabase
      .from("service_types")
      .select("id, name")
      .in("name", uniqueServiceTypes as string[]);

    if (typeError) {
      redirectWithError("service-types");
    }

    const serviceTypeMap = new Map(
      (existingServiceTypes ?? []).map((item) => [item.name, item.id]),
    );

    const missingTypes = uniqueServiceTypes.filter(
      (type) => type && !serviceTypeMap.has(type),
    ) as string[];

    if (missingTypes.length > 0) {
      const { data: insertedTypes, error: insertTypeError } = await supabase
        .from("service_types")
        .insert(
          missingTypes.map((name, index) => ({
            is_active: true,
            name,
            sort_order: 100 + index,
          })),
        )
        .select("id, name");

      if (insertTypeError) {
        redirectWithError("service-types");
      }

      insertedTypes?.forEach((item) => serviceTypeMap.set(item.name, item.id));
    }

    const clientIds = Array.from(
      new Set(normalizedRows.map((row) => row.client_public_id).filter(Boolean)),
    ) as string[];
    const { data: clients, error: clientError } = await supabase
      .from("clients")
      .select("id, client_id")
      .in("client_id", clientIds);

    if (clientError) {
      redirectWithError("client-map");
    }

    const clientMap = new Map((clients ?? []).map((client) => [client.client_id, client.id]));

    const rowsToInsert: ServiceEntryInsert[] = [];

    for (const row of normalizedRows) {
      const clientId = row.client_public_id ? clientMap.get(row.client_public_id) : null;
      const serviceTypeId = row.service_type_name
        ? serviceTypeMap.get(row.service_type_name)
        : null;

      if (!clientId || !serviceTypeId || !row.notes || !row.service_date) {
        continue;
      }

      let embedding: string | null = null;

      if (semanticSearchEnabled) {
        try {
          embedding = serializeVector(await generateEmbedding(row.notes));
        } catch {
          embedding = null;
        }
      }

      rowsToInsert.push({
        client_id: clientId,
        embedding,
        notes: row.notes,
        service_date: row.service_date,
        service_type_id: serviceTypeId,
        staff_member_name: row.staff_member_name ?? profile.full_name ?? profile.email,
        staff_member_profile_id: profile.id,
      });
    }

    const { error } = await supabase.from("service_entries").insert(rowsToInsert);

    if (error) {
      redirectWithError("import-service-entries");
    }
  }

  if (targetEntity === "appointments") {
    const clientIds = Array.from(
      new Set(normalizedRows.map((row) => row.client_public_id).filter(Boolean)),
    ) as string[];
    const { data: clients, error: clientError } = await supabase
      .from("clients")
      .select("id, client_id")
      .in("client_id", clientIds);

    if (clientError) {
      redirectWithError("client-map");
    }

    const clientMap = new Map((clients ?? []).map((client) => [client.client_id, client.id]));
    const rowsToInsert = normalizedRows.flatMap<AppointmentInsert>((row) => {
      const clientId = row.client_public_id ? clientMap.get(row.client_public_id) : null;

      if (!clientId || !row.scheduled_for) {
        return [];
      }

      return [
        {
          client_id: clientId,
          duration_minutes: Number(row.duration_minutes ?? 30),
          location: row.location ?? null,
          notes: row.notes ?? null,
          reminder_status:
            row.reminder_status === "not_needed" || row.reminder_status === "sent"
              ? row.reminder_status
              : "pending",
          scheduled_for: row.scheduled_for,
          staff_member_name: row.staff_member_name ?? profile.full_name ?? profile.email,
          staff_member_profile_id: profile.id,
        },
      ];
    });

    const { error } = await supabase.from("appointments").insert(rowsToInsert);

    if (error) {
      redirectWithError("import-appointments");
    }
  }

  const { error: updateError } = await supabase
    .from("import_assistant_sessions")
    .update({ status: "imported" })
    .eq("id", importSession.id);

  if (updateError) {
    redirectWithError("session-update");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/import-assistant");
  revalidatePath("/dashboard/admin");
  redirect(`/admin/import-assistant?session=${importSession.id}&imported=1`);
}
