import { z } from "zod";

import { parseCsv } from "@/lib/csv";

export const importTargetEntitySchema = z.enum([
  "clients",
  "service_entries",
  "appointments",
]);

export type ImportTargetEntity = z.infer<typeof importTargetEntitySchema>;

export const importFieldCatalog: Record<ImportTargetEntity, string[]> = {
  appointments: [
    "client_public_id",
    "scheduled_for",
    "duration_minutes",
    "location",
    "notes",
    "reminder_status",
    "staff_member_name",
  ],
  clients: [
    "full_name",
    "date_of_birth",
    "phone",
    "email",
    "preferred_name",
    "preferred_language",
    "pronouns",
    "housing_status",
    "referral_source",
    "status",
  ],
  service_entries: [
    "client_public_id",
    "service_date",
    "service_type_name",
    "notes",
    "staff_member_name",
  ],
};

const isoDateSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Use a valid date.");

const optionalTextSchema = z.string().trim().transform((value) => value || null);

export const importPreviewSchemas = {
  appointments: z.object({
    client_public_id: z.string().trim().min(1),
    duration_minutes: z.coerce.number().int().min(5).default(30),
    location: optionalTextSchema,
    notes: optionalTextSchema,
    reminder_status: z.enum(["not_needed", "pending", "sent"]).default("pending"),
    scheduled_for: isoDateSchema,
    staff_member_name: z.string().trim().min(1),
  }),
  clients: z.object({
    date_of_birth: z.string().trim().optional().transform((value) => value || null),
    email: z.string().trim().optional().transform((value) => value || null),
    full_name: z.string().trim().min(2),
    housing_status: z.string().trim().min(1),
    phone: z.string().trim().optional().transform((value) => value || null),
    preferred_language: z.string().trim().min(1),
    preferred_name: z.string().trim().optional().transform((value) => value || null),
    pronouns: z.string().trim().optional().transform((value) => value || null),
    referral_source: z.string().trim().min(1),
    status: z.enum(["active", "inactive", "archived"]).default("active"),
  }),
  service_entries: z.object({
    client_public_id: z.string().trim().min(1),
    notes: z.string().trim().min(6),
    service_date: isoDateSchema,
    service_type_name: z.string().trim().min(1),
    staff_member_name: z.string().trim().min(1),
  }),
} as const;

export type ImportMappingPlan = {
  confidence_summary: string;
  header_mappings: Array<{
    source_header: string;
    target_field: string;
    transform_hint: string;
  }>;
  target_entity: ImportTargetEntity;
  warnings: string[];
};

export function getImportPromptPayload(fileName: string, text: string) {
  const rows = parseCsv(text);
  const [headerRow = [], ...dataRows] = rows;

  return {
    fileName,
    headers: headerRow.map((header) => header.trim()),
    sampleRows: dataRows.slice(0, 8),
  };
}

function transformValue(value: string, transformHint: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  switch (transformHint) {
    case "normalize_phone":
      return trimmed.replace(/\s+/g, " ");
    case "normalize_date":
      return trimmed;
    case "map_enum":
      return trimmed.toLowerCase().replaceAll(" ", "_");
    case "ignore_column":
      return "";
    default:
      return trimmed;
  }
}

export function buildImportPreview(text: string, plan: ImportMappingPlan) {
  const rows = parseCsv(text);
  const [headerRow = [], ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const fieldSet = new Set(importFieldCatalog[plan.target_entity]);
  const mappingBySource = new Map(
    plan.header_mappings
      .filter((mapping) => fieldSet.has(mapping.target_field))
      .map((mapping) => [mapping.source_header, mapping]),
  );
  const normalizedRows: Array<Record<string, string | null>> = [];
  const issues: string[] = [...plan.warnings];

  dataRows.slice(0, 25).forEach((row, rowIndex) => {
    const normalized: Record<string, string> = {};

    headers.forEach((header, columnIndex) => {
      const mapping = mappingBySource.get(header);

      if (!mapping || mapping.transform_hint === "ignore_column") {
        return;
      }

      normalized[mapping.target_field] = transformValue(
        row[columnIndex] ?? "",
        mapping.transform_hint,
      );
    });

    const parsed = importPreviewSchemas[plan.target_entity].safeParse(normalized);

    if (!parsed.success) {
      issues.push(`Row ${rowIndex + 2}: ${parsed.error.issues[0]?.message ?? "Invalid mapped row."}`);
      return;
    }

    normalizedRows.push(parsed.data as Record<string, string | null>);
  });

  return {
    issues,
    normalizedRows,
    previewRows: normalizedRows.slice(0, 25),
  };
}
