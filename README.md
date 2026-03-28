# CaseFlow

CaseFlow is a nonprofit client and case management MVP built for the 2026 ASU WiCS Opportunity Hack. This P0 pass focuses on a stable, demoable foundation: authentication, client registration, client search, client profiles, service logging, seed data, and Vercel-ready deployment.

## Scope in this pass

- Email/password auth with protected app routes
- Admin and staff roles with server-side checks
- Client registration with generated `client_id`
- Client directory with search and newest-first ordering
- Client profile view with demographics and reverse chronological service history
- Service/visit logging with seeded service type defaults
- Supabase schema, repeatable seed script, and Vercel deployment readiness

P1 and P2 features are intentionally out of scope in this repo state.

## Tech stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth + Postgres
- Vercel

## Routes

- `/login`
- `/dashboard`
- `/clients`
- `/clients/new`
- `/clients/[id]`

## Database schema

The P0 schema lives in [supabase/migrations/20260328120000_initial_p0.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328120000_initial_p0.sql).

Core tables:

- `profiles`
  - maps to `auth.users`
  - stores `role` as `admin` or `staff`
- `clients`
  - stores demographics, contact details, and generated public `client_id`
- `service_types`
  - stores seeded dropdown values for service logging
- `service_entries`
  - stores dated service history tied to clients and staff members
- `organization_settings`
  - single-org placeholder for future expansion

Key schema behavior:

- New auth users automatically create or update a `profiles` row.
- `client_id` is generated in Postgres.
- `updated_at` is maintained by triggers.
- RLS is enabled for all P0 tables.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values from Supabase:

```bash
cp .env.example .env.local
```

Required variables:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For Vercel production, set `NEXT_PUBLIC_APP_URL` to your live domain.

## Supabase setup

1. Create a new Supabase project.
2. In `Authentication -> Providers`, leave email/password enabled.
3. For the smoothest hackathon flow, disable email confirmation in `Authentication -> Providers -> Email`.
4. Run the SQL in [supabase/migrations/20260328120000_initial_p0.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328120000_initial_p0.sql).
5. Copy the project URL, anon key, and service role key into `.env.local`.

Optional Google auth:

1. Enable the Google provider in Supabase.
2. Add the callback URL:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain/auth/callback`
3. Add your Google client ID and secret in Supabase.

If Google auth is not configured, email/password auth still works and remains the default P0 path.

## Local development

Install dependencies:

```bash
pnpm install
```

Seed the database after the migration has been applied:

```bash
pnpm seed
```

Run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Demo credentials

The seed script creates two demo users:

- `admin@caseflow.demo`
- `staff@caseflow.demo`

Password for both:

```text
CaseFlowDemo123!
```

The admin user gets the `admin` role. The staff user gets the `staff` role.

## Exact testing checklist

Run these commands in order:

```bash
pnpm install
cp .env.example .env.local
pnpm seed
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Then verify in the browser:

1. Sign in with `admin@caseflow.demo`.
2. Confirm `/dashboard` loads and `/login` redirects away when authenticated.
3. Sign out and confirm protected pages redirect back to `/login`.
4. Sign in again and open `/clients`.
5. Search for seeded clients by full name.
6. Open a client profile and confirm demographics render at the top.
7. Confirm service history is shown newest first.
8. Open `/clients/new` and create a new client.
9. Confirm a generated `client_id` is shown on the profile page after create.
10. Add a new service entry to that client.
11. Confirm the new entry appears at the top of the service history.
12. Sign in with `staff@caseflow.demo` and confirm the app still works.
13. Confirm the admin-only setup card appears for the admin user and not for the staff user.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Set these environment variables in Vercel:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy after setting env vars.
5. In Supabase Auth settings, add your Vercel production URL to allowed redirects.
6. Run the production verification checklist:
   - sign in
   - create client
   - search client
   - open client profile
   - log service entry

## Project structure

- `app/`
  - App Router pages, layouts, route handlers, and server actions
- `components/`
  - reusable forms, layout pieces, and shadcn UI primitives
- `lib/`
  - env validation, auth/session helpers, Supabase clients, validators, and types
- `supabase/migrations/`
  - SQL schema for P0
- `scripts/seed.ts`
  - repeatable demo data script

## Not built yet

- Configurable custom fields
- Scheduling and appointments
- Audit logs
- Document uploads
- OCR or photo-to-intake flows
- Semantic search
- Client summaries
- Voice-to-note workflows
- Multi-org support
- Admin management UI beyond the minimal setup guidance in the dashboard
