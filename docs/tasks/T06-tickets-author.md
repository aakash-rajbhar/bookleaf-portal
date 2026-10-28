# T06 Author tickets

Files: routes/tickets.ts, controllers/ticketController.ts, services/ticketService.ts,
services/triageQueue.ts (STUB), utils/mappers.ts (extend)

Endpoints:

- POST /tickets role: author only (requireRole('author'))
  body (zod): { bookId?: string|null, subject: 3-150 chars trimmed, description: 10-5000 chars trimmed }
  - If bookId given, verify it belongs to req.user.authorId, else 400 with code INVALID_BOOK
    (message: "Selected book does not belong to your account"). null/omitted = General / Account Level.
  - Insert with status 'Open', ai_status 'pending', category/priority NULL.
  - After insert call triageQueue.enqueue(ticket.id) inside try/catch; a failure there must NEVER fail the request.
    triageQueue is a stub for now (just console.log). Real one comes in T10.
  - Return 201 with the mapped ticket.
- GET /tickets own tickets, newest first, supports ?limit (default 50, max 100) & ?offset
- GET /tickets/:id own ticket + messages[] ordered by created_at ASC
  - Someone else's ticket -> 404.

AUTHOR-FACING SHAPE (important): { id, subject, description, status, bookId, bookTitle (JOIN, null for General),
createdAt, updatedAt, messages: [{id, senderRole, body, createdAt}] }
Must NOT include: category, priority, \*\_source, ai_status, ai_reason, assigned_to, internal notes.
(Admins can re-expose those in T08 via a separate admin mapper.)
Acceptance: Priya creates ticket for BK001 -> 201, row has Open/pending/null category.
Priya with bookId BK003 -> 400 INVALID_BOOK. No bookId -> 201 with bookId null.
Rohit GET /tickets/<Priya's id> -> 404. Admin token POST /tickets -> 403. Subject "ab" -> 400 validation.
Commit: feat(tickets): author create/list/detail
