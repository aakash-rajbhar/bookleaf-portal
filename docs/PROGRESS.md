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
| T13a | Admin ticket queue | done |
| T13b | Admin ticket detail with AI draft editor | done |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini)
- Done: T13b complete (implemented admin ticket detail view with two-column responsive layout; built `src/pages/admin/TicketDetail.tsx`; built `src/components/admin/DraftEditor.tsx` with StrictMode-safe single-invocation draft generation, unedited/template review hints, regenerate with confirm, reset to draft, resolve-on-send, character count, and isolated state protected from live refetches; built `src/components/admin/TicketControls.tsx` for status/category/priority PATCH and me/unassign assignment with inline error handling; built `src/components/admin/AiTriagePanel.tsx` with classifying status and retry button calling `POST /triage`; built `src/components/admin/AuthorBookPanel.tsx` displaying author profile, publication status, sales, and highlighted pending unpaid royalties with em-dash fallbacks; built `src/components/admin/InternalNotes.tsx` with distinct yellow styling and author-hidden disclaimer; extended `MessageThread.tsx` with admin viewer perspective; wired `useTicketStream` for live SSE updates; logged D22 in `docs/DECISIONS.md`).
- Not done: T14 (Deploy) & T15 (Docs).
- Next: T14 (`docs/tasks/T14-deploy.md`).
- Known bugs: none.





