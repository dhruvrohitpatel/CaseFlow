# UX Review

This review reflects the current productized CaseFlow build after adding white-label settings, a setup wizard, sticky app shell, and stronger public/auth positioning.

## Highest-priority improvements shipped now

### 1. The app shell now feels like a product, not a project
- Severity before: High
- Why it hurt: The previous shell looked like a thin internal demo with a flat nav bar and little organizational identity.
- Fixed now: The protected app uses a sticky header with clear brand placement, persistent navigation, support CTA, role badge, and product-level shell hierarchy.
- Deferred: richer account menu, notifications, and contextual search in the shell.

### 2. Branding is now a first-class configuration surface
- Severity before: High
- Why it hurt: A nonprofit-facing product cannot feel reusable if the org name, copy, and visuals are hard-coded.
- Fixed now: `organization_settings` drives name, subtitle, support contact, logo, favicon, colors, and welcome copy across the landing page, login, shell, and admin experience.
- Deferred: arbitrary layout builders and deeper per-page content overrides.

### 3. Admin onboarding is now guided instead of improvised
- Severity before: High
- Why it hurt: Non-technical admins were expected to jump between auth, branding, imports, and access management without a controlled launch path.
- Fixed now: `/setup` provides a branded setup wizard with branding, organization details, access review, starter-data planning, and launch steps.
- Deferred: deeper spreadsheet-to-schema migration assistance and automated invite email workflows.

### 4. Public and auth pages now sound like a product platform
- Severity before: High
- Why it hurt: MVP and hackathon language undermines trust when the audience is a real nonprofit operator.
- Fixed now: `/` and `/login` focus on branded product messaging, role-aware value, and a calmer portal entry point.
- Deferred: a richer marketing site with case studies, screenshots, and pricing or implementation tiers.

### 5. Setup state is now visible on the admin dashboard
- Severity before: Medium
- Why it hurt: Once admins left setup, there was no obvious reminder of what still needed to happen before rollout.
- Fixed now: the admin dashboard shows a setup checklist card until launch is marked complete.
- Deferred: post-launch operational health cards and success metrics for the first 30 days.

## Weak points that still matter

### 6. Admin tools are still dense
- Severity: Medium
- Why it hurts: `/admin` contains access, CSV tools, custom fields, and audit logs in one dense surface.
- Fixed in this pass: clearer workspace profile summary and setup entry point.
- Deferred: split admin tools into subroutes if usage expands.

### 7. White-labeling is strong, but not yet deep content management
- Severity: Medium
- Why it hurts: Some nonprofits will want distinct public messaging or client-specific instructions beyond a few configurable text blocks.
- Fixed in this pass: org name, subtitle, welcome copy, support CTA, colors, logo, and favicon.
- Deferred: richer content sections and role-specific copy management.

### 8. No built-in implementation concierge
- Severity: Medium
- Why it hurts: Deploy-per-org is simpler than multi-tenant SaaS, but non-technical nonprofits still need a predictable launch package and operator handoff.
- Fixed in this pass: provisioning and onboarding docs, setup wizard, and launch-package framing.
- Deferred: a scripted deploy bootstrap or formal operator CLI.

### 9. Client portal still feels intentionally minimal
- Severity: Low
- Why it hurts: Minimal is good for safety, but some organizations will want clearer instructions, office hours, and contact escalation guidance.
- Fixed in this pass: support contact and branded copy can now be configured and appear in the portal context.
- Deferred: richer client-facing help content and multilingual portal content.

### 10. Visual system can still mature further
- Severity: Low
- Why it hurts: The new shell is more product-like, but some card layouts still carry early-project spacing and hierarchy patterns.
- Fixed in this pass: stronger header, better gradients, branded surfaces, and more consistent calm-product styling.
- Deferred: a fuller design token pass across every dashboard and table-heavy screen.

## Additional product suggestions

- Add an admin-only “organization preview” modal that shows landing, login, and portal states side by side before launch.
- Add a first-30-days checklist card after setup completes:
  - add all staff
  - import active clients
  - test client portal
  - confirm support contact
- Add a lightweight operator script for spinning up a new nonprofit deployment from a checklist and env template.
- Add small reusable empty states with role-specific language so blank dashboards still feel intentional.
