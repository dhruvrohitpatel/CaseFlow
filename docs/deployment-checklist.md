# Deployment Checklist

Use this checklist when a student, volunteer, or operator is standing up a new CaseFlow deployment.

## Before deployment

- collect the nonprofit logo and favicon
- confirm the support email or support phone number
- gather the first approved admin email addresses
- confirm which Google or Gmail accounts will sign in
- decide whether premium admin AI or premium search should be enabled

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENABLE_SPEED_INSIGHTS`
- `NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE`
- `AI_PROVIDER`
- `AI_PLAN_TIER`
- `ADMIN_AI_ENABLED`
- `SEMANTIC_SEARCH_ENABLED`

Optional when AI is enabled:

- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL`
- `OPENAI_VISION_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `GEMINI_API_KEY`

Optional after the final production domain is known:

- `NEXT_PUBLIC_APP_URL`

## Supabase setup

1. Create the Supabase project.
2. Apply every SQL file in `supabase/migrations/` in timestamp order.
3. Configure Google OAuth in Supabase Auth.
4. Add redirect URLs for:
   - `http://localhost:3000/auth/callback`
   - `https://<your-domain>/auth/callback`

## Vercel setup

1. Import the repo or template into Vercel.
2. Add the required environment variables.
3. Deploy `main`.
4. Visit the deployment and verify the public landing page and login page load.

## First-run verification

1. Sign in as the first approved admin.
2. Complete `/setup`.
3. Confirm branding updates apply to `/`, `/login`, and the dashboard shell.
4. Confirm `/admin`, `/clients`, `/schedule`, and `/dashboard/admin` load.
5. If semantic search is enabled, run `pnpm backfill:embeddings` against the target data.

## Speed Insights verification

- Set `ENABLE_SPEED_INSIGHTS=true` in Vercel.
- Leave `NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE` empty for the default behavior or set:
  - `1` for full production sampling
  - `0.25` for lighter preview sampling
- Browse a few pages on the deployed site.
- Confirm metrics appear in the Vercel Speed Insights dashboard.

## Handoff

- confirm at least one admin can sign in
- confirm support contact information is present
- confirm imports or starter data are documented
- give the nonprofit the hosted URL and admin login instructions
