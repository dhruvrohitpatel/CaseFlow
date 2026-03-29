import { z } from "zod";

import type { DashboardCatalogItem, DashboardRole } from "@/lib/dashboard-layouts";
import { fontPairKeySchema, themePresetKeySchema } from "@/lib/theme-presets";
import { getGeminiApiKey, getGeminiTextModel } from "@/lib/env";

const themeDraftSchema = z.object({
  accent_color: z.string(),
  border_color: z.string(),
  canvas_color: z.string(),
  card_color: z.string(),
  font_pair_key: fontPairKeySchema,
  imagery_prompt: z.string().min(8),
  primary_color: z.string(),
  rationale: z.string().min(12),
  suggested_copy_tone: z.string().min(8),
  surface_tint: z.string(),
  theme_preset_key: themePresetKeySchema.catch("custom"),
});

const widgetRecommendationSchema = z.object({
  key: z.string().min(1),
  size: z.enum(["sm", "md", "lg", "full"]),
  title: z.string().min(2).optional(),
  why: z.object({
    dataset: z.string().min(2),
    frequency: z.string().min(2),
    supporting_decision: z.string().min(6),
    trigger: z.string().min(6),
  }),
});

const widgetRecommendationResponseSchema = z.object({
  recommendations: z.array(widgetRecommendationSchema).min(1).max(8),
});

const importPlanSchema = z.object({
  confidence_summary: z.string().min(6),
  header_mappings: z.array(
    z.object({
      source_header: z.string().min(1),
      target_field: z.string().min(1),
      transform_hint: z.string().min(1),
    }),
  ),
  target_entity: z.enum(["clients", "service_entries", "appointments"]),
  warnings: z.array(z.string()).default([]),
});

type GeminiRequest = {
  instruction: string;
  prompt: string;
};

async function callGeminiJson<T>(
  { instruction, prompt }: GeminiRequest,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiTextModel()}:generateContent`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${instruction}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGeminiApiKey(),
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    throw new Error("Gemini did not return JSON content.");
  }

  return schema.parse(JSON.parse(text));
}

export async function generateThemeDraft(input: {
  currentTheme: {
    accent_color: string;
    border_color: string;
    canvas_color: string;
    card_color: string;
    font_pair_key: string;
    primary_color: string;
    surface_tint: string;
    theme_preset_key: string;
  };
  organizationName: string;
  prompt: string;
}) {
  return callGeminiJson(
    {
      instruction:
        "You are designing a nonprofit operations product theme. Return JSON only. Keep outputs production-safe, objective, and compatible with a structured design-token system. Use valid 6-digit hex colors. The result must be a review draft, not arbitrary code.",
      prompt: JSON.stringify(input),
    },
    themeDraftSchema,
  );
}

export async function generateWidgetRecommendations(input: {
  catalog: DashboardCatalogItem[];
  dayToDay: string;
  decisions: string;
  painPoints: string;
  reportingCadence: string;
  role: DashboardRole;
  title: string;
}) {
  return callGeminiJson(
    {
      instruction:
        "You recommend dashboard widgets from a governed catalog. Return JSON only. Only use widget keys from the provided catalog. Keep recommendations practical, high-impact, and limited to approved widgets. Every recommendation must include a clear structured explanation of why it matters daily.",
      prompt: JSON.stringify({
        ...input,
        catalog: input.catalog.map((item) => ({
          description: item.description,
          key: item.key,
          label: item.label,
          roles: item.roles,
          supportsCustomConfig: item.supportsCustomConfig ?? false,
        })),
      }),
    },
    widgetRecommendationResponseSchema,
  );
}

export async function inferImportPlan(input: {
  fileName: string;
  headers: string[];
  sampleRows: string[][];
}) {
  return callGeminiJson(
    {
      instruction:
        "You map nonprofit CSV headers into one of three CaseFlow core entities: clients, service_entries, or appointments. Return JSON only. Choose the single best target entity, map source headers to target fields, and call out ambiguities. Use transform hints such as normalize_date, keep_text, normalize_phone, map_enum, or ignore_column.",
      prompt: JSON.stringify(input),
    },
    importPlanSchema,
  );
}
