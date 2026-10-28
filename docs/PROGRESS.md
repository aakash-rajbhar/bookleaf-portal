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
| T07 | SSE hub + /events | done |
| T08 | Admin ticket endpoints (queue filters, patch, notes, reply) | done |
| T09 | AI: LLMProvider, GeminiProvider, MockProvider, rate limiter | done |
| T10 | AI: triage (classify+priority) + fallback classifier + usage log | done |
| T11 | AI: draft generation (KB slicing, book facts, cache, fallback draft) | done |
| T12a | Frontend scaffold, auth, routing, and api client | done |
| T12b | Author books + submit query | done |
| T12c | Author tickets with live updates | done |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T12c complete (added `formatRelativeTime` and `formatDateTime` helpers to `src/lib/format.ts`; built `src/components/TicketStatusBadge.tsx` with Open=blue, In Progress=amber, Resolved=green, Closed=grey; built `src/components/MessageThread.tsx` rendering author original query and chronological replies with official BookLeaf Support badge and pre-wrap line breaks; built `src/hooks/useTicketStream.ts` and `src/components/StreamStatusIndicator.tsx` supporting 60s stream token acquisition, auto token-refresh on reconnect with exponential backoff, 30s polling fallback while disconnected, document visibility refetch, and StrictMode duplicate-connection protection; built `src/pages/author/Tickets.tsx` with unread dot indicators via localStorage, live stream updates, and empty/error states; built `src/pages/author/TicketDetail.tsx` with one-off submission notice clearance from history state, read tracking, friendly 404 handling, and live updates; logged D20 in `docs/DECISIONS.md`).
- Not done: T13 (Admin portal).
- Next: T13 (`docs/tasks/T13-admin-portal.md` or next task).
- Known bugs: none.



