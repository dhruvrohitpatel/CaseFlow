# CaseFlow

CaseFlow is a deploy-per-organization nonprofit case-management platform built around three calm, role-aware experiences:

- `admin` mission control for reporting, setup, access, and oversight
- `staff` workflows for intake, schedules, and service logging
- `client` read-only portal access for status, appointments, and safe activity history

This repo now supports white-label branding, an admin setup wizard, semantic note search, configurable fields, audit logs, and allowlist-based access control.

## Product shape

- Single nonprofit deployment per environment
- Google-first sign-in with approved password fallback
- Invite-only access via `access_allowlist`
- White-label organization branding via `organization_settings`
- Guided setup workflow at `/setup`
- Admin, staff, and client dashboards

## Core capabilities

### Platform
- Public landing page and branded login
- Sticky in-app shell with role-aware navigation
- White-label colors, logo, favicon, support contact, and product copy
- Setup checklist that gates admin access until launch tasks are reviewed

### Client and staff operations
- Client intake, search, and profile management
- Service logging with configurable custom fields
- Scheduling with today and this-week views
- Semantic service-note search for admin and staff

### Admin operations
- Reporting dashboard with KPI cards and charts
- CSV client import with row-level validation
- Client and service-log CSV export
- Audit log viewer
- Approved-email allowlist management

## Routes

- `/`
- `/login`
- `/login/password`
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
- `/setup`
- `/api/templates/clients`
- `/api/exports/clients`
- `/api/exports/service-logs`
- `/api/search`

## Migrations

Apply every SQL file in `supabase/migrations/` in timestamp order:

- [20260328120000_initial_p0.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328120000_initial_p0.sql)
- [20260328150000_p1_extension.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328150000_p1_extension.sql)
- [20260328213000_client_portal_and_security.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328213000_client_portal_and_security.sql)
- [20260328233000_access_allowlist.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328233000_access_allowlist.sql)
- [20260328234500_semantic_search.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260328234500_semantic_search.sql)
- [20260329001000_productization_white_label.sql](/Users/dhruvpatel/Desktop/Projects/CaseFlow/supabase/migrations/20260329001000_productization_white_label.sql)

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required values:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AI_PROVIDER=none
AI_PLAN_TIER=base
ADMIN_AI_ENABLED=false
SEMANTIC_SEARCH_ENABLED=false
OPENAI_API_KEY=...
OPENAI_TEXT_MODEL=gpt-5-nano
OPENAI_VISION_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Production notes:
- `NEXT_PUBLIC_APP_URL` should match the deployed domain
- AI is optional. The base product works with `AI_PROVIDER=none`
- `OPENAI_API_KEY` enables premium admin AI and the premium search add-on when the feature flags are enabled
- `GEMINI_API_KEY` can still be used as an optional secondary provider
- Google OAuth must be enabled in Supabase Auth
- for local development, Supabase Auth allowed redirect URLs must include `http://localhost:3000/auth/callback` or Google login may bounce back to production instead of localhost

## Local development

Install dependencies:

```bash
pnpm install
```

Seed the database after migrations:

```bash
pnpm seed
```

Backfill embeddings for existing service notes:

```bash
pnpm backfill:embeddings
```

Run verification:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Start the app:

```bash
pnpm dev
```

## Demo accounts

- `admin@caseflow.demo`
- `staff@caseflow.demo`
- `client@caseflow.demo`

Password:

```text
CaseFlowDemo123!
```

## Launch docs

- [Feature test guide](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/feature-test-guide.md)
- [UX review](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/ux-review.md)
- [Launch package](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/launch-package.md)
- [Provisioning guide](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/provisioning-guide.md)
- [Admin onboarding guide](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/admin-onboarding-guide.md)
- [Staff quick-start](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/staff-quick-start.md)
- [Client portal guide](/Users/dhruvpatel/Desktop/Projects/CaseFlow/docs/client-portal-guide.md)

## Deploy-per-org workflow

CaseFlow is packaged as an operator-managed deployment kit:

1. provision Supabase and Vercel for a nonprofit
2. apply the migrations
3. seed demo data only if needed for onboarding
4. configure Google OAuth and env vars
5. sign in as the first admin
6. complete `/setup`
7. add allowlist entries, import clients, and launch

## Deferred intentionally

- arbitrary page-builder layouts
- spreadsheet field-mapping migration tools
- recurring appointments
- invitation emails and lifecycle notifications
- client messaging or document exchange
- multi-tenant shared runtime
