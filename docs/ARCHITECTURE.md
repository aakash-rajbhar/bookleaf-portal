# Architecture

## Layers (backend)
```
HTTP -> routes (wiring + middleware chain) -> controllers (parse req, call service, shape res)
     -> services (business rules) -> db (pg queries) | ai (LLM provider, prompts, fallback)
```
- Middleware chain per route: `authenticate` -> `requireRole(...)` -> `validate(zodSchema)` -> controller.
- Central `errorHandler` converts `AppError` and `ZodError` to `{error:{code,message,details?}}`.
- Services throw `AppError` (e.g. NotFound, Forbidden, Conflict). Controllers never catch for flow control.

## Ticket lifecycle
1. Author `POST /tickets` -> ticket saved (status Open, ai_status `pending`) -> 201 returned immediately.
2. `TicketService` enqueues an AI triage job (async, non-blocking): classify + priority in ONE LLM call.
   - success: category/priority saved with `*_source = 'ai'`, ai_status `done`
   - failure/quota: rule-based fallback fills category/priority with `*_source = 'fallback'`, ai_status `failed`
3. Admin opens ticket -> `POST /admin/tickets/:id/draft` returns cached draft or generates one (category KB slice + author's book data + ticket text).
4. Admin edits + sends reply -> stored in `ticket_messages` -> SSE event pushed to the owning author.
5. Status changes / overrides also emit SSE events (author only receives author-visible fields).

## SSE hub
In-memory `Map<string, Set<Response>>` keyed by `author:<authorId>` or `admins`. `publish(key, event)` writes `event:`/`data:` frames with minimal payloads `{type, ticketId}` (clients refetch full data via the REST API). Heartbeat comment `: ping\n\n` every 25s; connections cleanly unsubscribe on close.
Auth for SSE: EventSource cannot set headers; clients exchange their Bearer token for a 60-second single-purpose JWT (`purpose: 'sse'`) at `POST /events/token`, passed to `GET /events?token=...` (see DECISIONS.md).

## Roles & Data Boundaries
- **Roles**: `author` (users with `author_id` set) and `admin`.
- **Author Ownership Isolation**: Ownership checks live strictly in services (`ticket.author_id === user.author_id`). Accessing resources owned by another author returns `404 Not Found` (rather than `403 Forbidden`) to eliminate ID enumeration.
- **Strict Data Boundary**: Administrative metadata (`category`, `category_source`, `priority`, `priority_source`, `ai_status`, `ai_reason`, `internal_notes`, and `ai_drafts`) are strictly stripped from all author-facing responses and database queries.
- **Internal Staff Notes**: Staff notes are strictly isolated and never visible or transmitted to authors under any circumstance.

## Hard Security & Engineering Rules
1. **API Key Security**: The Gemini API key lives ONLY in backend `.env`. It is never hardcoded, never sent to the frontend, never logged, and `.env` is strictly gitignored.
2. **Strict Layering**: `routes` -> `controllers` -> `services` -> `db` / `ai`. Controllers contain no SQL queries; services contain no HTTP `req` or `res` objects.
3. **Zod Validation**: Every request body, query parameter, and route parameter is validated using Zod schemas. Handlers return structured error responses `{error: {code, message, details?}}`, never raw 500s or unhandled exceptions.
4. **Resilient AI Degradation**: Ticket creation always succeeds immediately regardless of AI availability. Triage runs asynchronously in a background queue; upstream outages or quota limits degrade cleanly to deterministic rule-based triage (`fallbackClassifier`) and template drafts (`fallbackDraft`).
5. **Prompt Slicing**: The LLM prompt never receives the full Knowledge Base or raw conversation dumps. Context is strictly sliced by ticket category, keeping token size tightly budgeted.

## Frontend Engineering Rules
1. **Typed API Access**: All API communication occurs strictly through the typed client (`src/api/client.ts`). Components never execute raw `fetch()` calls.
2. **Secret-Free Client**: No API keys, credentials, or backend secrets exist in frontend code or environment variables.
3. **Currency Formatting**: All monetary values are formatted in Indian Rupees using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
4. **Clean Missing Value Presentation**: Missing or null fields display an em dash (`—`), never `0`, empty string, or `"null"`.
5. **State Completeness**: Every view and page explicitly implements loading spinners, error banners, and empty state fallbacks.
6. **Author View Sanitization**: Admin fields (category, priority, triage badges, internal notes) are never rendered in author views.
