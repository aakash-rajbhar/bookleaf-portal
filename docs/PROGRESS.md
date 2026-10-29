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
| T15 | README, API docs, 1-page write-up | done |

## Last session
- Agent: Antigravity (Gemini)
- Done: Measured evaluation and live app draft benchmarks complete. Executed live evaluations with `gemini-3.5-flash-lite`:
  1) Triage evaluation (`docs/evidence/eval-triage-real.txt` and `eval-triage-fallback.txt`): 19 cases evaluated. Fallback achieved 100% category and priority accuracy (0.0 ms). LLM achieved 100.0% category accuracy (19/19), 94.7% priority exact match (18/19), 100.0% priority within 1 level, and 1,301.2 ms avg latency. Discrepancy on `kb-2` (predicted High vs expected Medium) documented honestly.
  2) Real live drafts on 3 author tickets (BK005, BK016, BK015): verified all drafts returned `source: 'ai'`, `model: 'gemini-3.5-flash-lite'`, `cached: false`, adhered to word counts (< 180 words), matched computed facts, and ended with clear next steps. Cached hit verified with zero new `ai_usage_log` rows. Saved raw responses and author facts to `docs/evidence/`.
  3) Telemetry metrics from `ai_usage_log` (`docs/evidence/usage.txt`): Draft avg 1,091 prompt / 201 completion tokens / 7,603 ms (n=3); Triage avg 937 prompt / 33 completion tokens / 4,449 ms (n=3).
  4) Updated `README.md`, `docs/WRITEUP.md`, and `docs/DECISIONS.md` (D24) with strictly measured figures and raw draft texts.
- Not done: Live deployment URLs left as `TODO(me)` for manual deployment.
- Next: Deploy live frontend and API if needed.
- Known bugs: none.






