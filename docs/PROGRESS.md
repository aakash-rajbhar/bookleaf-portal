# PROGRESS (update before stopping. Next agent starts here)

## Checklist  (todo | doing | done)
| ID | Task | Status |
|---|---|---|
| T01 | Backend bootstrap: install, env validation, health route, error handler | done |
| T02 | DB pool + SQL migrations (schema from DATA_MODEL.md) | done |
| T03 | Seed script (JSON -> authors/books, users, admins) | done |
| T04 | Auth: login, JWT, authenticate + requireRole + validate middleware | done |
| T05 | Books endpoints with ownership rules | done |
| T06 | Tickets: author create/list/get | done |
| T07 | SSE hub + /events | todo |
| T08 | Admin ticket endpoints (queue filters, patch, notes, reply) | done |
| T09 | AI: LLMProvider, GeminiProvider, MockProvider, rate limiter | todo |
| T10 | AI: triage (classify+priority) + fallback classifier + usage log | todo |
| T11 | AI: draft generation (KB slicing, book facts, cache, fallback draft) | todo |
| T12 | Frontend scaffold + author portal | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T08 complete (implemented admin ticket management: single source of truth in `constants/ticket.ts`, `services/ticketEvents.ts` stub, `services/adminTicketService.ts`, `controllers/adminTicketController.ts`, `routes/admin.ts`; urgency queue sorting with SLA overdue calculation, whitelist parameterized filtering, transactional PATCH overrides tracking admin source, transactional reply advancing Open tickets and setting assignee, internal notes isolation, removed temporary `_debug` route; verified all test scenarios).
- Not done: T07 SSE hub + /events.
- Next: T07 (`docs/tasks/T07-sse.md`).
- Known bugs: none.
