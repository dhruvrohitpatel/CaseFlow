# Provisioning Guide

Use this when standing up a new nonprofit deployment of CaseFlow.

## Deployment lanes

### Hosted for the nonprofit

Use this when you or a student/operator are provisioning the full stack and handing off a ready-to-use workspace.

### Student deploy

Use this when a CS student or technical volunteer is deploying from GitHub to their own Vercel and Supabase accounts with the repo checklist and deploy button.

## Provisioning sequence

1. Create a new Supabase project.
2. Create a new Vercel project for the nonprofit.
3. Apply every migration in `supabase/migrations/` in timestamp order.
4. Configure Google OAuth in Supabase Auth.
5. Set Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ENABLE_SPEED_INSIGHTS`
   - `NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE`
   - `AI_PROVIDER`
   - `AI_PLAN_TIER`
   - `ADMIN_AI_ENABLED`
   - `SEMANTIC_SEARCH_ENABLED`
   - `OPENAI_API_KEY` when premium admin AI or semantic search is enabled
    - optional `GEMINI_API_KEY` only if you want Gemini available as a secondary provider
   - optional `NEXT_PUBLIC_APP_URL` after the final production domain is known
6. Deploy `main`.
7. Sign in as the first approved admin.
8. Complete `/setup`.
9. Add allowlist entries, import data, and hand off the launch package.

## Student deploy flow

1. Click the Deploy with Vercel button in `README`.
2. Import the repo into the student’s GitHub and Vercel accounts.
3. Create a new Supabase project.
4. Add the required environment variables in Vercel.
5. Apply the Supabase migrations.
6. Configure Google OAuth in Supabase Auth.
7. Visit the Vercel deployment and complete `/setup`.

## OAuth reminders

- Google redirect URI in Google Cloud:
  - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
- Allowed redirect URLs in Supabase:
  - `http://localhost:3000/auth/callback`
  - `https://<your-domain>/auth/callback`
- Keep local and production callbacks both present. If local login returns to a Vercel domain, Supabase Auth or the project site URL is still favoring production instead of the localhost callback.

## Speed Insights verification

- Set `ENABLE_SPEED_INSIGHTS=true` in Vercel to collect metrics.
- Leave `NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE` empty for the default behavior or set:
  - `1` for 100% production sampling
  - `0.25` for lighter preview sampling
- After deployment, browse the app for at least a few page transitions and confirm metrics appear in the Vercel Speed Insights dashboard.

## Handoff checklist

- branding saved in `/setup`
- support contact configured
- at least one admin email approved
- initial staff emails approved
- client import plan documented
- client portal test completed
- Speed Insights verified in Vercel
- semantic search migration applied
- embeddings backfilled if historical service notes exist
