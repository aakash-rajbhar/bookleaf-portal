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
| POST | /admin/tickets/:id/draft | admin | generate (or return cached; body: {regenerate?: boolean}) draft |
| POST | /admin/tickets/:id/reply | admin | {body} -> message visible to author, SSE push |
| POST | /admin/tickets/:id/notes | admin | {body} internal note |
| POST | /admin/tickets/:id/triage | admin | re-run AI triage (retry after failure) |

### Draft Generation Endpoint (`POST /admin/tickets/:id/draft`)
- **Role**: Admin only (`Bearer <jwt>`)
- **Request Body** (optional):
  ```json
  {
    "regenerate": true
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "text": "Hello Ananya,\n\nThank you for reaching out...",
    "source": "ai",
    "model": "gemini-3.5-flash-lite",
    "createdAt": "2026-10-28T10:15:30.000Z",
    "cached": false
  }
  ```
- **Fallback / Failure Response** (`200 OK` with template source):
  ```json
  {
    "text": "Hello Ananya,\n\nThank you for reaching out to BookLeaf Support...",
    "source": "template",
    "model": null,
    "createdAt": "2026-10-28T10:15:30.000Z",
    "cached": false,
    "reason": "upstream"
  }
  ```
- **Cached Response** (`200 OK` when `regenerate: false` and draft exists):
  `cached: true`, zero provider requests made, zero `ai_usage_log` rows written.

### Admin Ticket Detail (`GET /admin/tickets/:id`)
Includes `latestDraft`:
```json
{
  "latestDraft": {
    "id": "uuid",
    "draftText": "...",
    "model": "gemini-3.5-flash-lite",
    "source": "ai",
    "createdAt": "2026-10-28T10:15:30.000Z"
  }
}
```
(`latestDraft` is `null` if no draft has been generated yet; GET never triggers AI generation).

