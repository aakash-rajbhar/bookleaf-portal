# T13a Admin queue

Files: src/pages/admin/Queue.tsx, src/components/admin/{FilterBar,PriorityBadge,CategoryBadge,AiSourceBadge,TicketRow}.tsx,
src/components/Pagination.tsx, src/api/types.ts (admin types), src/auth/ProtectedRoute (admin routes), Layout (admin nav).

Before coding: read backend/src/services/adminTicketService.ts, utils/mappers.ts and the admin controller for the EXACT query params
and response shape of GET /admin/tickets ({items,total,limit,offset}, ageHours, isOverdue, prioritySource, categorySource, aiStatus,
assignedTo). Trust the code over the docs.

Routes: /admin (queue), /admin/tickets/:id (T13b; leave a placeholder). Admin-only via ProtectedRoute; admin nav: Queue, logout.

Queue page:

- Filters (all optional, kept in the URL query string so a refresh or shared link keeps them): status, category, priority,
  assigned (All / Me / Unassigned), date from/to, search text (debounced 300ms), sort (Urgency default / Newest / Oldest).
  Reset button. Changing a filter resets the offset to 0.
- Table columns: priority badge, subject, author, book (or General), category (+ source badge), status, assignee, age.
  Row click opens /admin/tickets/:id.
- Spotting urgency: default sort is urgency (the backend does it). Overdue rows get a red left border and an "Overdue" chip;
  Critical/High priority badges are visually stronger (red / orange), Medium yellow, Low grey. Age shown as "3d 4h".
  Resolved/Closed rows are visually muted.
- AI state: aiStatus 'pending' -> small "Classifying..." chip and a neutral priority placeholder; 'failed' -> amber "Rule-based"
  chip with a tooltip "AI unavailable, rule-based fallback"; source 'admin' -> small "edited" marker. Null category/priority show an em dash.
- Summary strip above the table computed from the CURRENT filtered response total plus a second light query or the same list
  (e.g. count of Open, Overdue); if that needs extra API calls, skip it and show just the total ("42 tickets").
- Pagination: limit 25, previous/next with "Showing 1-25 of 42".
- Live updates: reuse useTicketStream. Admins receive 'ticket.created', 'ticket.triaged', 'ticket.reply'. On any event refetch the
  current page in place (no spinner flash, ignore out-of-order responses). Show the Live / Reconnecting indicator. If the stream
  endpoint does not accept admin tokens for the 'admins' channel, fix it in the BACKEND hub subscription and say so in the notes.
- States: loading (first load only), error with retry, empty ("No tickets match these filters" + reset button; "No tickets yet" when
  there are no filters).
  Acceptance: seed a mix of tickets; urgency order puts overdue/Critical first; each filter works and survives refresh; a new ticket from
  an author appears in the queue live and then gets its category/priority when triage finishes, without a reload.
  Commit: feat(frontend): admin ticket queue
