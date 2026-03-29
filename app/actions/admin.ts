"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/form-state";
import { normalizeEmail } from "@/lib/access-allowlist";
import { requireRole } from "@/lib/auth";
import {
  customFieldDefinitionSchema,
  parseCustomFieldOptions,
  toSelectOptionsJson,
} from "@/lib/custom-fields";
import { parseClientCsvImport } from "@/lib/csv";
import { createAccessAllowlistEntrySchema } from "@/lib/validators/access-allowlist";

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

export async function createAllowlistEntryAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createAccessAllowlistEntrySchema.safeParse({
    email: formData.get("email"),
    linkedClientId: formData.get("linkedClientId"),
    notes: formData.get("notes"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted access fields and try again.",
      status: "error",
    };
  }

  const { profile, supabase } = await requireRole(["admin"]);
  const email = normalizeEmail(parsed.data.email);
  const linkedClientId = parsed.data.role === "client" ? parsed.data.linkedClientId : null;
  const { data: existingEntry, error: existingEntryError } = await supabase
    .from("access_allowlist")
    .select("id, linked_client_id, role")
    .eq("email", email)
    .maybeSingle();

  if (existingEntryError) {
    return {
      message: "We could not read the existing access entry.",
      status: "error",
    };
  }

  if (parsed.data.role === "client" && linkedClientId) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", linkedClientId)
      .single();

    if (clientError || !client) {
      return {
        message: "We could not find that client record.",
        status: "error",
      };
    }
  }

  if (
    existingEntry?.role === "client" &&
    existingEntry.linked_client_id &&
    existingEntry.linked_client_id !== linkedClientId
  ) {
    const { error: clearError } = await supabase
      .from("clients")
      .update({
        portal_profile_id: null,
      })
      .eq("id", existingEntry.linked_client_id);

    if (clearError) {
      return {
        message: "We could not clear the previous client portal link.",
        status: "error",
      };
    }
  }

  const { error } = await supabase.from("access_allowlist").upsert(
    {
      created_by: profile.id,
      email,
      is_active: true,
      linked_client_id: linkedClientId || null,
      notes: parsed.data.notes?.trim() || null,
      role: parsed.data.role,
    },
    {
      onConflict: "email",
    },
  );

  if (error) {
    return {
      message:
        error.message.includes("access_allowlist_unique_linked_client_idx")
          ? "That client already has an approved portal email."
          : "We could not save that approved access entry.",
      status: "error",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");

  return {
    message: `${parsed.data.role === "client" ? "Client portal" : "Team"} access approved for ${email}.`,
    status: "success",
  };
}

export async function toggleAllowlistEntryActiveAction(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "");
  const nextValue = String(formData.get("nextValue") ?? "") === "true";

  if (!entryId) {
    redirect("/admin?error=allowlist");
  }

  const { supabase } = await requireRole(["admin"]);
  const { data: existingEntry, error: existingEntryError } = await supabase
    .from("access_allowlist")
    .select("linked_client_id, role")
    .eq("id", entryId)
    .maybeSingle();

  if (existingEntryError) {
    redirect("/admin?error=allowlist");
  }

  const { error } = await supabase
    .from("access_allowlist")
    .update({
      is_active: nextValue,
    })
    .eq("id", entryId);

  if (error) {
    redirect("/admin?error=allowlist");
  }

  if (!nextValue && existingEntry?.role === "client" && existingEntry.linked_client_id) {
    const { error: clearError } = await supabase
      .from("clients")
      .update({
        portal_profile_id: null,
      })
      .eq("id", existingEntry.linked_client_id);

    if (clearError) {
      redirect("/admin?error=allowlist");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/admin");
  redirect("/admin?accessUpdated=1");
}

export async function deleteAllowlistEntryAction(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "");

  if (!entryId) {
    redirect("/admin?error=allowlist");
  }

  const { supabase } = await requireRole(["admin"]);
  const { data: existingEntry, error: existingEntryError } = await supabase
    .from("access_allowlist")
    .select("linked_client_id, role")
    .eq("id", entryId)
    .maybeSingle();

  if (existingEntryError) {
    redirect("/admin?error=allowlist");
  }

  const { error } = await supabase
    .from("access_allowlist")
    .delete()
    .eq("id", entryId);

  if (error) {
    redirect("/admin?error=allowlist");
  }

  if (existingEntry?.role === "client" && existingEntry.linked_client_id) {
    const { error: clearError } = await supabase
      .from("clients")
      .update({
        portal_profile_id: null,
      })
      .eq("id", existingEntry.linked_client_id);

    if (clearError) {
      redirect("/admin?error=allowlist");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/admin");
  redirect("/admin?accessDeleted=1");
}
