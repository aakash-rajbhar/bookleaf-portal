# REST API contract (base: /api/v1) — write code to match this; update when changing.
Error shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`
Auth: `Authorization: Bearer <jwt>`. Codes: 400 validation, 401 unauthenticated, 403 wrong role, 404 not found, 409 conflict, 429 rate limited, 500 unexpected.

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | /health | public | liveness + db check |
| POST | /auth/login | public | {email,password} -> {token,user} |
| GET | /auth/me | any | current user |
| GET | /books | author (own) / admin (all, ?authorId=) | list books |
| GET | /books/:id | owner/admin | one book |
| POST | /tickets | author | create ticket {bookId?,subject,description} |
| GET | /tickets | author | own tickets |
| GET | /tickets/:id | owner | ticket + messages (no internal notes) |
| GET | /events | any | SSE stream (author: own ticket events) |
| GET | /admin/tickets | admin | queue; ?status&category&priority&from&to&assignedTo&sort |
| GET | /admin/tickets/:id | admin | ticket + messages + notes + latest draft + author/book context |
| PATCH | /admin/tickets/:id | admin | {status?,category?,priority?,assignedTo?} (overrides set *_source='admin') |
| POST | /admin/tickets/:id/draft | admin | generate (or return cached; ?regenerate=true) AI draft |
| POST | /admin/tickets/:id/reply | admin | {body} -> message visible to author, SSE push |
| POST | /admin/tickets/:id/notes | admin | {body} internal note |
| POST | /admin/tickets/:id/triage | admin | re-run AI triage (retry after failure) |
