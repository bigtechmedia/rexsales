# Rex Botanix CRM — plan.md (Updated)

## 1) Objectives
- **Deliver a working V1 CRM (DONE)** for Rex Botanix to manage field sales operations: dealers, field/farm/dealer visits, enquiries, sales requirements, uploads, requests/approvals, teams, dashboards, and messaging.
- **Support multi-role access (DONE)** across **5 roles** (Owner, Admin, Manager, Sales Rep, Dealer) with **email/password + Emergent Managed Google OAuth**.
- **Provide modern-minimal UI with bold, data-rich dashboards (DONE)**: KPI cards, filters, charts (recharts), quick actions, and fast reporting flows.
- **Ensure end-to-end stability (DONE)**: testing_agent_v3 executed with **61/61 backend tests passed** and **all major frontend flows passed**.
- **Next objective (Phase 3+)**: hardening/polish and optional enhancements (exports, geo/territories, reminders, audit log, granular permissions, dark-mode toggle).

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): Google OAuth + RBAC session bootstrap ✅ **COMPLETE**
> Goal was to prove login → session → role routing works reliably.

**Implemented**
- Backend auth:
  - Email/password using **bcrypt**.
  - Emergent Managed Google OAuth session exchange.
  - **Session token** stored in MongoDB and usable via **httpOnly cookie** and **Authorization: Bearer** header.
  - RBAC dependency helper `require_roles([...])`.
- Frontend auth:
  - Login page with email/password + “Sign in with Google”.
  - OAuth callback handler for `#session_id=...` fragment (race-condition safe).

**Phase 1 exit criteria (met)**
- Can login with both auth methods.
- Role-based navigation and route access works.

**Phase 1 user stories (met)**
1. As a user, I can sign in with email/password.
2. As a user, I can sign in with Google OAuth as an alternative.
3. As an admin, protected endpoints reject unauthorized users.
4. As an owner, I land on owner-appropriate dashboard.
5. As a dealer, I can log in and only see dealer-allowed sections.

---

### Phase 2 — V1 App Development (MVP end-to-end) ✅ **COMPLETE**
> Built full backend + frontend end-to-end with RBAC and seeded demo data.

#### Backend (FastAPI + MongoDB) ✅
**Delivered collections/modules**
- Users, User Sessions, Teams, Dealers, Products, Reports (typed), Requests (typed), Threads, Messages, Notifications.

**Delivered endpoints**
- Auth: login, google session exchange, `/auth/me`, logout.
- Users: CRUD (Admin/Owner), self password change.
- Teams: CRUD + add/remove members (multi-team support).
- Dealers: onboard/edit/delete (admin only delete), role-based listing & detail.
- Products: CRUD (Admin/Owner), list for all roles.
- Reports: create/list/detail/delete for **7 report types**:
  - `sales_requirement`, `sales_enquiry`, `product_enquiry`, `field_report`, `farm_visit`, `dealer_visit`, `area_status`
  - **Base64 attachments** supported.
- Requests: create/list/filter for `expense`, `leave`, `travel` + approve/reject workflow.
- Messaging: WhatsApp-style threads + messages with **polling support** (`?after=`).
- Notifications: list, mark read, mark all read.
- Dashboard analytics: role-aware `/dashboard/summary` including KPIs, trend, type mix, top reps, team breakdown, recent activity.

**RBAC rules implemented**
- Sales Rep: only own reports/requests, assigned dealers, threads they participate in.
- Manager: visibility for members in their team(s) + own.
- Admin/Owner: global visibility.
- Dealer: restricted visibility to dealer-appropriate reporting and their related threads.

**Auto-seed (on first startup)**
- 6 users (Owner/Admin/Manager/2×Rep/Dealer)
- 1 team
- 5 products
- 1 dealer

#### Frontend (React + shadcn/ui + Tailwind + recharts) ✅
**App shell**
- Responsive sidebar + top bar
- Role badge
- Notifications bell (unread count)
- User menu + settings

