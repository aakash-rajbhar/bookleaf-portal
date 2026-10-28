# T08 Admin tickets

Files: constants/ticket.ts (NEW), routes/admin.ts, controllers/adminTicketController.ts,
services/adminTicketService.ts, services/ticketEvents.ts (STUB), utils/mappers.ts (add admin mapper),
routes/index.ts (mount /admin after authenticate, with requireRole('admin') on the whole router).
Also: DELETE the temporary /\_debug/admin-only route.

constants/ticket.ts: single source of truth, exported as const arrays + types:
TICKET_STATUSES, TICKET_CATEGORIES (6 exact strings from ASSIGNMENT.md), TICKET_PRIORITIES,
PRIORITY_RANK {Critical:0,High:1,Medium:2,Low:3}, SLA_HOURS {Critical:24,High:48,Medium:96,Low:168}.
Zod schemas and (later) AI prompts import from here. Never retype these strings elsewhere.

ticketEvents.ts stub: export function publishTicketEvent(target: {authorId?: string; admins?: boolean},
event: {type: string; ticketId: string}): void // no-op + console.debug for now. T07 implements it.

Endpoints (all admin only):

1. GET /admin/tickets
   Query (zod, all optional): status, category, priority (enum values), from, to (ISO dates, filter created_at,
   `to` inclusive of the whole day), assignedTo ('me' | 'unassigned' | user uuid), q (matches subject, ILIKE),
   sort ('urgency' default | 'newest' | 'oldest'), limit (default 25, max 100), offset.
   Response: { items: [...], total, limit, offset }.
   'urgency' ORDER BY: unresolved first (status IN ('Open','In Progress') before Resolved/Closed),
   then priority rank (NULL priority treated as Medium rank), then created_at ASC (oldest first).
   Each item: id, subject, status, category, categorySource, priority, prioritySource, aiStatus,
   authorId, authorName, bookId, bookTitle, assignedTo {id,name}|null, createdAt, updatedAt,
   ageHours, isOverdue (unresolved AND ageHours > SLA_HOURS[priority ?? 'Medium']).
   Filtering and sorting happen in SQL with parameterized queries. Build WHERE dynamically but only
   from whitelisted columns; never interpolate user input.
2. GET /admin/tickets/:id
   Full ticket + author {id,name,email,city} + book (full facts, null for General) + messages (ASC)
   - internalNotes (ASC, with admin name) + aiReason + latestDraft (null for now, T11 fills it).
3. PATCH /admin/tickets/:id body (zod, at least one field): status?, category?, priority?, assignedTo? ('me' | null)
   - category change -> category_source='admin'; priority change -> priority_source='admin'.
   - assignedTo 'me' -> req.user.id; null -> unassign.
   - status Resolved/Closed -> set resolved_at=now(); moving back to Open/In Progress -> resolved_at=NULL.
   - Always bump updated_at. Return the admin-mapped ticket. 404 if missing. Empty body -> 400.
   - After commit: publishTicketEvent({authorId}, {type:'ticket.updated', ticketId}) only if status changed.
4. POST /admin/tickets/:id/reply body: { body: 1-5000 chars trimmed, markResolved?: boolean }
   - One DB transaction: insert ticket_messages(sender_role='admin', sender_id=req.user.id);
     if status was 'Open' -> 'In Progress'; if unassigned -> assign to the replier;
     if markResolved -> 'Resolved' + resolved_at.
   - 409 CONFLICT if ticket is Closed.
   - After commit publish {type:'ticket.reply'} to the author. Return the created message.
5. POST /admin/tickets/:id/notes body: { body: 1-2000 } -> insert internal_notes, return note. No event.

Rules: internal notes never appear in author responses (re-check the T06 mapper still excludes them).
Use transactions where more than one table is written. 404 for missing ticket on every :id route.
Acceptance: see curl list in PROGRESS or Postman. Commit: feat(admin): ticket queue, overrides, reply, notes
