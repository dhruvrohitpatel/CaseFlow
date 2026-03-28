#!/usr/bin/env bash
set -euo pipefail

# Bootstrap labels, milestones, and issues for the nonprofit case management app.
# Requires:
#   - GitHub CLI: gh
#   - Authenticated session: gh auth login
# Usage:
#   ./bootstrap_github_backlog.sh OWNER REPO
# Example:
#   ./bootstrap_github_backlog.sh dhruvpatel nonprofit-case-management

OWNER="${1:-}"
REPO="${2:-}"

if [[ -z "$OWNER" || -z "$REPO" ]]; then
  echo "Usage: $0 OWNER REPO"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI 'gh' is not installed. Install it first."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

REPO_FULL="$OWNER/$REPO"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Bootstrapping backlog into $REPO_FULL"

create_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if gh label edit "$name" --repo "$REPO_FULL" --color "$color" --description "$description" >/dev/null 2>&1; then
    echo "Label exists: $name"
  else
    gh label create "$name" --repo "$REPO_FULL" --color "$color" --description "$description" >/dev/null
    echo "Created label: $name"
  fi
}

get_milestone_number() {
  local title="$1"
  gh api "repos/$REPO_FULL/milestones?state=all&per_page=100" --jq ".[] | select(.title == \"$title\") | .number" | head -n1
}

create_milestone() {
  local title="$1"
  local description="$2"
  local due_on="$3"

  local existing
  existing="$(get_milestone_number "$title" || true)"
  if [[ -n "$existing" ]]; then
    echo "Milestone exists: $title (#$existing)"
  else
    gh api "repos/$REPO_FULL/milestones" -f title="$title" -f description="$description" -f due_on="$due_on" >/dev/null
    echo "Created milestone: $title"
  fi
}

issue_exists() {
  local title="$1"
  gh issue list --repo "$REPO_FULL" --state all --limit 200 --search "in:title \"$title\"" --json title --jq '.[].title' | grep -Fxq "$title"
}

create_issue() {
  local title="$1"
  local milestone_title="$2"
  local labels_csv="$3"
  local body_file="$4"

  if issue_exists "$title"; then
    echo "Issue exists: $title"
    return
  fi

  gh issue create --repo "$REPO_FULL" --title "$title" --body-file "$body_file" --label "$labels_csv" --milestone "$milestone_title" >/dev/null
  echo "Created issue: $title"
}

write_body() {
  local file="$1"
  shift
  cat > "$file"
}

# Labels
create_label "p0" "d73a4a" "Hackathon must-have MVP scope"
create_label "p1" "fbca04" "Strong operational features after MVP"
create_label "p2" "0e8a16" "Stretch/demo-worthy AI and polish"
create_label "frontend" "1d76db" "UI and client-side work"
create_label "backend" "5319e7" "Server-side logic and APIs"
create_label "database" "006b75" "Schema, data model, and queries"
create_label "auth" "b60205" "Authentication and permissions"
create_label "ai" "8a2be2" "AI or LLM-assisted features"
create_label "accessibility" "c5def5" "Accessibility-related work"
create_label "ocr" "f9d0c4" "OCR/document extraction work"
create_label "infra" "0052cc" "Deployment, env, and infrastructure"
create_label "docs" "0075ca" "Documentation and project workflow"
create_label "bug" "d93f0b" "Something is broken"
create_label "blocked" "000000" "Cannot proceed until dependency is resolved"
create_label "needs-discussion" "cccccc" "Needs a team decision before implementation"
create_label "good first issue" "7057ff" "Good starter task"

# Milestones
create_milestone "P0 MVP" "Foundational auth, client records, service logging, and deployable demo." "2026-03-29T23:59:00Z"
create_milestone "P1 Admin + Operations" "CSV, dashboard, scheduling, configurable fields, and audit log." "2026-03-30T23:59:00Z"
create_milestone "P2 AI + Accessibility" "OCR intake, semantic search, summaries, uploads, and voice-assisted workflows." "2026-03-31T23:59:00Z"
create_milestone "Hackathon Polish" "Final demo prep, docs, bug fixes, and UI cleanup." "2026-03-31T23:59:00Z"

