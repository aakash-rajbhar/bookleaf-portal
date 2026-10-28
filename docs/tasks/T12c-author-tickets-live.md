# T12c Author tickets with live updates

Files: src/pages/author/Tickets.tsx, src/pages/author/TicketDetail.tsx, src/hooks/useTicketStream.ts, src/components/{TicketStatusBadge,MessageThread}.tsx.
Tickets list (GET /tickets): newest first, subject, book title or "General", status badge (Open, In Progress, Resolved, Closed),
created/updated time, a "new reply" indicator. Empty state with a button to submit a query.
Ticket detail (GET /tickets/:id): original query, then a chronological thread (author message vs BookLeaf Support), status badge.
Never render category, priority, or internal fields (the API does not send them; do not add them).
useTicketStream hook: 1) POST /events/token for a 60s stream token, 2) open EventSource(`${base}/events?token=...`), 3) on events ticket.reply / ticket.updated / ticket.created refetch the affected list or detail through the normal API
(payloads only carry {type, ticketId}), 4) EventSource auto-reconnect would reuse the expired token, so on error close it and
reconnect manually: fetch a NEW stream token with exponential backoff (1s, 2s, 4s ... max 30s), 5) fall back to polling every 30s
while the stream is down, 6) close on unmount and on logout; never open two streams (React StrictMode double-mount: clean up properly).
Show a small "Live" / "Reconnecting..." indicator.
Acceptance: with an author on /tickets/:id, an admin reply (Postman) appears within ~2s without refresh; status changes update the badge;
a second browser logged in as another author sees nothing; stopping the backend shows "Reconnecting..." and recovers when it returns;
StrictMode does not leave duplicate streams (check the Network tab).
Commit: feat(frontend): author tickets with realtime updates
