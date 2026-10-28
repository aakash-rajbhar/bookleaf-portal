# PROGRESS (update before stopping. Next agent starts here)

## Checklist  (todo | doing | done)
| ID | Task | Status |
|---|---|---|
| T01 | Backend bootstrap: install, env validation, health route, error handler | todo |
| T02 | DB pool + SQL migrations (schema from DATA_MODEL.md) | todo |
| T03 | Seed script (JSON -> authors/books, users, admins) | todo |
| T04 | Auth: login, JWT, authenticate + requireRole + validate middleware | todo |
| T05 | Books endpoints with ownership rules | todo |
| T06 | Tickets: author create/list/get | todo |
| T07 | SSE hub + /events | todo |
| T08 | Admin ticket endpoints (queue filters, patch, notes, reply) | todo |
| T09 | AI: LLMProvider, GeminiProvider, MockProvider, rate limiter | todo |
| T10 | AI: triage (classify+priority) + fallback classifier + usage log | todo |
| T11 | AI: draft generation (KB slicing, book facts, cache, fallback draft) | todo |
| T12 | Frontend scaffold + author portal | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Claude (scaffolding)
- Done: repo structure, all docs, backend skeleton files (package.json, tsconfig, env config, app/server, health route, error handler).
- Not done: nothing installed/run on the user's machine yet.
- Next: T01 (verify the skeleton runs), then T02.
- Known bugs: none yet.
