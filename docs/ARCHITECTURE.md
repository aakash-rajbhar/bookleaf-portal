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

## Roles
`author` (users.author_id set) and `admin`. Ownership check lives in services (ticket.author_id === user.author_id) and returns 404 for foreign tickets (avoid leaking existence).
