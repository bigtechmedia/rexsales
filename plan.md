# Rex Botanix CRM — plan.md

## 1) Objectives
- Build a working V1 CRM for Rex Botanix to manage field sales: dealers, visits, enquiries, sales requirements, uploads, requests/approvals, teams, dashboards, and messaging.
- Support multi-role access (Owner, Admin/Manager, Sales Rep, Dealer) with email/password + Google OAuth.
- Provide modern-minimal UI with bold, data-rich dashboards (KPIs, filters, charts) and fast field reporting.
- Ensure end-to-end stability via testing_agent_v3 after each major phase.

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): Google OAuth + RBAC session bootstrap
> Core risk: OAuth (external) + role routing. Prove login → token → role-based access works before building everything.
- Websearch best-practice for FastAPI + Google OAuth (redirect URIs, PKCE, token verification) and Emergent Managed Google Auth specifics.
- Backend (FastAPI): minimal auth module
  - Email/password: bcrypt + JWT access token.
  - Google OAuth: callback endpoint to exchange/verify token and issue same JWT.
  - Seed users: 1 per role (Owner/Admin/Rep/Dealer) + sample teams.
  - RBAC dependency: `require_roles([...])`.
- Frontend (React): minimal login page
  - Email/password form + “Sign in with Google”.
  - After login: route to `/app` and show role + allowed routes.
- POC exit criteria: can login with both methods; can hit 1 protected endpoint per role; role-based navigation works.

**Phase 1 user stories**
1. As a user, I can sign in with email/password to access the app.
2. As a user, I can sign in with Google OAuth as an alternative.
3. As an admin, I can see that protected endpoints reject unauthorized users.
4. As an owner, I land on an owner-only route after login.
5. As a dealer, I can log in and only see dealer-allowed sections.

---

### Phase 2 — V1 App Development (MVP end-to-end)
> Build complete backend + frontend in one connected pass; keep models simple but extensible.

**Backend (FastAPI + MongoDB)**
- Data models/collections (MVP): Users, Teams, Dealers, Products, Reports (typed), Requests (typed), Messages (threads + items), Notifications.
- Core modules/endpoints:
  - Users: CRUD (admin), profile (self), role management (owner/admin).
  - Teams: create/update/delete; add/remove members; multi-team membership.
  - Dealers: onboard/edit/archive; assign to rep/team; dealer self-profile.
  - Products: admin CRUD.
  - Reports (single collection with `type` discriminator):
    - Sales Requirement, Sales Enquiry, Product Enquiry, Field Report, Farm Visit, Dealer Visit, Area Status.
    - Base64 attachments (images/docs) with size limits + MIME metadata.
  - Requests/Approvals (single collection with `type`): expense/leave/travel; status workflow (pending/approved/rejected) + approver notes.
  - Messaging:
    - Threads (participants, lastMessageAt) + messages (text + optional base64 attachment).
    - Polling endpoints: `GET /threads?updated_since=...`, `GET /threads/{id}/messages?after=...`.
  - Notifications: generate on new message + request status change + report submission (to manager/admin); mark read.
- Access control rules (minimum):
  - Rep: only own reports/requests, assigned dealers, threads they’re in.
  - Admin/Manager: all within teams they manage (or global if Admin).
  - Owner: read-all dashboards + drilldowns.
  - Dealer: only own dealer record + own enquiries/requirements + threads with assigned rep/admin.

**Frontend (React + shadcn/ui + Tailwind)**
- App shell: left nav + top bar + role switch banner (role shown) + notifications bell.
- Dashboards:
  - Owner: company KPIs, weekly/monthly charts, top reps/dealers, team breakdown.
  - Admin/Manager: approvals queue, activity feed, team KPIs, report/visit analytics.
  - Rep: my KPIs, quick actions (new report, new dealer, new request), my pipeline (dealers/enquiries).
  - Dealer: my enquiries/requirements + messaging.
- Core screens:
  - Dealers: list (filters), onboard form, dealer detail (timeline: reports/requests/messages).
  - Reports: create forms per type (shared component + type-specific fields), list, detail view with attachments preview.
  - Requests: create expense/leave/travel, list, detail; approvals screen for managers/admin.
  - Teams: CRUD + member management.
  - Products: CRUD.
  - Messaging: thread list + chat panel; polling (3–5s) + “typing-like” local indicator.
- Analytics: recharts for trends + tables with filters (date range, team, rep, dealer).

**Phase 2 user stories**
1. As a sales rep, I can onboard a dealer and assign it to myself so I can start reporting immediately.
2. As a sales rep, I can submit a farm visit report with images/documents so my manager has proof and context.
3. As an admin/manager, I can review and approve/reject expense/leave/travel requests so operations stay controlled.
4. As an admin, I can create teams and add/remove reps so reporting and access follow the org structure.
5. As a dealer, I can view my submitted enquiries/requirements and message my rep to follow up.
6. As an owner, I can view weekly/monthly performance and drill down to a rep/dealer to audit activity.

**End of Phase 2:** run testing_agent_v3 for 1 full E2E pass (seed users + create dealer + submit report + request approval + send message + verify dashboards update).

---

### Phase 3 — Testing, Hardening, UX polish
- Expand automated/manual E2E coverage with testing_agent_v3: role matrix, permissions, pagination, attachment edge cases.
- Fix bugs from testing: RBAC leaks, polling race conditions, attachment size failures, dashboard aggregation errors.
- Performance baseline:
  - Add indexes (dealerId, repId, teamIds, createdAt, type, status, lastMessageAt).
  - Server-side pagination everywhere.
- UX polish:
  - Offline-friendly form drafts (localStorage) for reps in the field.
  - Better attachment preview (image + pdf), upload size warnings.
  - Empty/error states, toasts, confirm dialogs.

**Phase 3 user stories**
1. As a sales rep, I can save a draft report and submit later if connectivity is weak.
2. As an admin, I can filter analytics by date/team/rep to quickly spot issues.
3. As a manager, I can see a unified activity timeline per rep/dealer to coach better.
4. As a dealer, I get a clear notification when my rep responds in a thread.
5. As an owner, dashboards load quickly even with months of data.

**End of Phase 3:** run testing_agent_v3 again for full regression.

---

### Phase 4+ — Enhancements (as requested)
- Optional: export (CSV/PDF) for reports/analytics; shareable weekly summary.
- Optional: territories/regions and geo-tagging for visits.
- Optional: SLA reminders/auto-followups for enquiries.
- Optional: granular permissions (Admin vs Manager split) and audit log.

## 3) Next Actions
1. Implement Phase 1 OAuth+JWT POC (backend + minimal frontend login + seed users).
2. Confirm redirect URIs and env vars for Emergent Managed Google Auth.
3. After POC passes, proceed to Phase 2 bulk build (backend models/endpoints + frontend screens) with one integrated run.
4. Run testing_agent_v3 at end of Phase 2 and fix blockers before moving to Phase 3.

## 4) Success Criteria
- Auth: both email/password and Google OAuth work; role-based routing + endpoint protection verified.
- Core flows: dealer onboarding, report submission with base64 attachments, approvals, messaging threads all work end-to-end.
- Dashboards: Owner/Admin/Rep/Dealer dashboards show correct KPIs and drilldowns based on role.
- Reliability: testing_agent_v3 passes core scenarios with no RBAC leaks and no broken navigation.
- UX: fast forms, clear states, usable on field devices (responsive layout).