**Role dashboards delivered**
- Owner dashboard: company KPIs, trend chart, top reps, report mix, team breakdown, recent activity.
- Admin/Manager dashboard: approval queue, team activity chart, KPIs, recent activity.
- Sales Rep dashboard: personal KPIs, quick actions, recent requests, recent activity.
- Dealer dashboard: enquiries view + quick CTA + product catalogue highlights.

**Core screens delivered**
- Dealers: list + filters, onboarding dialog (optional dealer login creation), dealer detail with timeline.
- Reports: list + filters/search, dynamic “New Report” form per type, report detail view, attachment uploader.
- Requests: create expense/leave/travel + list/status.
- Approvals: manager/admin approval queue with approve/reject and filters.
- Teams: create team, add/remove members, delete.
- Products: catalogue list; admin add/delete.
- Messages: thread list + chat pane, thread creation (participants + optional dealer tag), polling updates, attachments.
- Users: admin/owner management (create/edit/delete).
- Settings: profile info + change password.

**Design system delivered**
- Agro refined palette (forest green + calm neutrals)
- Typography: Space Grotesk (display) + Figtree (body)
- Modern minimal shell + data-rich dashboards
- `data-testid` added across key interactive elements for automated testing.

**Phase 2 user stories (met)**
1. Rep can onboard dealer and start reporting.
2. Rep can submit visit/enquiry reports with base64 attachments.
3. Admin/Manager can approve/reject expense/leave/travel requests.
4. Admin can create teams and manage membership.
5. Dealer can log in, view relevant enquiries, and message rep/team.
6. Owner can view weekly/monthly style performance and drill into activity.

**End of Phase 2 (met)**
- testing_agent_v3 executed end-to-end.

---

### Phase 3 — Testing, Hardening, UX polish ✅ **COMPLETE (V1 Stability)**
> Phase 3 originally focused on E2E validation and fixing bugs discovered.

**Completed**
- Ran testing_agent_v3:
  - **Backend: 61/61 tests passed**
  - **Frontend: all major flows passed**
- No blocking issues reported.

**Deferred polish items (optional)**
- Offline-friendly report drafts (localStorage) for field reps
- More advanced attachment previews (PDF paging, better doc icons)
- Pagination controls for large datasets
- Additional empty/error/skeleton refinements

---

### Phase 4+ — Enhancements (as requested / next backlog)
- Export (CSV/PDF) for reports and analytics; shareable weekly summary.
- Territories/regions and optional geo-tagging (lat/long) for visits.
- SLA reminders and automated follow-ups for enquiries and requirements.
- Audit log for sensitive actions (approvals, deletions, role changes).
- Granular permissions split (Admin vs Manager capabilities) + configurable scopes.
- Dark mode toggle in UI.

## 3) Next Actions
1. **(Optional)** Add server-side pagination, indexes tuning, and performance profiling for larger datasets.
2. **(Optional)** Add CSV/PDF export for owner/admin dashboards and reports.
3. **(Optional)** Introduce territories and geo-tagging for visit reports.
4. **(Optional)** Add SLA reminders/notifications and escalation rules.
5. **(Optional)** Add audit logs and finer-grained permissions.

## 4) Success Criteria
✅ **Met for V1**
- Auth: email/password + Google OAuth supported; session token works via cookie and bearer header.
- Core flows: dealer onboarding, reporting with base64 attachments, approvals, messaging, notifications all work end-to-end.
- Dashboards: role-based dashboards render correct KPIs and datasets.
- Reliability: testing_agent_v3 pass (backend + frontend) with no RBAC leaks found.
- UX: modern minimal + data-rich hybrid UI; responsive layout; consistent components.

🚀 **Success criteria for Phase 4+ enhancements**
- Exports and reminders are reliable and configurable.
- Dashboards remain fast at scale (pagination + indexes + aggregation optimizations).
- Audit and permissions meet internal compliance needs.
