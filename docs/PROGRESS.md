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
| T12 | Frontend scaffold + author portal | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T11 complete (applied migration `003_draft_source.sql` adding `source` check constraint and nullable model on `ai_drafts`; created `ai/knowledgeBase.ts` with strict category slicing; implemented pure `ai/bookFacts.ts` computing overdue status, rollover thresholds, and calendar-quarter deadlines; built `ai/prompts/draft.ts` with untrusted ticket delimiters and word caps; implemented pure `ai/fallbackDraft.ts` templates; created on-demand cached `services/draftService.ts` and `POST /admin/tickets/:id/draft` admin endpoint; updated `adminTicketService.ts` and `mappers.ts` to expose `latestDraft` with source on `GET /admin/tickets/:id`; created `scripts/draft-check.ts` verifying prompt sizing and facts for BK005, BK016, BK013, BK002, and General; logged D16 and D17 in `docs/DECISIONS.md`; updated `docs/API.md`).
- Not done: T12 Frontend scaffold + author portal.
- Next: T12 (`docs/tasks/T12-frontend-scaffold.md` or next task).
- Known bugs: none.
