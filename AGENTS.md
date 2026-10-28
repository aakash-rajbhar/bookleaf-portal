# AGENTS.md — read this first (any AI agent: opencode, Gemini, Claude, Copilot...)

## Project
BookLeaf Author Support & Communication Portal: a take-home assignment (CONFIDENTIAL, keep repo PRIVATE).
Two UIs (author, admin) + REST API + AI-assisted ticket handling (classify, prioritise, draft replies).
Full requirements: `docs/ASSIGNMENT.md`. Company policy used by the AI: `docs/KNOWLEDGE_BASE.md`.

Grading weights: AI integration 25% | Architecture & code quality 25% | API design 15% |
Functionality 15% | Product thinking 10% | Docs 10%. The developer must be able to explain every line.

## Stack
- Backend: Node 20+, Express 5, TypeScript, PostgreSQL via `pg` (plain SQL migrations, no ORM), zod, JWT + bcryptjs
- AI: Google Gemini (free tier) via `@google/genai`, behind an `LLMProvider` interface (see `docs/AI_DESIGN.md`)
- Realtime: Server-Sent Events
- Frontend: React + Vite + Tailwind (built later, Day 4)

## Folder map
- `backend/src/routes` HTTP wiring only | `controllers` req/res | `services` business logic
- `backend/src/ai` provider, prompts, KB slicing, classifier, fallback | `middleware` auth/rbac/validate/errors
- `backend/src/db` pool, migrations (`NNN_name.sql`), seed | `sse` event hub | `config/env.ts` validated env
- `docs/` context, `docs/tasks/` one small task per file, `data/` seed JSON

## Commands (run inside `backend/`)
- `npm install` | `npm run dev` | `npm run typecheck` | `npm run migrate` | `npm run seed`

## Hard rules
1. Gemini API key lives ONLY in backend `.env`. Never hardcode, never send to frontend, never commit `.env`.
2. Layering: routes -> controllers -> services -> db/ai. No SQL in controllers, no req/res in services.
3. Validate every request body/query/params with zod. Return structured errors `{error:{code,message,details?}}`, never raw 500s.
4. All routes except `POST /api/v1/auth/login` and `GET /api/v1/health` require auth. Authors see only their own data.
5. Internal notes must NEVER appear in any author-facing response.
6. Ticket creation must succeed even if AI is down. AI runs async; failures degrade to rule-based fallback / manual reply.
7. Do not send the whole KB or whole ticket history to the LLM. Slice by category (see AI_DESIGN).
8. Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`), small commits.
9. Do not invent policy. Anything the AI says must come from the KB or the author's real data.

## Frontend rules
1. Typed API access ONLY through `src/api/client.ts` (never call raw `fetch()` directly in components).
2. No API keys or secrets anywhere in frontend code or frontend environment variables.
3. Money values must be formatted in Indian rupees via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
4. Null / missing values show an em dash (`—`), never `0`, empty string, or `"null"`.
5. Every view and page MUST implement loading, error, and empty states.
6. Admin fields (category, priority, triage AI fields, internal notes) must NEVER be rendered in author views.

## Workflow protocol (this makes agent switching seamless)
- BEFORE starting: read `docs/PROGRESS.md`, then the single task file you are working on in `docs/tasks/`.
- Do ONE task at a time. Stay within its "Files to touch".
- AFTER finishing (or when stopping): update `docs/PROGRESS.md` (checklist + "Last session" block), log any design choice in `docs/DECISIONS.md`, commit.
