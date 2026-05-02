# Auth-Gated App Testing Playbook (Emergent Google OAuth + Email/Password)

This CRM supports BOTH:
1. Email/Password authentication (bcrypt + JWT/session_token) — primary for demo/testing
2. Emergent Managed Google OAuth — alternative sign-in

## Seed Test Users (Email/Password)

All seeded on backend startup. Default password for every seed user: `Passw0rd!`

| Role         | Email                         | Notes                                 |
|--------------|-------------------------------|---------------------------------------|
| owner        | owner@rexbotanix.com          | Full company-wide visibility          |
| admin        | admin@rexbotanix.com          | Manages users/teams/products/approvals|
| manager      | manager@rexbotanix.com        | Approves requests, sees team data     |
| sales_rep    | rep@rexbotanix.com            | Field reporting, messaging            |
| sales_rep    | rep2@rexbotanix.com           | 2nd rep for team scenarios            |
| dealer       | dealer@rexbotanix.com         | Dealer self-service dashboard         |

## Login Flow (Email/Password)

- POST `/api/auth/login` with `{ "email": "...", "password": "..." }`
- Backend returns `{ "session_token": "...", "user": {...} }` AND sets an httpOnly `session_token` cookie.
- Frontend stores returned user and navigates to role-based dashboard.

## Login Flow (Google OAuth)

- Frontend button redirects to `https://auth.emergentagent.com/?redirect={window.location.origin}/dashboard`
- After Google auth, user returns to `/dashboard#session_id=<id>`
- Frontend detects fragment, calls `POST /api/auth/google/session` with `{ session_id }` (backend calls Emergent `/session-data`)
- Backend finds/creates user (default role: `sales_rep`), stores `session_token`, sets cookie, returns user.
- NEW Google OAuth users default to `sales_rep` role; admin can promote.

## Auth Verification Endpoint

- `GET /api/auth/me` → returns current user (reads `session_token` from cookie OR `Authorization: Bearer <token>` header)

## Backend Testing via curl

```
# Login
curl -X POST "${REACT_APP_BACKEND_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rexbotanix.com","password":"Passw0rd!"}'

# Use session_token returned:
curl -X GET "${REACT_APP_BACKEND_URL}/api/auth/me" \
  -H "Authorization: Bearer <SESSION_TOKEN>"
```

## Browser Testing via Playwright

```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "<SESSION_TOKEN_FROM_LOGIN>",
    "domain": "<host-of-REACT_APP_BACKEND_URL>",  # same host as frontend
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None",
}])
```

Alternatively, the testing agent can simply POST to `/api/auth/login` via fetch in the browser — the backend sets the cookie automatically.

## Checklist

- [x] user_sessions collection stores { session_token, user_id, expires_at }
- [x] user documents use custom `user_id` field (uuid), NOT MongoDB `_id`
- [x] All queries use `{_id: 0}` projection
- [x] RBAC enforced via `require_roles([...])` dependency
- [x] Each role has distinct dashboard and navigation
- [x] Datetimes stored as timezone-aware UTC