# Issue bodies
write_body "$TMP_DIR/issue-01.md" <<'ISSUE'
## Summary
Set up the base Next.js app with TypeScript, Tailwind, shadcn/ui, Supabase wiring, and environment validation.

## Goal
Create a clean project foundation that is deployable and ready for auth, database, and feature work.

## Scope
- Create Next.js App Router app
- Add TypeScript
- Add Tailwind CSS
- Add shadcn/ui
- Add Supabase client/server helpers
- Add environment variable validation
- Add basic app layout and route structure
- Add README setup instructions

## Acceptance Criteria
- [ ] App runs locally
- [ ] Tailwind and shadcn/ui are working
- [ ] Supabase env vars are wired correctly
- [ ] Basic route structure exists
- [ ] README includes local setup steps

## Dependencies
None

## Notes
Optimize for boring, stable setup. Do not build features here.
ISSUE

write_body "$TMP_DIR/issue-02.md" <<'ISSUE'
## Summary
Create the initial database schema for profiles, clients, and service entries.

## Goal
Have a stable schema that supports P0 and leaves room for later P1/P2 features.

## Scope
- Create profiles table
- Create clients table
- Create service_entries table
- Add foreign keys and indexes
- Add role field for profiles
- Add created_at / updated_at fields
- Add optional org/settings placeholder if useful

## Acceptance Criteria
- [ ] Schema is applied successfully
- [ ] Tables exist and are queryable
- [ ] Relationships are correct
- [ ] Indexes exist for common lookups
- [ ] Schema is documented in repo

## Dependencies
- Base app setup

## Notes
Keep it single-org for now. Do not overbuild multi-tenancy.
ISSUE

write_body "$TMP_DIR/issue-03.md" <<'ISSUE'
## Summary
Add authentication and protect app routes so only logged-in users can access the app.

## Goal
Users can sign in and unauthorized visitors cannot access protected pages.

## Scope
- Add email/password auth
- Add Google auth if straightforward
- Protect dashboard and app pages
- Add login page
- Add logout flow
- Redirect unauthorized users to login

## Acceptance Criteria
- [ ] User can sign in
- [ ] User can sign out
- [ ] Protected routes are inaccessible when logged out
- [ ] Session persists properly
- [ ] Login flow is stable

## Dependencies
- Base app setup
- Supabase schema setup

## Notes
Google auth is nice-to-have if email auth is already working.
ISSUE

write_body "$TMP_DIR/issue-04.md" <<'ISSUE'
## Summary
Implement admin and staff roles with server-side enforcement.

## Goal
The app should support different permissions for admin and staff users.

## Scope
- Add role field to user profile
- Seed or assign admin/staff roles
- Add server-side role checks
- Restrict admin-only functionality
- Add utility helpers for permission checks

## Acceptance Criteria
- [ ] Admin role exists
- [ ] Staff role exists
- [ ] Server-side checks enforce permissions
- [ ] UI hides admin-only actions from staff where appropriate

## Dependencies
- Authentication
- Profiles schema

## Notes
Keep the permission model simple for P0.
ISSUE

write_body "$TMP_DIR/issue-05.md" <<'ISSUE'
## Summary
Build the client registration form and create-client flow.

## Goal
Staff can register a client with basic details and save the record successfully.

## Scope
- Create new client page/form
- Add fields for full name, DOB, phone, email
- Add 3 to 5 demographic fields with sensible defaults
- Generate unique client ID automatically
- Validate form input
- Save to database

## Acceptance Criteria
- [ ] Client can be created successfully
- [ ] Unique client ID is generated
- [ ] Validation errors are shown clearly
- [ ] Saved client appears in client list
- [ ] Success feedback is shown

## Dependencies
- Clients schema
- Authentication

