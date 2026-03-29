# Feature And Test Guide

This guide summarizes what is implemented in CaseFlow today and how to verify it locally.

## Personas

### Admin
- Sign in with an organization-provisioned account
- Lands on `/dashboard/admin`
- Can view reporting, exports, print view, admin tools, audit logs, configurable fields, CSV import, and account management
- Can create staff accounts
- Can create client portal accounts linked to existing clients
- Can create client records and service entries

### Staff
- Sign in with an organization-provisioned account
- Lands on `/dashboard/staff`
- Can create client records
- Can log service entries
- Can use scheduling and client search/profile workflows
- Cannot access admin tools, audit logs, exports, or account provisioning

### Client
- Sign in with an invite-only linked portal account
- Lands on `/dashboard/client`
- Can view only their own case status, upcoming appointments, and recent service activity metadata
- Cannot access staff/admin routes, exports, configurable fields, audit logs, or internal note bodies

## Role matrix

| Capability | Admin | Staff | Client |
| --- | --- | --- | --- |
| Public landing page | Yes | Yes | Yes |
| Sign in | Yes | Yes | Yes |
| Public signup | No | No | No |
| Forced password reset | Yes | Yes | Yes |
| Admin dashboard | Yes | No | No |
| Staff dashboard | No | Yes | No |
| Client dashboard | No | No | Yes |
| Create client records | Yes | Yes | No |
| Create staff accounts | Yes | No | No |
| Create linked client portal accounts | Yes | No | No |
| View client directory | Yes | Yes | No |
| View own client portal data | No | No | Yes |
| CSV import/export | Yes | No | No |
| Audit logs | Yes | No | No |

## Implemented features

### Public and auth flow
- Public landing page at `/`
- Sign-in-only login page at `/login`
- Role-based dashboard routing via `/dashboard`
- Admin-created temporary-password accounts
- Forced reset flow at `/reset-password`

### Internal operations
- Client intake form
- Client directory with search
- Client profile with demographics and service history
- Service logging with configurable service types
- Scheduling with today and week views
- Basic reporting and print-friendly dashboard

### Admin tools
- Client CSV import with row-level validation feedback
- Client CSV export
- Service log CSV export
- Configurable client and service-entry fields
- Audit log viewer
- Staff account creation
- Invite-only client portal account creation

### Client portal
- Read-only dashboard with:
  - case status
  - upcoming appointments
  - recent service activity count
  - last interaction date
  - help/contact card
  - recent activity timeline without raw notes

## Local setup

```bash
pnpm install
cp .env.example .env.local
```

Set these values in `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Apply all SQL migrations in `supabase/migrations/` to your Supabase project, then seed:

```bash
pnpm seed
```

Run verification commands:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

## Demo credentials

- `admin@caseflow.demo`
- `staff@caseflow.demo`
- `client@caseflow.demo`

Password for all demo users:

```text
CaseFlowDemo123!
```

## Exact test steps

### Public UX
1. Open `http://localhost:3000/`.
2. Confirm the page explains CaseFlow and has a clear `Sign in` action.
3. Confirm unauthenticated visitors are not dropped straight into the app shell.

### Login and reset flow
1. Open `/login`.
2. Confirm there is no public signup form.
3. Confirm the page states accounts are provisioned by the organization.
4. If you create a new managed account from `/admin`, sign in with the temporary password.
5. Confirm the user is forced to `/reset-password`.
6. Set a new password and confirm the user then lands on the correct dashboard.

### Admin dashboard and tools
1. Sign in as `admin@caseflow.demo`.
2. Confirm `/dashboard` redirects to `/dashboard/admin`.
3. Confirm KPI cards, service mix, visit trend, and access overview render.
4. Confirm `/dashboard/print` loads.
5. Confirm `/api/exports/clients` downloads as CSV.
6. Confirm `/api/exports/service-logs` downloads as CSV.
7. Open `/admin`.
8. Confirm the page includes:
   - staff account creation
   - client portal account creation
   - CSV import
   - configurable fields
   - audit log viewer
9. Create a staff account and confirm the success message includes a temporary password.
10. Create a client portal account for an unlinked client and confirm it appears in the linked client portal table.

### Staff workflow
1. Sign in as `staff@caseflow.demo`.
2. Confirm `/dashboard` redirects to `/dashboard/staff`.
3. Confirm the page shows today’s appointments, active clients, and recent service activity.
4. Confirm staff can open `/clients`, `/clients/new`, and `/schedule`.
5. Create a client record.
6. Open that client profile and add a service entry.
7. Confirm the service entry appears at the top of the service history.

### Client portal
1. Sign in as `client@caseflow.demo`.
2. Confirm `/dashboard` redirects to `/dashboard/client`.
3. Confirm the client sees:
   - current case status
   - upcoming appointments
   - recent activity count
   - last interaction date
4. Confirm the recent activity timeline shows date, service type, and staff member only.
5. Confirm internal note bodies are not visible.

### Access control checks
1. As `staff`, try to open `/admin`.
2. Confirm the user is redirected away from admin-only pages.
3. As `client`, try to open:
   - `/admin`
   - `/clients`
   - `/schedule`
   - `/api/exports/clients`
4. Confirm those routes are blocked.
5. As `client`, confirm only the linked client record is visible through the portal dashboard.

## Deferred intentionally

- invitation emails
- password reset email automation
- public self-service signup
- client messaging
- document uploads
- OCR and AI workflows
- recurring appointments
- advanced reporting drilldowns
- PDF generation
