import { z } from "zod";

const aiProviderSchema = z.enum(["none", "gemini", "openai"]);
const aiPlanTierSchema = z.enum([
  "base",
  "premium_admin_ai",
  "premium_search",
  "premium_plus",
]);

export type AiFeatureKey = "admin_ai" | "semantic_search";
export type AiPlanTier = z.infer<typeof aiPlanTierSchema>;
export type AiProvider = z.infer<typeof aiProviderSchema>;

type AiFeatureState = {
  description: string;
  enabled: boolean;
  feature: AiFeatureKey;
  planLabel: string;
  provider: AiProvider;
  tier: AiPlanTier;
  unavailableMessage: string;
};

function parseBooleanFlag(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on", "enabled"].includes(value.trim().toLowerCase());
}

function inferRequestedProvider(rawOpenAiKey: string, rawGeminiKey: string): AiProvider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (explicit) {
    return aiProviderSchema.catch("none").parse(explicit);
  }

  if (rawOpenAiKey) {
    return "openai";
  }

  return rawGeminiKey ? "gemini" : "none";
}

export function getAiCapabilities() {
  const rawOpenAiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const rawGeminiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const requestedProvider = inferRequestedProvider(rawOpenAiKey, rawGeminiKey);
  const aiProvider: AiProvider =
    requestedProvider === "openai" && rawOpenAiKey
      ? "openai"
      : requestedProvider === "gemini" && rawGeminiKey
        ? "gemini"
        : "none";
  const adminAiEnabled =
    aiProvider !== "none" && parseBooleanFlag(process.env.ADMIN_AI_ENABLED, false);
  const semanticSearchEnabled =
    aiProvider !== "none" && parseBooleanFlag(process.env.SEMANTIC_SEARCH_ENABLED, false);
  const defaultTier = adminAiEnabled && semanticSearchEnabled
    ? "premium_plus"
    : adminAiEnabled
      ? "premium_admin_ai"
      : semanticSearchEnabled
        ? "premium_search"
        : "base";

  return {
    adminAiEnabled,
    aiPlanTier: aiPlanTierSchema.catch(defaultTier).parse(process.env.AI_PLAN_TIER),
    aiProvider,
    semanticSearchEnabled,
  };
}

export function getAiFeatureState(feature: AiFeatureKey): AiFeatureState {
  const capabilities = getAiCapabilities();

  if (feature === "semantic_search") {
    return {
      description:
        "Natural-language note search for internal admin and staff teams.",
      enabled: capabilities.semanticSearchEnabled,
      feature,
      planLabel: "Premium search add-on",
      provider: capabilities.aiProvider,
      tier: capabilities.aiPlanTier,
      unavailableMessage:
        capabilities.aiProvider === "none"
          ? "Semantic search is optional and is not configured for this workspace."
          : "Semantic search is available as a premium search add-on.",
    };
  }

  return {
    description:
      "Photo-to-intake, CSV mapping suggestions, widget recommendations, and theme drafts for admins.",
    enabled: capabilities.adminAiEnabled,
    feature,
    planLabel: "Premium admin AI",
    provider: capabilities.aiProvider,
    tier: capabilities.aiPlanTier,
    unavailableMessage:
      capabilities.aiProvider === "none"
        ? "Premium admin AI is optional and is not configured for this workspace."
        : "Premium admin AI is not enabled for this workspace.",
  };
}

export function isSemanticSearchEnabled() {
  return getAiCapabilities().semanticSearchEnabled;
}

export function isAdminAiEnabled() {
  return getAiCapabilities().adminAiEnabled;
}

export function formatAiFeatureError(feature: AiFeatureKey, error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("quota") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("429")
  ) {
    return feature === "semantic_search"
      ? "Semantic search is temporarily unavailable for this workspace. Standard case activity is still available."
      : "Premium admin AI is temporarily unavailable. Use the included manual workflow for now.";
  }

  if (
    normalized.includes("not configured") ||
    normalized.includes("missing ai provider") ||
    normalized.includes("gemini_api_key") ||
    normalized.includes("openai_api_key")
  ) {
    return getAiFeatureState(feature).unavailableMessage;
  }

  return feature === "semantic_search"
    ? "Semantic search is unavailable right now. Standard case activity is still available."
    : "Premium admin AI is unavailable right now. Use the manual workflow for now.";
}
