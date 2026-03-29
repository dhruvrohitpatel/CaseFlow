import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database, Json } from "@/lib/database.types";

type EntityType = Database["public"]["Enums"]["custom_field_entity_type"];
type FieldType = Database["public"]["Enums"]["custom_field_type"];
type Definition = Database["public"]["Tables"]["custom_field_definitions"]["Row"];
type ClientValueInsert = Database["public"]["Tables"]["client_custom_field_values"]["Insert"];
type ServiceValueInsert =
  Database["public"]["Tables"]["service_entry_custom_field_values"]["Insert"];

export type CustomFieldOption = string;
export type CustomFieldDefinition = Definition;
export type CustomFieldDisplayValue = {
  definitionId: string;
  fieldType: FieldType;
  label: string;
  value: string;
};
export type ParsedCustomFieldValue = {
  definitionId: string;
  value: string;
};

export function getCustomFieldInputName(definitionId: string) {
  return `customField:${definitionId}`;
}

const baseDefinitionSchema = z.object({
  entityType: z.enum(["client", "service_entry"]),
  fieldKey: z
    .string()
    .trim()
    .min(2, "Field key is required.")
    .max(48, "Field key is too long.")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Use lowercase letters, numbers, and underscores only.",
    ),
  fieldType: z.enum(["text", "textarea", "number", "date", "select"]),
  isRequired: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .transform((value) => value === "on" || value === "true"),
  label: z.string().trim().min(2, "Label is required.").max(80, "Label is too long."),
  options: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(500).default(0),
});

export const customFieldDefinitionSchema = baseDefinitionSchema.superRefine(
  (value, ctx) => {
    if (value.fieldType !== "select") {
      return;
    }

    const options = parseCustomFieldOptions(value.options);

    if (options.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one option for select fields.",
        path: ["options"],
      });
    }
  },
);

export function parseCustomFieldOptions(rawOptions?: string | null) {
  if (!rawOptions) {
    return [] as string[];
  }

  return rawOptions
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function toSelectOptionsJson(options: string[]): Json {
  return options;
}

export function getSelectOptions(value: Json): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((option) => (typeof option === "string" ? option.trim() : ""))
    .filter(Boolean);
}

export async function getActiveCustomFieldDefinitions(
  supabase: SupabaseClient<Database>,
  entityType: EntityType,
) {
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("entity_type", entityType)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAllCustomFieldDefinitions(
  supabase: SupabaseClient<Database>,
  entityType?: EntityType,
) {
  let query = supabase
    .from("custom_field_definitions")
    .select("*")
    .order("entity_type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function coerceCustomFieldValue(definition: CustomFieldDefinition, rawValue: FormDataEntryValue | null) {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!value) {
    if (definition.is_required) {
      return {
        error: `${definition.label} is required.`,
        value: null,
      };
    }

    return {
      error: null,
      value: null,
    };
  }

  if (definition.field_type === "number" && Number.isNaN(Number(value))) {
    return {
      error: `${definition.label} must be a number.`,
      value: null,
    };
  }

  if (definition.field_type === "date" && Number.isNaN(Date.parse(value))) {
    return {
      error: `${definition.label} must be a valid date.`,
      value: null,
    };
  }

  if (definition.field_type === "select") {
    const options = getSelectOptions(definition.select_options);

    if (!options.includes(value)) {
      return {
        error: `${definition.label} must match one of the configured options.`,
        value: null,
      };
    }
  }

  return {
    error: null,
    value,
  };
}

export function parseCustomFieldFormValues(
  definitions: CustomFieldDefinition[],
  formData: FormData,
) {
  const fieldErrors: Record<string, string[]> = {};
  const values: ParsedCustomFieldValue[] = [];

  for (const definition of definitions) {
    const key = getCustomFieldInputName(definition.id);
    const parsed = coerceCustomFieldValue(definition, formData.get(key));

    if (parsed.error) {
      fieldErrors[key] = [parsed.error];
      continue;
    }

    if (parsed.value) {
      values.push({
        definitionId: definition.id,
        value: parsed.value,
      });
    }
  }

  return {
    fieldErrors,
    success: Object.keys(fieldErrors).length === 0,
    values,
  };
}

export async function replaceClientCustomFieldValues(
  supabase: SupabaseClient<Database>,
  clientId: string,
  values: ParsedCustomFieldValue[],
) {
  const { error: deleteError } = await supabase
    .from("client_custom_field_values")
    .delete()
    .eq("client_id", clientId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (values.length === 0) {
    return;
  }

  const payload: ClientValueInsert[] = values.map((value) => ({
    client_id: clientId,
    definition_id: value.definitionId,
    value_text: value.value,
  }));

  const { error } = await supabase.from("client_custom_field_values").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function replaceServiceEntryCustomFieldValues(
  supabase: SupabaseClient<Database>,
  serviceEntryId: string,
  values: ParsedCustomFieldValue[],
) {
  const { error: deleteError } = await supabase
    .from("service_entry_custom_field_values")
    .delete()
    .eq("service_entry_id", serviceEntryId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (values.length === 0) {
    return;
  }

  const payload: ServiceValueInsert[] = values.map((value) => ({
    definition_id: value.definitionId,
    service_entry_id: serviceEntryId,
    value_text: value.value,
  }));

  const { error } = await supabase
    .from("service_entry_custom_field_values")
    .insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getClientCustomFieldValues(
  supabase: SupabaseClient<Database>,
  clientId: string,
) {
  const { data, error } = await supabase
    .from("client_custom_field_values")
    .select("definition_id, value_text")
    .eq("client_id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((entry) => [entry.definition_id, entry.value_text]));
}

export async function getServiceEntryCustomFieldValues(
  supabase: SupabaseClient<Database>,
  serviceEntryIds: string[],
) {
  if (serviceEntryIds.length === 0) {
    return new Map<string, Array<{ definitionId: string; value: string }>>();
  }

  const { data, error } = await supabase
    .from("service_entry_custom_field_values")
    .select("service_entry_id, definition_id, value_text")
    .in("service_entry_id", serviceEntryIds);

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, Array<{ definitionId: string; value: string }>>();

  for (const entry of data ?? []) {
    const bucket = grouped.get(entry.service_entry_id) ?? [];
    bucket.push({
      definitionId: entry.definition_id,
      value: entry.value_text,
    });
    grouped.set(entry.service_entry_id, bucket);
  }

  return grouped;
}

export function buildDisplayValues(
  definitions: CustomFieldDefinition[],
  valueMap: Map<string, string>,
) {
  return definitions.flatMap((definition) => {
    const value = valueMap.get(definition.id);

    if (!value) {
      return [];
    }

    return [
      {
        definitionId: definition.id,
        fieldType: definition.field_type,
        label: definition.label,
        value,
      } satisfies CustomFieldDisplayValue,
    ];
  });
}

export function buildGroupedServiceDisplayValues(
  definitions: CustomFieldDefinition[],
  valuesByServiceEntryId: Map<string, Array<{ definitionId: string; value: string }>>,
) {
  return new Map(
    Array.from(valuesByServiceEntryId.entries()).map(([serviceEntryId, values]) => {
      const valueMap = new Map(values.map((value) => [value.definitionId, value.value]));
      return [serviceEntryId, buildDisplayValues(definitions, valueMap)];
    }),
  );
}