## Notes
Do not overbuild configurable fields yet.
ISSUE

write_body "$TMP_DIR/issue-06.md" <<'ISSUE'
## Summary
Build the main client directory page with search.

## Goal
Users can browse and search clients by name.

## Scope
- Create clients list page
- Fetch clients from database
- Add search by name
- Add sort by recent/default ordering
- Link each row/card to client profile

## Acceptance Criteria
- [ ] Client list loads correctly
- [ ] Search by name works
- [ ] Clicking a client opens their profile
- [ ] Empty state is handled reasonably

## Dependencies
- Client creation
- Clients schema

## Notes
Keep the table/list simple and readable.
ISSUE

write_body "$TMP_DIR/issue-07.md" <<'ISSUE'
## Summary
Build a client profile page showing demographics and service history.

## Goal
Users can view a client record and understand the client's history at a glance.

## Scope
- Create client profile route
- Show demographics card at top
- Show service history section below
- Order service history reverse chronologically
- Add button to log new service entry

## Acceptance Criteria
- [ ] Profile loads client details
- [ ] Demographics display correctly
- [ ] Service history displays in reverse chronological order
- [ ] Add service entry action is visible

## Dependencies
- Client creation
- Service entry schema

## Notes
This should become the core chart view for the product.
ISSUE

write_body "$TMP_DIR/issue-08.md" <<'ISSUE'
## Summary
Add the ability to log services or visits against a client.

## Goal
Users can add service records and see them appear on the client profile.

## Scope
- Create service entry form
- Link service entry to a client
- Fields: date, service_type, staff_member, notes
- Save entry to database
- Display entry in client profile history

## Acceptance Criteria
- [ ] Service entry can be created
- [ ] Entry is linked to correct client
- [ ] Entry appears on profile after save
- [ ] Staff member is captured
- [ ] Notes are stored correctly

## Dependencies
- Client profile page
- Service entries schema
- Auth and role setup

## Notes
Use seeded service types for now.
ISSUE

write_body "$TMP_DIR/issue-09.md" <<'ISSUE'
## Summary
Create seed data for hackathon demos and local development.

## Goal
The app should have realistic sample data for demos and testing.

## Scope
- Seed at least 10 clients
- Seed at least 30 service entries
- Include clients with richer histories
- Ensure seed script is repeatable
- Document how to run seed script

## Acceptance Criteria
- [ ] Seed script runs successfully
- [ ] Demo data appears in app
- [ ] Client histories are realistic enough for later AI demos

## Dependencies
- P0 schema
- Client and service entry flows

## Notes
At least 1 or 2 clients should have detailed notes for future search/summary demos.
ISSUE

write_body "$TMP_DIR/issue-10.md" <<'ISSUE'
## Summary
Deploy the P0 app publicly and verify core flows work in production.

## Goal
Have a live demo URL for the MVP.

## Scope
- Connect repo to Vercel
- Add required environment variables
- Run production deployment
- Verify auth, client creation, profile view, service logging
- Update README with deploy steps

## Acceptance Criteria
- [ ] Public URL exists
- [ ] App loads correctly in production
- [ ] Core P0 flows work in production
- [ ] README includes deployment instructions

## Dependencies
- P0 core features completed

## Notes
Deploy early, not only at the very end.
ISSUE

write_body "$TMP_DIR/issue-11.md" <<'ISSUE'
## Summary
Allow admins/staff to import client records from CSV.

## Goal
Nonprofits can migrate existing spreadsheet data into the app.

## Scope
- Upload CSV file
- Parse CSV
- Validate rows
- Show row-level errors
- Create valid clients from file
- Provide downloadable example template

## Acceptance Criteria
- [ ] CSV upload works
- [ ] Invalid rows show useful errors
- [ ] Valid rows are imported
- [ ] Example template is downloadable

## Dependencies
- Client schema
- Client creation flow

## Notes
Keep the template simple and opinionated.
ISSUE

