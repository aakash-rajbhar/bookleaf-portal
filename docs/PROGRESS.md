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
| T12c | Author tickets with live updates | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T12b complete (built `src/lib/format.ts` with `en-IN` currency, dates, numbers, and em dash `—` fallback; built `src/components/StatusBadge.tsx` with green published and amber in-production styling; built `src/components/BookCard.tsx` with production banner, hidden royalty block when in production, pending royalty payout notes, metadata, and quick query link; updated `src/pages/author/Books.tsx` with loading, error retry, empty states, and quick stats bar; built `src/pages/author/SubmitQuery.tsx` with book dropdown including General and in-production titles, live character counters, client/server validation display, demo attachment notice, double-submit prevention, and seamless redirect to `/tickets/:id` with success banner; updated `Login.tsx` with exact demo author accounts; logged D19 in `docs/DECISIONS.md`).
- Not done: T12c (Author tickets with live updates).
- Next: T12c (`docs/tasks/T12c-author-tickets-live.md`).
- Known bugs: none.


