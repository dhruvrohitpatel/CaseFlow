# UX Review

This review reflects the current CaseFlow implementation after the public landing page, role-based dashboards, invite-only client portal, and admin-managed account flow were added.

## Priority findings

### 1. Public entry experience was previously too abrupt
- Severity: High
- Why it hurt: Sending every visitor straight into auth made the product feel unfinished and gave no context to nonprofit teams or clients.
- Fixed now: `/` is a public landing page with role-specific value statements and a direct sign-in CTA.
- Deferred: richer public content, screenshots, or a formal about/contact section.

### 2. Login previously mixed product marketing with public signup
- Severity: High
- Why it hurt: The old flow implied anyone could create staff access, which is both confusing and unsafe for a case-management system.
- Fixed now: `/login` is sign-in only, with clear copy that accounts are provisioned by the organization.
- Deferred: passwordless sign-in or branded organization-specific login pages.

### 3. One shared dashboard created role confusion
- Severity: High
- Why it hurt: Admins, staff, and clients do not need the same starting page. One dashboard increased cognitive load and risked showing the wrong information to the wrong role.
- Fixed now: `/dashboard` routes users to `/dashboard/admin`, `/dashboard/staff`, or `/dashboard/client`.
- Deferred: deeper personalization within each dashboard.

### 4. Client-safe visibility was missing
- Severity: High
- Why it hurt: A client-facing portal cannot safely expose internal notes, operational exports, or audit tools.
- Fixed now: client users only see case status, upcoming appointments, recent activity metadata, and contact guidance. Internal note bodies are intentionally hidden.
- Deferred: client messaging, document sharing, and richer self-service actions.

### 5. Account creation was too open
- Severity: High
- Why it hurt: CaseFlow handles sensitive data. Allowing public signup would undermine trust and open the door to accidental or malicious misuse.
- Fixed now: only admins can create staff and client portal accounts, and those accounts are provisioned with temporary passwords plus forced reset.
- Deferred: invitation emails and bulk staff onboarding.

### 6. Admin actions were hard to discover from the dashboard
- Severity: Medium
- Why it hurt: Reporting existed, but account management, exports, and audits were buried in separate places.
- Fixed now: the admin dashboard highlights exports, print view, admin tools, account management, and audit/config controls.
- Deferred: dedicated admin navigation subsections and saved reports.

### 7. Staff needed a cleaner operational home
- Severity: Medium
- Why it hurt: Staff benefit from immediate access to today’s work, not admin reports.
- Fixed now: the staff dashboard centers appointments, recent clients, recent service activity, and quick actions.
- Deferred: a personal caseload view filtered to the current staff member.

### 8. Feedback around account state was incomplete
- Severity: Medium
- Why it hurt: Users created by admins need a clear first-login path, and admins need to know which accounts are still pending reset.
- Fixed now: forced reset routing is in place, and the admin account table shows whether reset is still pending.
- Deferred: resend/reset controls and last-login visibility.

### 9. Security-sensitive actions needed stronger guardrails
- Severity: High
- Why it hurt: Export routes and client data access were too broad for a mixed-role portal.
- Fixed now: export endpoints are admin-only, client portal access is limited to the linked record, and the migration tightens RLS for clients, appointments, service entries, and configuration.
- Deferred: automated penetration testing and rate limiting beyond Supabase defaults.

## Additional weaknesses still worth addressing

### 10. Admin page is becoming dense
- Severity: Medium
- Why it hurts: CSV import, dynamic fields, account management, and audit logs all live on one page. That is workable now, but the page is approaching the upper limit of what feels calm.
- Fixed now: the sections are grouped and labeled clearly.
- Deferred: split admin into subpages if usage grows.

### 11. Client portal support messaging is generic
- Severity: Low
- Why it hurts: Clients benefit from explicit contact details, office hours, and escalation guidance.
- Fixed now: there is a simple support/help card and organization name hook.
- Deferred: configurable org contact info, crisis guidance, and multilingual copy.

### 12. No dedicated security review automation
- Severity: Medium
- Why it hurts: Least-privilege design is stronger now, but the repo still relies on manual review rather than repeatable security checks.
- Fixed now: baseline headers, stricter role checks, and admin-only export/account flows are implemented.
- Deferred: security checklist automation, dependency scanning, and formal threat modeling.
