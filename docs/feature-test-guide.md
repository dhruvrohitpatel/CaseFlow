# Feature And Test Guide

This guide reflects the current CaseFlow productized build: branded deploy-per-org workspaces, setup wizard, allowlist auth, and role-based dashboards.

## Personas

### Admin
- completes `/setup`
- manages organization branding and support contact
- approves emails and links client portal accounts
- runs reporting, exports, audit review, and semantic search

### Staff
- manages intake, schedules, clients, and service logs
- uses semantic search
- does not access admin configuration or exports

### Client
- sees read-only case status, upcoming appointments, and safe activity metadata
- does not see internal note bodies or admin/staff routes

## Role matrix

| Capability | Admin | Staff | Client |
| --- | --- | --- | --- |
| Public landing page | Yes | Yes | Yes |
| Google-first sign-in | Yes | Yes | Yes |
| Password fallback | Yes | Yes | Yes |
| Setup wizard | Yes | No | No |
| White-label branding controls | Yes | No | No |
| Admin dashboard | Yes | No | No |
| Staff dashboard | No | Yes | No |
| Client dashboard | No | No | Yes |
| Create client records | Yes | Yes | No |
| Manage allowlist | Yes | No | No |
| CSV import/export | Yes | No | No |
| Semantic note search | Yes | Yes | No |
| Audit logs | Yes | No | No |

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Add:

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
```

Then:

```bash
pnpm seed
pnpm backfill:embeddings
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

## Exact test steps

### Public and login experience
1. Open `/`.
2. Confirm the page reads like a product portal, not an MVP demo.
3. Confirm organization name, subtitle, and support CTA reflect `organization_settings`.
4. Open `/login`.
5. Confirm the page shows branding, welcome copy, a `Continue with Google` button, and a `Don't have Google email` fallback link.
6. Open `/login/password`.
7. Confirm the password page is clearly secondary to Google sign-in.

### Setup wizard
1. Sign in as `admin@caseflow.demo`.
2. If setup is incomplete, confirm any protected admin route redirects to `/setup`.
3. In `/setup`, save:
   - organization name
   - subtitle
   - welcome copy
   - brand colors
   - support contact
4. Confirm those changes update:
   - `/`
   - `/login`
   - the app shell header
5. Mark access, starter data, and launch steps complete.
6. Confirm `/dashboard/admin` becomes the default destination after setup completion.

### Sticky shell and product chrome
1. Open `/dashboard/admin`, `/clients`, `/schedule`, and `/admin`.
2. Scroll the page.
3. Confirm the top header stays visible and gains a compact shadow state.
4. Confirm the shell shows organization branding, primary nav, role label, and support CTA.

### Admin operations
1. Open `/dashboard/admin`.
2. Confirm KPI cards, service mix, visit trend, semantic search, and access/setup cards render.
3. Confirm `/admin` includes:
   - allowlist management
   - CSV import
   - custom fields
   - audit log viewer
4. Confirm `/api/exports/clients` and `/api/exports/service-logs` still download for admin only.

### Staff workflow
1. Sign in as `staff@caseflow.demo`.
2. Confirm `/dashboard` redirects to `/dashboard/staff`.
3. Confirm staff sees quick actions, appointments, recent clients, recent service activity, and semantic search.
4. Confirm staff can create clients and service entries.
5. Confirm staff cannot access `/admin`, exports, or setup.

### Client portal
1. Sign in as `client@caseflow.demo`.
2. Confirm `/dashboard` redirects to `/dashboard/client`.
3. Confirm the support card reflects the configured organization support contact.
4. Confirm the client sees only:
   - case status
   - upcoming appointments
   - recent activity metadata
   - last interaction
5. Confirm internal notes remain hidden.

### White-label behavior
1. As admin, update the organization name, colors, and support CTA in `/setup`.
2. Refresh `/`, `/login`, and a protected page.
3. Confirm the new settings are applied consistently.
4. Upload a logo and favicon.
5. Confirm the shell and auth pages use the new logo.

### Security and access
1. Try `/api/search?q=housing` while signed out and confirm it is rejected.
2. Try the same route as a `client` user and confirm it is rejected.
3. Try `/admin` or `/setup` as `staff` or `client` and confirm redirect away.
4. Try `/api/exports/clients` as `staff` and `client` and confirm unauthorized behavior.

## Demo accounts

- `admin@caseflow.demo`
- `staff@caseflow.demo`
- `client@caseflow.demo`

Password:

```text
CaseFlowDemo123!
```

## Deferred intentionally

- arbitrary page-builder layout editing
- advanced spreadsheet migration mapping
- recurring appointments
- invitation email automation
- client messaging and uploads