write_body "$TMP_DIR/issue-12.md" <<'ISSUE'
## Summary
Allow exporting clients and service records to CSV.

## Goal
Users can take their data out of the app easily.

## Scope
- Export clients CSV
- Export service entries CSV
- Add export actions in sensible locations
- Ensure exported columns are readable

## Acceptance Criteria
- [ ] Clients export works
- [ ] Service logs export works
- [ ] CSV files open cleanly in spreadsheet tools

## Dependencies
- P0 data flows

## Notes
Keep exported schema stable and simple.
ISSUE

write_body "$TMP_DIR/issue-13.md" <<'ISSUE'
## Summary
Build the dashboard metrics and charts for basic nonprofit reporting.

## Goal
Admins can quickly understand activity and output from one page.

## Scope
- Add KPI cards:
  - total active clients
  - services this week
  - services this month
  - services this quarter
- Add service type breakdown chart
- Add visits over time chart
- Add print-friendly styling if feasible

## Acceptance Criteria
- [ ] KPI cards show correct values
- [ ] Service type chart renders
- [ ] Visits-over-time chart renders
- [ ] Dashboard is readable and useful

## Dependencies
- P0 client and service data
- Dashboard shell if one exists

## Notes
This should contribute to the admin super-dashboard feel.
ISSUE

write_body "$TMP_DIR/issue-14.md" <<'ISSUE'
## Summary
Add basic appointment scheduling and upcoming appointment views.

## Goal
Users can create and view appointments for today and this week.

## Scope
- Create appointments table
- Build create appointment form
- Show upcoming today list
- Show this week list
- Add simple calendar-like layout
- Add reminder status field

## Acceptance Criteria
- [ ] Appointment can be created
- [ ] Today view works
- [ ] This week view works
- [ ] Appointment data persists correctly

## Dependencies
- P0 auth and client system

## Notes
Do not overbuild reminders in this issue.
ISSUE

write_body "$TMP_DIR/issue-15.md" <<'ISSUE'
## Summary
Allow admins to add and remove custom fields for clients and service logs.

## Goal
Different nonprofits can adapt the system without code changes.

## Scope
- Create schema/config storage for custom fields
- Support field types: text, textarea, number, date, select
- Build admin UI to add/remove fields
- Render custom fields in client form
- Render custom fields in service log form
- Display saved values in profile/history views where appropriate

## Acceptance Criteria
- [ ] Admin can create custom client fields
- [ ] Admin can create custom service fields
- [ ] Dynamic fields render correctly in forms
- [ ] Saved values persist and display correctly

## Dependencies
- P0 form system
- Role enforcement

## Notes
Keep the builder simple, not drag-and-drop.
ISSUE

write_body "$TMP_DIR/issue-16.md" <<'ISSUE'
## Summary
Track major create/update/delete actions in an audit log.

## Goal
Admins can review operational changes for accountability and debugging.

## Scope
- Create audit_logs table
- Log CRUD actions on clients, service entries, appointments, and custom fields if feasible
- Store actor, entity type, entity id, action, timestamp
- Build admin-only audit log viewer

## Acceptance Criteria
- [ ] Audit log records are created
- [ ] Admin can view audit log
- [ ] Sensitive raw note content is not dumped unnecessarily
- [ ] Common actions appear in log

## Dependencies
- Roles
- Core CRUD flows

## Notes
Keep snapshots lightweight and privacy-aware.
ISSUE

write_body "$TMP_DIR/issue-17.md" <<'ISSUE'
## Summary
Allow staff to upload and view documents attached to a client profile.

## Goal
Paper forms, waivers, and related files can live with the client record.

## Scope
- Create file metadata table if needed
- Configure Supabase Storage bucket
- Upload file from client profile
- Save metadata in DB
- List uploaded files on profile
- Enforce authenticated access

## Acceptance Criteria
- [ ] File upload works
- [ ] Uploaded file appears on client profile
- [ ] Metadata is stored correctly
- [ ] Access is restricted appropriately

## Dependencies
- P0 client profile
- Supabase configuration

