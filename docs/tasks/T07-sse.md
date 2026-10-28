# T07 SSE real-time

Files: sse/hub.ts, routes/events.ts, controllers/eventsController.ts, middleware/authenticateStream.ts,
services/ticketEvents.ts (replace the stub body to call the hub), services/ticketService.ts (publish on create).

Auth problem: browsers' EventSource cannot send an Authorization header. Do NOT put the main JWT in the URL.

- POST /events/token (normal Bearer auth) -> { streamToken, expiresInSeconds: 60 }.
  Signed HS256 with env.JWT_SECRET, payload {sub, role, authorId, purpose:'sse'}, expiresIn 60s.
- GET /events?token=<streamToken> -> authenticateStream verifies HS256 + purpose==='sse' (a normal login
  token must be rejected here, and a stream token must be rejected by normal `authenticate`).
  This route is registered BEFORE the global authenticate middleware, with its own authenticateStream.

Hub (sse/hub.ts): Map<string, Set<Response>> keyed by `author:<authorId>` or `admins`.

- subscribe(key, res), unsubscribe, publish(key, event). Frame: `event: <type>\ndata: <json>\n\n`.
- Headers: Content-Type text/event-stream, Cache-Control no-cache, Connection keep-alive,
  X-Accel-Buffering: no; call res.flushHeaders(); send initial `event: ready`.
- Heartbeat comment `: ping\n\n` every 25s per connection; clear timer and unsubscribe on req 'close'.
- Payload is MINIMAL: {type, ticketId}. Clients refetch via the normal API. Nothing sensitive goes over SSE.
  Who gets what: authors subscribe to author:<their authorId> (events: ticket.reply, ticket.updated);
  admins subscribe to 'admins' (events: ticket.created, ticket.triaged (T10), ticket.reply from other admins).
  Wire: ticketEvents.publishTicketEvent maps {authorId}->author key, {admins:true}->'admins'.
  On POST /tickets success publish {admins:true} ticket.created.
  Acceptance: curl -N "…/events?token=…" stays open and prints `event: ready`; admin reply makes
  `event: ticket.reply` appear on the author's stream within ~1s; Rohit's stream does NOT receive Priya's events;
  main login JWT in ?token= -> 401. Disconnecting removes the connection from the hub (log the count).
  Commit: feat(sse): realtime ticket events with short-lived stream tokens
