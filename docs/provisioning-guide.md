# Provisioning Guide

Use this when standing up a new nonprofit deployment of CaseFlow.

## Provisioning sequence

1. Create a new Supabase project.
2. Create a new Vercel project for the nonprofit.
3. Apply every migration in `supabase/migrations/` in timestamp order.
4. Configure Google OAuth in Supabase Auth.
5. Set Vercel environment variables:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER`
   - `AI_PLAN_TIER`
   - `ADMIN_AI_ENABLED`
   - `SEMANTIC_SEARCH_ENABLED`
   - `OPENAI_API_KEY` when premium admin AI or semantic search is enabled
   - optional `GEMINI_API_KEY` only if you want Gemini available as a secondary provider
6. Deploy `main`.
7. Sign in as the first approved admin.
8. Complete `/setup`.
9. Add allowlist entries, import data, and hand off the launch package.

## OAuth reminders

- Google redirect URI in Google Cloud:
  - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
- Allowed redirect URLs in Supabase:
  - `http://localhost:3000/auth/callback`
  - `https://<your-domain>/auth/callback`
- Keep local and production callbacks both present. If local login returns to a Vercel domain, Supabase Auth or the project site URL is still favoring production instead of the localhost callback.

## Handoff checklist

- branding saved in `/setup`
- support contact configured
- at least one admin email approved
- initial staff emails approved
- client import plan documented
- client portal test completed
- semantic search migration applied
- embeddings backfilled if historical service notes exist