## Notes
This is a foundation for OCR/photo-to-intake.
ISSUE

write_body "$TMP_DIR/issue-18.md" <<'ISSUE'
## Summary
Allow staff to upload a paper intake form image and prefill a client record from extracted data.

## Goal
Reduce manual data entry while keeping staff in control.

## Scope
- Add image upload entry point on client creation flow
- Send image to server-side OCR/extraction route
- Parse extracted text into structured client fields
- Prefill the form with extracted values
- Require human review before save

## Acceptance Criteria
- [ ] Intake image can be uploaded
- [ ] OCR/extraction runs server-side
- [ ] Returned data prefills client form
- [ ] Staff can edit values before saving
- [ ] Demo works with sample forms

## Dependencies
- Client creation flow
- Document uploads or OCR pipeline

## Notes
Human review is mandatory before final save.
ISSUE

write_body "$TMP_DIR/issue-19.md" <<'ISSUE'
## Summary
Add natural language search across service/case notes.

## Goal
Users can find relevant clients and notes using plain language queries.

## Scope
- Create embeddings for service notes
- Store embeddings in supported vector storage
- Add dashboard search bar
- Return matching clients, note snippets, and relevance scores
- Add backfill script for existing notes

## Acceptance Criteria
- [ ] Search accepts natural language query
- [ ] Relevant notes are returned
- [ ] Matching client is shown
- [ ] Existing seeded notes are indexed

## Dependencies
- P0 service notes
- AI utility layer

## Notes
Keep the result UI simple and readable.
ISSUE

write_body "$TMP_DIR/issue-20.md" <<'ISSUE'
## Summary
Generate a structured summary of a client's history for handoff or review.

## Goal
Staff can quickly understand a client without manually reading the entire record.

## Scope
- Add summary action on client profile
- Aggregate client service history and notes
- Generate structured summary with sections:
  - background
  - service history
  - current status
  - active needs
  - risks
  - next steps
- Show summary as draft output
- Do not overwrite canonical data automatically

## Acceptance Criteria
- [ ] Summary can be generated from client profile
- [ ] Output is structured and readable
- [ ] Human review happens before any save
- [ ] Existing client profile remains unchanged by default

## Dependencies
- P0 client profile
- AI utility layer

## Notes
This is demo-friendly if seeded notes are rich enough.
ISSUE

write_body "$TMP_DIR/issue-21.md" <<'ISSUE'
## Summary
Use speech transcription to help staff create service notes and improve accessibility.

## Goal
Staff can dictate notes and edit a structured draft before saving.

## Scope
- Add audio recording UI to service entry flow
- Send audio to server-side transcription route
- Convert transcript into editable note draft
- Allow user to review/edit before save
- Keep implementation ready for broader accessibility uses later

## Acceptance Criteria
- [ ] Audio can be recorded or uploaded
- [ ] Transcript is generated
- [ ] Note draft is editable before save
- [ ] Final saved note remains user-controlled

## Dependencies
- P0 service logging
- AI/audio utility layer

## Notes
Keep this focused on note creation first, with accessibility expansion later.
ISSUE

write_body "$TMP_DIR/issue-22.md" <<'ISSUE'
## Summary
Set up project management structure in GitHub for the hackathon team.

## Goal
Team members can clearly track work and priorities.

## Scope
- Create labels for phase, area, and status
- Create milestones for P0, P1, P2
- Create GitHub Project board with columns:
  - Backlog
  - Ready
  - In Progress
  - Review
  - Done

## Acceptance Criteria
- [ ] Labels created
- [ ] Milestones created
- [ ] Board created
- [ ] Existing issues organized onto board

## Dependencies
None

## Notes
This will make collaboration much easier immediately.
ISSUE

write_body "$TMP_DIR/issue-23.md" <<'ISSUE'
## Summary
Write a simple team collaboration guide for branches, issues, PRs, and reviews.

## Goal
Everyone on the team follows the same workflow and avoids stepping on each other.

