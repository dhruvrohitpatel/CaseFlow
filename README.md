# CaseFlow

CaseFlow is a nonprofit client and case management app built for the 2026 ASU WiCS Opportunity Hack. The current repo state includes the stable P0 foundation plus the P1 admin and operations layer: CSV import/export, reporting, scheduling, configurable fields, and audit logging.

## Scope in this pass

- Email/password auth with protected app routes
- Admin and staff roles with server-side checks
- Client intake, search, profile view, and service logging
- Client status tracking for active/inactive/archived reporting
- CSV import for clients with row-level validation feedback
- CSV export for clients and service logs
- Dashboard reporting with KPI cards, service mix, and visit trend
- Print-friendly report route
- Scheduling with appointments, today view, and this-week grouped layout
- Admin-configured custom fields for clients and service entries
- Audit logs for clients, service entries, appointments, and field definitions

P2 AI features remain intentionally out of scope.

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
- `/dashboard/print`
- `/clients`
- `/clients/new`
- `/clients/[id]`
- `/schedule`
- `/admin`
- `/api/templates/clients`
- `/api/exports/clients`
- `/api/exports/service-logs`

## Database schema

The schema is split across:

- [20260328120000_initial_p0.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328120000_initial_p0.sql)
- [20260328150000_p1_extension.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328150000_p1_extension.sql)

Core tables:

- `profiles`
  - maps to `auth.users`
  - stores `role` as `admin` or `staff`
- `clients`
  - stores demographics, contact details, generated public `client_id`, and explicit `status`
- `service_types`
  - stores seeded dropdown values for service logging
- `service_entries`
  - stores dated service history tied to clients and staff members
- `appointments`
  - stores scheduled visits, reminder status, location, and assigned staff member
- `custom_field_definitions`
  - stores admin-managed field definitions for `client` and `service_entry`
- `client_custom_field_values`
  - stores dynamic values for client records
- `service_entry_custom_field_values`
  - stores dynamic values for service logs
- `audit_logs`
  - stores redacted create/update/delete history for core P1 entities
- `organization_settings`
  - single-org placeholder for future expansion

Key schema behavior:

- new auth users automatically create or update a `profiles` row
- `client_id` is generated in Postgres
- `updated_at` is maintained by triggers
- audit triggers log changes without storing raw service note bodies
- RLS is enabled for all core tables, with admin-only access for field definition writes and audit log reads

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
4. Apply both migration files in `supabase/migrations/` in timestamp order.
5. Copy the project URL, anon key, and service role key into `.env.local`.

Optional Google auth:

1. Enable the Google provider in Supabase.
2. Add the callback URL:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain/auth/callback`
3. Add your Google client ID and secret in Supabase.

If Google auth is not configured, email/password auth still works and remains the default path.

## Local development

Install dependencies:

```bash
pnpm install
```

Seed the database after the migrations have been applied:

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

The seed also creates:

- 10 demo clients
- 30 demo service entries
- 6 upcoming appointments
- 4 custom field definitions with sample values

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
2. Confirm `/dashboard` loads with:
   - total active clients
   - services this week
   - services this month
   - services this quarter
3. Confirm the service mix bar chart and visit trend chart render.
4. Open `/dashboard/print` and confirm it loads without the main app shell.
5. Download:
   - `/api/templates/clients`
   - `/api/exports/clients`
   - `/api/exports/service-logs`
6. Open `/clients` and search for a seeded client by name.
7. Open a client profile and confirm:
   - demographics render
   - client status is visible
   - custom client fields render
   - service history is newest first
   - custom service-entry fields render when present
8. Open `/clients/new` and create a new client.
9. Confirm the generated `client_id` is shown on the profile page after create.
10. Add a new service entry and confirm it appears at the top of the history.
11. Open `/schedule` and confirm:
   - the create-appointment form works
   - today view shows same-day appointments
   - the week view groups appointments by day
12. Open `/admin` as the admin user and confirm:
   - CSV import form appears
   - custom field management appears
   - audit log entries appear
13. Add a custom client field in `/admin`, then open `/clients/new` and confirm the field renders.
14. Sign in with `staff@caseflow.demo`.
15. Confirm staff can use dashboard, clients, and schedule.
16. Confirm staff does not see the `Admin` nav item and cannot access `/admin`.

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
   - create appointment
   - access admin page as admin
   - export a CSV

## Project structure

- `app/`
  - App Router pages, layouts, route handlers, and server actions
- `components/`
  - reusable forms, dashboard pieces, layout pieces, and UI primitives
- `lib/`
  - env validation, auth/session helpers, Supabase helpers, validators, reporting, CSV parsing, scheduling, and custom-field utilities
- `supabase/migrations/`
  - SQL schema for P0 and P1
- `scripts/seed.ts`
  - repeatable demo data script

## Deferred intentionally

- reminder delivery by email or SMS
- recurring appointments or drag-and-drop calendar UX
- PDF generation
- custom-field CSV mapping
- advanced chart drilldowns or complex interactive filtering
- document uploads
- OCR or photo-to-intake flows
- semantic search
- client summaries
- voice-to-note workflows
- multi-org support
- all P2 AI features
