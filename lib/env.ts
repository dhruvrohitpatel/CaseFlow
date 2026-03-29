import { z } from "zod";

const supabasePublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
});

const serverEnvSchema = supabasePublicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const geminiApiKeySchema = z.string().min(1);
const geminiTextModelSchema = z.string().min(1).default("gemini-2.0-flash");
const openAiApiKeySchema = z.string().min(1);
const openAiTextModelSchema = z.string().min(1).default("gpt-5-nano");
const openAiVisionModelSchema = z.string().min(1).default("gpt-4.1-mini");
const openAiEmbeddingModelSchema = z.string().min(1).default("text-embedding-3-small");

export function getSupabasePublicEnv() {
  return supabasePublicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}

export function getServerEnv() {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getOptionalGeminiApiKey() {
  const rawValue = process.env.GEMINI_API_KEY?.trim();

  if (!rawValue) {
    return null;
  }

  return geminiApiKeySchema.parse(rawValue);
}

export function getGeminiApiKey() {
  const value = getOptionalGeminiApiKey();

  if (!value) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return value;
}

export function getGeminiTextModel() {
  return geminiTextModelSchema.parse(process.env.GEMINI_TEXT_MODEL);
}

export function getOptionalOpenAiApiKey() {
  const rawValue = process.env.OPENAI_API_KEY?.trim();

  if (!rawValue) {
    return null;
  }

  return openAiApiKeySchema.parse(rawValue);
}

export function getOpenAiApiKey() {
  const value = getOptionalOpenAiApiKey();

  if (!value) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return value;
}

export function getOpenAiTextModel() {
  return openAiTextModelSchema.parse(process.env.OPENAI_TEXT_MODEL);
}

export function getOpenAiVisionModel() {
  return openAiVisionModelSchema.parse(process.env.OPENAI_VISION_MODEL);
}

export function getOpenAiEmbeddingModel() {
  return openAiEmbeddingModelSchema.parse(process.env.OPENAI_EMBEDDING_MODEL);
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (explicitUrl) {
    return z.string().url().parse(explicitUrl);
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return z.string().url().parse(`https://${vercelUrl}`);
  }

  throw new Error(
    "Missing NEXT_PUBLIC_APP_URL. Set it explicitly or provide VERCEL_URL at runtime.",
  );
}
