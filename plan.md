# Rex Botanix CRM — plan.md (Updated)

## 1) Objectives
- **Deliver a working V1 CRM (DONE)** for Rex Botanix to manage field sales operations: dealers, field/farm/dealer visits, enquiries, sales requirements, uploads, requests/approvals, teams, dashboards, and messaging.
- **Support multi-role access (DONE)** across **5 roles** (Owner, Admin, Manager, Sales Rep, Dealer) with **email/password + Emergent Managed Google OAuth**.
- **Provide modern-minimal UI with bold, data-rich dashboards (DONE)**: KPI cards, filters, charts (recharts), quick actions, and fast reporting flows.
- **Ensure end-to-end stability (DONE)**: testing_agent_v3 executed with **61/61 backend tests passed** and **all major frontend flows passed**.
- **Deliver requested Phase 3 enhancements (DONE)** as **v1.1**:
  1) **CSV/PDF exports**, 2) **Territories + geo-tagging**, 3) **SLA reminders + resolve workflow**, 4) **Audit log + granular permissions**, 5) **Dark-mode toggle**.
- **Current objective (Phase 4+)**: optional scaling hardening (pagination, query optimization), operational controls (retention, admin settings), and product refinements.

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

### Phase 4 — Enhancements (Requested backlog) ✅ **COMPLETE (v1.1)**
> Implemented all requested enhancements end-to-end, including backend + frontend + RBAC updates.

#### 4.1 Exports (CSV/PDF) ✅
**Backend**
- New module: `/app/backend/routes/export_routes.py`
- Endpoints:
  - `GET /api/exports/reports.csv` (role-scoped)
  - `GET /api/exports/reports.pdf` (role-scoped, reportlab)
  - `GET /api/exports/requests.csv` (role-scoped)
  - `GET /api/exports/dashboard.pdf?days=N` (owner/admin only)

**Frontend**
- Reports page: Export dropdown (CSV + PDF)
- Requests page: Export CSV (owner/admin/manager only)
- Owner + Admin dashboards: Export PDF

#### 4.2 Territories + Geo-tagging ✅
**Backend**
- New collection: `territories`
- Models: `TerritoryIn`, `GeoPoint`
- Endpoints: `GET/POST/PATCH/DELETE /api/territories` (POST/PATCH/DELETE owner+admin)
- Reports support: `territory_id` + `geo` (lat/lng/accuracy/captured_at)
- Dealers support: `territory_id` + optional `location` GeoPoint

**Frontend**
- New page `/territories` with create/edit dialog:
  - name/code/region/state/districts
  - geo center lat/lng
  - optional team + manager + rep coverage
- NewReport form:
  - territory dropdown
  - “Capture location” (navigator.geolocation) for visit-type reports

#### 4.3 SLA reminders + auto-followups ✅
**Backend**
- Reports support `due_at` and resolve fields (`resolved`, `resolved_at`, `resolved_by_name`).
- New endpoints:
  - `GET /api/sla/overdue`
  - `GET /api/sla/upcoming?days=7`
  - `POST /api/sla/sweep`
  - `POST /api/reports/{id}/resolve`
- Background task: asyncio loop runs every 15 minutes to notify:
  - report author + their managers
  - notification type: `sla_overdue`

**Frontend**
- New page `/overdue` with Overdue + Upcoming tabs + inline Resolve
- NewReport form: due date input for enquiry/requirement types
- Reports list: Overdue-only toggle + Overdue/Resolved badges + inline Resolve

#### 4.4 Audit log + Admin-vs-Manager permission split ✅
**Backend**
- New collection: `audit_log`
- Helper: `audit.record()` invoked from user/team/product/territory/dealer/report/request actions.
- New permissions module: `/app/backend/permissions.py` (explicit action matrix)
- Audit endpoint (owner/admin only): `GET /api/audit`
- Testing agent fixes applied:
  - Dealer can `GET /api/territories` (added `territories.read`)
  - POST endpoints return `201` where appropriate

**Frontend**
- New page `/audit` with entity/action filters and metadata display
- Navigation updated:
  - Audit visible only to owner/admin
  - Territories visible to internal roles (and dealer read-only access remains via backend)

#### 4.5 Dark mode toggle ✅
**Frontend**
- ThemeProvider: `/app/frontend/src/lib/theme.js`
  - persists to `localStorage: rbx_theme`
  - respects `prefers-color-scheme`
- Header toggle: sun/moon button
- Uses existing `.dark` tokens in `index.css`.

#### Phase 4 Testing ✅
- testing_agent_v3 executed targeted Phase 4 tests.
- Backend: **100% pass after fixes**.
- Frontend: **~95%** (one item flagged: modal overlay blocks navigation while dialog open — **expected shadcn Dialog behavior**; ESC/Cancel closes).

---

### Phase 5+ — Optional scaling / product hardening (Backlog)
- Pagination and server-side filtering for all list endpoints (dealers, reports, requests, audit).
- Export customization (fields selection, date range, territory/team filters) + scheduled weekly owner email.
- SLA escalation rules (2-level escalation, reminders before due date, per-report-type SLAs).
- Geo validation + maps view (pin reports/dealers on map), geo-fencing per territory.
- Attachment storage upgrade (S3-compatible) if file sizes increase beyond base64 practicality.
- Compliance: retention policies for audit log, PII masking options.

## 3) Next Actions
1. **(Optional)** Add server-side pagination + indexes tuning for larger datasets.
2. **(Optional)** Add scheduled exports (weekly/monthly PDF packs) and shareable links.
3. **(Optional)** Add map view for territories/dealers/reports.
4. **(Optional)** Add SLA escalation rules + pre-due reminders.
5. **(Optional)** Add admin-configurable permission scopes (feature flags per role).

## 4) Success Criteria
✅ **Met for V1.1 (current state)**
- Auth: email/password + Google OAuth supported; session token works via cookie and bearer header.
- Core flows: dealer onboarding, reporting with base64 attachments, approvals, messaging, notifications work end-to-end.
- Enhancements delivered:
  - Exports: CSV/PDF endpoints + UI download actions
  - Territories + geo-tagging: territory CRUD + report geo capture
  - SLA: due dates, overdue/upcoming lists, sweep notifications, resolve flow
  - Audit log: sensitive actions captured + audit viewer
  - Dark mode: persistent theme toggle
- Reliability: testing_agent_v3 coverage for v1 + targeted v1.1 tests.
- UX: modern minimal + data-rich hybrid UI; responsive layout; consistent components.

🚀 **Success criteria for future Phase 5+**
- Dashboards and lists remain fast at scale (pagination + aggregation optimizations).
- SLA reminders are configurable and measurable (reduction in overdue backlog).
- Audit and permissions meet internal compliance needs (retention, traceability).