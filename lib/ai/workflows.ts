import { z } from "zod";

import type { DashboardCatalogItem, DashboardRole } from "@/lib/dashboard-layouts";
import { getAiCapabilities } from "@/lib/ai/capabilities";
import {
  fileToDataUrl,
  callOpenAiTextJson,
  callOpenAiVisionJson,
} from "@/lib/ai/openai";
import {
  generateThemeDraft as generateGeminiThemeDraft,
  generateWidgetRecommendations as generateGeminiWidgetRecommendations,
  inferImportPlan as inferGeminiImportPlan,
} from "@/lib/ai/gemini-workflows";
import { fontPairKeySchema, themePresetKeySchema } from "@/lib/theme-presets";

export const themeDraftSchema = z.object({
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

const themeDraftJsonSchema = {
  properties: {
    accent_color: { type: "string" },
    border_color: { type: "string" },
    canvas_color: { type: "string" },
    card_color: { type: "string" },
    font_pair_key: { enum: ["system-sans", "editorial-serif", "humanist-sans", "notepad-mono"], type: "string" },
    imagery_prompt: { type: "string" },
    primary_color: { type: "string" },
    rationale: { type: "string" },
    suggested_copy_tone: { type: "string" },
    surface_tint: { type: "string" },
    theme_preset_key: { enum: ["day", "night", "noir", "notepad", "custom"], type: "string" },
  },
  required: [
    "accent_color",
    "border_color",
    "canvas_color",
    "card_color",
    "font_pair_key",
    "imagery_prompt",
    "primary_color",
    "rationale",
    "suggested_copy_tone",
    "surface_tint",
    "theme_preset_key",
  ],
  type: "object",
};

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

const widgetRecommendationJsonSchema = {
  properties: {
    recommendations: {
      items: {
        properties: {
          key: { type: "string" },
          size: { enum: ["sm", "md", "lg", "full"], type: "string" },
          title: { type: "string" },
          why: {
            properties: {
              dataset: { type: "string" },
              frequency: { type: "string" },
              supporting_decision: { type: "string" },
              trigger: { type: "string" },
            },
            required: ["dataset", "frequency", "supporting_decision", "trigger"],
            type: "object",
          },
        },
        required: ["key", "size", "why"],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["recommendations"],
  type: "object",
};

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

const importPlanJsonSchema = {
  properties: {
    confidence_summary: { type: "string" },
    header_mappings: {
      items: {
        properties: {
          source_header: { type: "string" },
          target_field: { type: "string" },
          transform_hint: { type: "string" },
        },
        required: ["source_header", "target_field", "transform_hint"],
        type: "object",
      },
      type: "array",
    },
    target_entity: { enum: ["clients", "service_entries", "appointments"], type: "string" },
    warnings: {
      items: { type: "string" },
      type: "array",
    },
  },
  required: ["confidence_summary", "header_mappings", "target_entity", "warnings"],
  type: "object",
};

const fieldConfidenceSchema = z.enum(["high", "medium", "low", "unknown"]).default("unknown");

export const intakeExtractionSchema = z.object({
  coreFields: z.object({
    dateOfBirth: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    housingStatus: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    preferredLanguage: z.string().nullable().optional(),
    preferredName: z.string().nullable().optional(),
    pronouns: z.string().nullable().optional(),
    referralSource: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
  }),
  customFields: z.array(
    z.object({
      definitionId: z.string().min(1),
      fieldKey: z.string().min(1),
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
  fieldConfidence: z.object({
    core: z.record(z.string(), fieldConfidenceSchema).default({}),
    custom: z.record(z.string(), fieldConfidenceSchema).default({}),
  }),
  unmappedObservations: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

const intakeExtractionJsonSchema = {
  properties: {
    coreFields: {
      properties: {
        dateOfBirth: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        fullName: { type: ["string", "null"] },
        housingStatus: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        preferredLanguage: { type: ["string", "null"] },
        preferredName: { type: ["string", "null"] },
        pronouns: { type: ["string", "null"] },
        referralSource: { type: ["string", "null"] },
        status: { type: ["string", "null"] },
      },
      required: [
        "dateOfBirth",
        "email",
        "fullName",
        "housingStatus",
        "phone",
        "preferredLanguage",
        "preferredName",
        "pronouns",
        "referralSource",
        "status",
      ],
      type: "object",
    },
    customFields: {
      items: {
        properties: {
          definitionId: { type: "string" },
          fieldKey: { type: "string" },
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["definitionId", "fieldKey", "label", "value"],
        type: "object",
      },
      type: "array",
    },
    fieldConfidence: {
      properties: {
        core: {
          additionalProperties: {
            enum: ["high", "medium", "low", "unknown"],
            type: "string",
          },
          type: "object",
        },
        custom: {
          additionalProperties: {
            enum: ["high", "medium", "low", "unknown"],
            type: "string",
          },
          type: "object",
        },
      },
      required: ["core", "custom"],
      type: "object",
    },
    unmappedObservations: {
      items: { type: "string" },
      type: "array",
    },
    warnings: {
      items: { type: "string" },
      type: "array",
    },
  },
  required: ["coreFields", "customFields", "fieldConfidence", "unmappedObservations", "warnings"],
  type: "object",
};

function requireAiProvider() {
  const { aiProvider } = getAiCapabilities();

  if (aiProvider === "none") {
    throw new Error("Missing AI provider configuration.");
  }

  return aiProvider;
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
  const provider = requireAiProvider();

  if (provider === "gemini") {
    return generateGeminiThemeDraft(input);
  }

  return callOpenAiTextJson(
    {
      instruction:
        "You are designing a nonprofit operations product theme. Return JSON only. Keep outputs production-safe, objective, and compatible with a structured design-token system. Use valid 6-digit hex colors. The result must be a review draft, not arbitrary code.",
      prompt: JSON.stringify(input),
      schema: themeDraftJsonSchema,
      schemaName: "theme_draft",
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
  const provider = requireAiProvider();

  if (provider === "gemini") {
    return generateGeminiWidgetRecommendations(input);
  }

  return callOpenAiTextJson(
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
      schema: widgetRecommendationJsonSchema,
      schemaName: "widget_recommendations",
    },
    widgetRecommendationResponseSchema,
  );
}

export async function inferImportPlan(input: {
  fileName: string;
  headers: string[];
  sampleRows: string[][];
}) {
  const provider = requireAiProvider();

  if (provider === "gemini") {
    return inferGeminiImportPlan(input);
  }

  return callOpenAiTextJson(
    {
      instruction:
        "You map nonprofit CSV headers into one of three CaseFlow core entities: clients, service_entries, or appointments. Return JSON only. Choose the single best target entity, map source headers to target fields, and call out ambiguities. Use transform hints such as normalize_date, keep_text, normalize_phone, map_enum, or ignore_column.",
      prompt: JSON.stringify(input),
      schema: importPlanJsonSchema,
      schemaName: "import_mapping_plan",
    },
    importPlanSchema,
  );
}

export async function extractIntakeFromImage(input: {
  customFields: Array<{
    definitionId: string;
    fieldKey: string;
    fieldType: string;
    isRequired: boolean;
    label: string;
    options: string[];
  }>;
  file: File;
}) {
  const provider = requireAiProvider();

  if (provider === "gemini") {
    throw new Error("Photo-to-intake is currently available with the OpenAI provider.");
  }

  const imageDataUrl = await fileToDataUrl(input.file);

  return callOpenAiVisionJson(
    {
      imageDataUrl,
      instruction:
        "You extract client intake information from a photographed paper form. Return JSON only. Use only the supported CaseFlow client fields and the provided active custom field definitions. Do not invent new fields. If uncertain, leave the value null or omit the custom field and add a warning.",
      prompt: JSON.stringify({
        activeClientCustomFields: input.customFields,
        allowedCoreFields: [
          "fullName",
          "dateOfBirth",
          "phone",
          "email",
          "preferredName",
          "preferredLanguage",
          "pronouns",
          "housingStatus",
          "referralSource",
          "status",
        ],
      }),
      schema: intakeExtractionJsonSchema,
      schemaName: "photo_intake_extraction",
    },
    intakeExtractionSchema,
  );
}
