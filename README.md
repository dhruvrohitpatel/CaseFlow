# CaseFlow

CaseFlow is a nonprofit client and case management app built for the 2026 ASU WiCS Opportunity Hack. The current repo state includes the stable P0 foundation, the P1 admin and operations layer, and the current auth simplification pass with a public landing page, Google-first sign-in, allowlist-based access control, and role-routed dashboards.

## Scope in this pass

- Public landing page with sign-in entry point
- Google-first auth with protected app routes
- Approved email/password fallback for users who cannot use Google
- Admin, staff, and invite-only client roles with server-side checks
- Client intake, search, profile view, and service logging
- Role-routed dashboards for admin, staff, and client experiences
- Client status tracking for active/inactive/archived reporting
- CSV import for clients with row-level validation feedback
- CSV export for clients and service logs
- Dashboard reporting with KPI cards, service mix, and visit trend
- Print-friendly report route
- Scheduling with appointments, today view, and this-week grouped layout
- Admin-configured custom fields for clients and service entries
- Audit logs for clients, service entries, appointments, and field definitions
- Admin-managed approved email allowlist with explicit client-role links
- Semantic note search for admin and staff dashboards using Gemini embeddings + pgvector

P2 AI features remain intentionally out of scope.

## Tech stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth + Postgres
- Vercel

## Routes

- `/`
- `/login`
- `/reset-password`
- `/dashboard`
- `/dashboard/admin`
- `/dashboard/staff`
- `/dashboard/client`
- `/dashboard/print`
- `/clients`
- `/clients/new`
- `/clients/[id]`
- `/schedule`
- `/admin`
- `/api/templates/clients`
- `/api/exports/clients`
- `/api/exports/service-logs`
- `/api/search`

## Database schema

The schema is split across:

- [20260328120000_initial_p0.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328120000_initial_p0.sql)
- [20260328150000_p1_extension.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328150000_p1_extension.sql)
- [20260328213000_client_portal_and_security.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328213000_client_portal_and_security.sql)
- [20260328233000_access_allowlist.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328233000_access_allowlist.sql)
- [20260328234500_semantic_search.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328234500_semantic_search.sql)

Core tables:

- `profiles`
  - maps to `auth.users`
  - stores `role` as `admin`, `staff`, or `client`
- `clients`
  - stores demographics, contact details, generated public `client_id`, explicit `status`, and optional linked client portal profile
- `access_allowlist`
  - stores approved emails, roles, optional client links, active status, and admin notes
- `service_types`
  - stores seeded dropdown values for service logging
- `service_entries`
  - stores dated service history tied to clients and staff members, plus optional semantic embeddings for note search
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
- Google or password sign-in only grants access if the email is active in `access_allowlist`
- roles are synchronized from the allowlist on sign-in
- `client_id` is generated in Postgres
- `updated_at` is maintained by triggers
- audit triggers log changes without storing raw service note bodies
- RLS is enabled for all core tables
- exports and audit log access are admin-only
- client portal users can read only their linked client record, their own appointments, and safe service metadata

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
GEMINI_API_KEY=...
```

For Vercel production, set `NEXT_PUBLIC_APP_URL` to your live domain.

## Supabase setup

1. Create a new Supabase project.
2. In `Authentication -> Providers`, enable Google and Email.
3. Add your Google OAuth credentials in Supabase and include:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain/auth/callback`
4. For the smoothest hackathon flow, disable email confirmation in `Authentication -> Providers -> Email`.
5. Apply all migration files in `supabase/migrations/` in timestamp order.
6. Copy the project URL, anon key, and service role key into `.env.local`.
7. Add `GEMINI_API_KEY` to `.env.local` and Vercel if you want semantic note search enabled.
8. Manage approved emails and role assignments from the admin UI after the first admin signs in.

## Local development

Install dependencies:

```bash
pnpm install
```

Seed the database after the migrations have been applied:

```bash
pnpm seed
```

Backfill embeddings for existing service entries after seeding or after deploying the semantic-search migration:

```bash
pnpm backfill:embeddings
```

Run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Demo credentials

The seed script creates three demo users:

- `admin@caseflow.demo`
- `staff@caseflow.demo`
- `client@caseflow.demo`

Password for all three:

```text
CaseFlowDemo123!
```

The seed also creates:

- 10 demo clients
- 30 demo service entries
- 6 upcoming appointments
- 4 custom field definitions with sample values
- 1 linked demo client portal account for `CF-DEMO-001`

## Exact testing checklist

Run these commands in order:

```bash
pnpm install
cp .env.example .env.local
pnpm seed
pnpm backfill:embeddings
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Then verify in the browser:

1. Open `/` and confirm the public overview page loads with a sign-in CTA.
2. Open `/login` and confirm Google is the primary sign-in action.
3. Confirm the approved password fallback is also visible.
4. Sign in with `admin@caseflow.demo`.
5. Confirm `/dashboard` routes to `/dashboard/admin` and loads with:
   - total active clients
   - services this week
   - services this month
   - services this quarter
6. Confirm the service mix bar chart and visit trend chart render.
7. Open `/dashboard/print` and confirm it loads without the main app shell.
8. Download:
   - `/api/templates/clients`
   - `/api/exports/clients`
   - `/api/exports/service-logs`
9. Open `/clients` and search for a seeded client by name.
10. Open a client profile and confirm:
   - demographics render
   - client status is visible
   - custom client fields render
   - service history is newest first
   - custom service-entry fields render when present
11. Open `/clients/new` and create a new client.
12. Confirm the generated `client_id` is shown on the profile page after create.
13. Add a new service entry and confirm it appears at the top of the history.
14. Open `/schedule` and confirm:
   - the create-appointment form works
   - today view shows same-day appointments
   - the week view groups appointments by day
15. Open `/admin` as the admin user and confirm:
   - team access approval appears
   - client portal access approval appears
   - approved access table appears
   - CSV import form appears
   - custom field management appears
   - audit log entries appear
16. Add a custom client field in `/admin`, then open `/clients/new` and confirm the field renders.
17. Sign in with `staff@caseflow.demo`.
18. Confirm `/dashboard` routes to `/dashboard/staff`.
19. Confirm staff can use dashboard, clients, and schedule.
20. Confirm staff does not see the `Admin` nav item and cannot access `/admin`.
21. Sign in with `client@caseflow.demo`.
22. Confirm `/dashboard` routes to `/dashboard/client`.
23. Confirm the client sees only status, appointments, and safe recent activity without internal note bodies.
24. Confirm the client cannot access `/clients`, `/admin`, `/schedule`, or admin export routes.
25. Sign back in as `admin@caseflow.demo` or `staff@caseflow.demo`.
26. Open the semantic search card on `/dashboard/admin` or `/dashboard/staff`.
27. Search for seeded note language such as `housing`, `food`, or `follow-up` and confirm matching service notes appear.
28. Confirm `/api/search?q=housing` returns `401` when signed out and `403` when called by a `client` user.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Set these environment variables in Vercel:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Redeploy after setting env vars.
5. In Supabase Auth settings, add your Vercel production URL to allowed redirects.
6. Run the semantic-search migration and then `pnpm backfill:embeddings` against the production database.
6. Run the production verification checklist:
   - sign in
   - create client
   - search client
   - open client profile
   - log service entry
   - create appointment
    - access admin page as admin
    - export a CSV
   - run semantic note search as an admin or staff user

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

## Additional docs

- [ux-review.md](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/ux-review.md)
- [feature-test-guide.md](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/feature-test-guide.md)

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