## Scope
- Explain branch naming
- Explain issue assignment
- Explain PR naming
- Explain linking PRs to issues
- Explain who reviews what
- Add rules for commenting when blocked

## Acceptance Criteria
- [ ] CONTRIBUTING.md exists
- [ ] Team can follow workflow without confusion
- [ ] PR/issue linking process is documented

## Dependencies
None

## Notes
Keep it short and practical.
ISSUE

# Create issues
create_issue "Set up app shell and base stack" "P0 MVP" "p0,infra,frontend,backend" "$TMP_DIR/issue-01.md"
create_issue "Set up Supabase database schema for P0" "P0 MVP" "p0,database,backend" "$TMP_DIR/issue-02.md"
create_issue "Implement authentication and protected routes" "P0 MVP" "p0,auth,frontend,backend" "$TMP_DIR/issue-03.md"
create_issue "Add user roles and role enforcement" "P0 MVP" "p0,auth,backend" "$TMP_DIR/issue-04.md"
create_issue "Build create client form" "P0 MVP" "p0,frontend,backend" "$TMP_DIR/issue-05.md"
create_issue "Build client list page with search" "P0 MVP" "p0,frontend,backend" "$TMP_DIR/issue-06.md"
create_issue "Build client profile page" "P0 MVP" "p0,frontend,backend" "$TMP_DIR/issue-07.md"
create_issue "Build service/visit logging flow" "P0 MVP" "p0,frontend,backend" "$TMP_DIR/issue-08.md"
create_issue "Seed demo data for P0" "P0 MVP" "p0,database,docs" "$TMP_DIR/issue-09.md"
create_issue "Deploy P0 app to Vercel" "P0 MVP" "p0,infra" "$TMP_DIR/issue-10.md"

create_issue "Add CSV import for clients" "P1 Admin + Operations" "p1,backend,frontend" "$TMP_DIR/issue-11.md"
create_issue "Add CSV export for clients and service logs" "P1 Admin + Operations" "p1,backend,frontend" "$TMP_DIR/issue-12.md"
create_issue "Build reporting dashboard cards and charts" "P1 Admin + Operations" "p1,frontend,backend" "$TMP_DIR/issue-13.md"
create_issue "Build appointment scheduling feature" "P1 Admin + Operations" "p1,frontend,backend,database" "$TMP_DIR/issue-14.md"
create_issue "Build configurable custom fields system" "P1 Admin + Operations" "p1,frontend,backend,database" "$TMP_DIR/issue-15.md"
create_issue "Build audit log system" "P1 Admin + Operations" "p1,backend,database,frontend" "$TMP_DIR/issue-16.md"

create_issue "Add document uploads to client profiles" "P2 AI + Accessibility" "p2,backend,frontend,ocr" "$TMP_DIR/issue-17.md"
create_issue "Build photo-to-intake OCR flow" "P2 AI + Accessibility" "p2,ai,ocr,frontend,backend" "$TMP_DIR/issue-18.md"
create_issue "Build semantic search across case notes" "P2 AI + Accessibility" "p2,ai,backend,frontend" "$TMP_DIR/issue-19.md"
create_issue "Build client handoff summary generator" "P2 AI + Accessibility" "p2,ai,frontend,backend" "$TMP_DIR/issue-20.md"
create_issue "Add voice-to-note draft flow" "P2 AI + Accessibility" "p2,ai,accessibility,frontend,backend" "$TMP_DIR/issue-21.md"

create_issue "Create labels, milestones, and GitHub project board" "Hackathon Polish" "docs,infra" "$TMP_DIR/issue-22.md"
create_issue "Create contribution workflow doc" "Hackathon Polish" "docs" "$TMP_DIR/issue-23.md"

echo
echo "Done. Backlog bootstrapped into $REPO_FULL"
echo "Next: open the repo Issues tab and assign owners."
echo "Optional: create a GitHub Project board and drag issues into Backlog/Ready/In Progress/Review/Done."
