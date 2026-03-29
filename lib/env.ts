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

export function getGeminiApiKey() {
  return geminiApiKeySchema.parse(process.env.GEMINI_API_KEY);
}

export function getGeminiTextModel() {
  return geminiTextModelSchema.parse(process.env.GEMINI_TEXT_MODEL);
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
