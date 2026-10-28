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
| T14 | Deploy prep + demo data (Render + Vercel) | done |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini)
- Done: T14 complete (fixed backend build with `backend/tsconfig.build.json` targeting `rootDir: "src"` and verified `npm run build && npm start` serves `/api/v1/health`; added `frontend/vercel.json` with SPA rewrite to prevent deep link 404s; created `backend/scripts/seed-demo.ts` with 7 idempotent demo tickets with fixed UUIDs and relative timestamps covering overdue SLA, fallback classification, replies, and internal notes; created `backend/scripts/reset-demo.ts` with `CONFIRM_RESET=yes` guard; verified `npm run seed:demo` idempotency; created `docs/DEPLOY.md` detailing architecture topology, environment variables, Render/Vercel configuration, post-deploy smoke tests, and cold starts; logged D23 in `docs/DECISIONS.md`).
- Not done: T15 (README, API docs, 1-page write-up).
- Next: T15 (`docs/tasks/T15-docs.md`).
- Known bugs: none.






