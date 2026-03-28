import { z } from "zod";

import type { Database } from "@/lib/database.types";

const CSV_HEADERS = [
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
] as const;

const optionalDate = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Must be a valid date.",
  });

const optionalEmail = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Must be a valid email address.",
  });

const optionalText = z.string().trim().transform((value) => value || null);

export const clientCsvRowSchema = z.object({
  date_of_birth: optionalDate,
  email: optionalEmail,
  full_name: z.string().trim().min(2, "Full name is required."),
  housing_status: z.string().trim().min(1, "Housing status is required."),
  phone: optionalText,
  preferred_language: z.string().trim().min(1, "Preferred language is required."),
  preferred_name: optionalText,
  pronouns: optionalText,
  referral_source: z.string().trim().min(1, "Referral source is required."),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export type ParsedCsvImportResult = {
  errors: Array<{ rowNumber: number; messages: string[] }>;
  rows: Array<{ data: z.infer<typeof clientCsvRowSchema>; rowNumber: number }>;
};

export function getClientCsvTemplate() {
  return `${CSV_HEADERS.join(",")}\nJordan Parker,1991-04-10,(602) 555-0123,jordan@example.org,Jordan,English,they/them,Stable housing,Walk-in,active\n`;
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      if (currentRow.some((value) => value.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((value) => value.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseClientCsvImport(text: string): ParsedCsvImportResult {
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return {
      errors: [{ messages: ["The CSV file is empty."], rowNumber: 1 }],
      rows: [],
    };
  }

  const [headerRow, ...dataRows] = rows;
  const normalizedHeader = headerRow.map((cell) => cell.trim());
  const expectedHeader = [...CSV_HEADERS];

  if (
    normalizedHeader.length !== expectedHeader.length ||
    normalizedHeader.some((cell, index) => cell !== expectedHeader[index])
  ) {
    return {
      errors: [
        {
          messages: [
            `Header must exactly match: ${expectedHeader.join(", ")}`,
          ],
          rowNumber: 1,
        },
      ],
      rows: [],
    };
  }

  const parsedRows: ParsedCsvImportResult["rows"] = [];
  const errors: ParsedCsvImportResult["errors"] = [];

  dataRows.forEach((row, rowIndex) => {
    const rowObject = Object.fromEntries(
      expectedHeader.map((header, headerIndex) => [header, row[headerIndex] ?? ""]),
    );
    const parsed = clientCsvRowSchema.safeParse(rowObject);

    if (!parsed.success) {
      const messages = Object.entries(parsed.error.flatten().fieldErrors).flatMap(
        ([field, fieldErrors]) =>
          (fieldErrors ?? []).map((message) => `${field}: ${message}`),
      );

      errors.push({
        messages,
        rowNumber: rowIndex + 2,
      });
      return;
    }

    parsedRows.push({
      data: parsed.data,
      rowNumber: rowIndex + 2,
    });
  });

  return {
    errors,
    rows: parsedRows,
  };
}

export function toCsv(rows: Array<Record<string, string | number | null | undefined>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);

  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCsvCell(row[header]))
        .join(","),
    ),
  ].join("\n");
}

function escapeCsvCell(value: string | number | null | undefined) {
  const normalized = value == null ? "" : String(value);

  if (!/[",\n\r]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

export type ClientExportRow = {
  client_id: string;
  full_name: string;
  status: Database["public"]["Enums"]["client_status"];
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  preferred_name: string | null;
  preferred_language: string;
  pronouns: string | null;
  housing_status: string;
  referral_source: string;
  created_at: string;
};

export type ServiceExportRow = {
  client_public_id: string;
  client_name: string;
  service_date: string;
  service_type: string;
  staff_member_name: string;
  notes: string;
};
