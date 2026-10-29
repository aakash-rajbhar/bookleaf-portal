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
- Done: Category alignment with exact assignment specification (updated `backend/src/constants/ticket.ts` as single source of truth to use `'Royalty & Payments'`, `'ISBN & Metadata Issues'`, `'Printing & Quality'`, `'Distribution & Availability'`, `'Book Status & Production Updates'`, `'General Inquiry'`; added migration `004_rename_isbn_category.sql` dropping and recreating `tickets_category_check` and migrating existing rows; updated `backend/scripts/seed-demo.ts` including fixing ticket 2 `aiReason` from "Critical" to "High-priority"; updated AI triage prompt & few-shot examples `ai/prompts/triage.ts`; updated eval cases `ai/evals/triageCases.json`; updated `ai/fallbackClassifier.ts`, `ai/fallbackDraft.ts`, `ai/knowledgeBase.ts`, `ai/triage.ts`, and `ai/providers/mock.ts`; updated `backend/scripts/draft-check.ts`; updated frontend types `frontend/src/api/types.ts` and `CategoryBadge.tsx`; updated `docs/KNOWLEDGE_BASE.md` and `docs/DECISIONS.md`; successfully executed `npm run migrate` on dev DB, reseeded demo dataset with `reset:demo`, verified `npx tsx scripts/draft-check.ts` 5/5 cases, verified `eval:triage` 100% fallback accuracy across all 19 cases, and passed backend + frontend typechecks).
- Not done: T15 (README, API docs, 1-page write-up).
- Next: T15 (`docs/tasks/T15-docs.md`).
- Known bugs: none.






