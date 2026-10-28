# T06 Author tickets
Endpoints: POST /tickets, GET /tickets, GET /tickets/:id.
Validation: subject 3-150 chars, description 10-5000 chars, bookId optional but must belong to the author. Status starts Open, ai_status pending.
Response of GET /tickets/:id includes messages, never internal notes. Hook point: after insert call `triageQueue.enqueue(ticketId)`, a no-op stub for now (implemented in T10).
Acceptance: Priya creates a ticket for BK001 -> 201; Rohit cannot read it (404); using bookId of another author -> 400/403.
Commit: `feat(tickets): author create/list/detail`.
