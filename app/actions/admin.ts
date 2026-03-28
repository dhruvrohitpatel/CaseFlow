"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/form-state";
import { requireRole } from "@/lib/auth";
import {
  customFieldDefinitionSchema,
  parseCustomFieldOptions,
  toSelectOptionsJson,
} from "@/lib/custom-fields";
import { parseClientCsvImport } from "@/lib/csv";

export type CsvImportState = {
  imported?: number;
  message?: string;
  processed?: number;
  rowErrors?: Array<{ rowNumber: number; messages: string[] }>;
  status?: "error" | "success";
};

function getFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return error.flatten().fieldErrors;
}

export async function importClientsCsvAction(
  _previousState: CsvImportState,
  formData: FormData,
): Promise<CsvImportState> {
  const file = formData.get("csvFile");

  if (!(file instanceof File) || file.size === 0) {
    return {
      message: "Choose a CSV file to import.",
      status: "error",
    };
  }

  const { profile, supabase } = await requireRole(["admin"]);
  const parsedImport = parseClientCsvImport(await file.text());
  const rowErrors = [...parsedImport.errors];
  let imported = 0;

  for (const row of parsedImport.rows) {
    const { error } = await supabase.from("clients").insert({
      created_by: profile.id,
      date_of_birth: row.data.date_of_birth,
      email: row.data.email,
      full_name: row.data.full_name,
      housing_status: row.data.housing_status,
      phone: row.data.phone,
      preferred_language: row.data.preferred_language,
      preferred_name: row.data.preferred_name,
      pronouns: row.data.pronouns,
      referral_source: row.data.referral_source,
      status: row.data.status,
    });

    if (error) {
      rowErrors.push({
        messages: [error.message],
        rowNumber: row.rowNumber,
      });
      continue;
    }

    imported += 1;
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return {
    imported,
    message:
      rowErrors.length > 0
        ? `Imported ${imported} of ${parsedImport.rows.length + parsedImport.errors.length} rows.`
        : `Imported ${imported} clients successfully.`,
    processed: parsedImport.rows.length + parsedImport.errors.length,
    rowErrors,
    status: rowErrors.length > 0 ? "error" : "success",
  };
}

export async function createCustomFieldDefinitionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = customFieldDefinitionSchema.safeParse({
    entityType: formData.get("entityType"),
    fieldKey: formData.get("fieldKey"),
    fieldType: formData.get("fieldType"),
    isRequired: formData.get("isRequired"),
    label: formData.get("label"),
    options: formData.get("options"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted field settings and try again.",
      status: "error",
    };
  }

  const { profile, supabase } = await requireRole(["admin"]);
  const selectOptions = toSelectOptionsJson(parseCustomFieldOptions(parsed.data.options));

  const { error } = await supabase.from("custom_field_definitions").insert({
    created_by: profile.id,
    entity_type: parsed.data.entityType,
    field_key: parsed.data.fieldKey,
    field_type: parsed.data.fieldType,
    is_required: parsed.data.isRequired,
    label: parsed.data.label,
    select_options: selectOptions,
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/clients/new");
  revalidatePath("/clients/[id]", "page");

  return {
    message: "Custom field added.",
    status: "success",
  };
}

export async function toggleCustomFieldActiveAction(formData: FormData) {
  const definitionId = String(formData.get("definitionId") ?? "");
  const nextValue = String(formData.get("nextValue") ?? "") === "true";

  if (!definitionId) {
    redirect("/admin?error=custom-fields");
  }

  const { supabase } = await requireRole(["admin"]);
  const { error } = await supabase
    .from("custom_field_definitions")
    .update({
      is_active: nextValue,
    })
    .eq("id", definitionId);

  if (error) {
    redirect("/admin?error=custom-fields");
  }

  revalidatePath("/admin");
  revalidatePath("/clients/new");
  redirect("/admin?updated=1");
}

export async function deleteCustomFieldDefinitionAction(formData: FormData) {
  const definitionId = String(formData.get("definitionId") ?? "");

  if (!definitionId) {
    redirect("/admin?error=custom-fields");
  }

  const { supabase } = await requireRole(["admin"]);
  const { error } = await supabase
    .from("custom_field_definitions")
    .delete()
    .eq("id", definitionId);

  if (error) {
    redirect("/admin?error=custom-fields");
  }

  revalidatePath("/admin");
  revalidatePath("/clients/new");
  redirect("/admin?deleted=1");
}
