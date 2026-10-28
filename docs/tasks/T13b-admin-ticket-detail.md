# T13b Admin ticket detail

Files: src/pages/admin/TicketDetail.tsx, src/components/admin/{DraftEditor,TicketControls,InternalNotes,AuthorBookPanel,AiTriagePanel}.tsx.

Before coding: read the admin controllers and mappers for GET /admin/tickets/:id, PATCH, POST draft, POST reply, POST notes and
POST triage. Trust the code over the docs.

Layout (two columns on desktop, stacked on mobile):
LEFT: header (subject, ticket id short, created time), status, the conversation thread (original query + messages; admin messages
labelled with the admin's name), then the Reply section.
RIGHT: controls and context.

Controls (TicketControls):

- Status select (Open, In Progress, Resolved, Closed) -> PATCH. Priority select and Category select -> PATCH, each with its source
  badge (AI / Rule-based / Admin) and the AI's one-line reason (aiReason). "Assign to me" button / "Unassign" -> PATCH assignedTo.
- Optimistic UI is optional; at minimum disable the control while saving and show an inline error on failure.
- Closed tickets: disable reply and show "This ticket is closed" (the API returns 409 for replies to closed tickets).
- AiTriagePanel: if aiStatus is 'pending' show "AI is classifying..."; if 'failed' show an amber banner "AI triage unavailable, rule-based
  fallback used" with a "Retry AI triage" button -> POST /admin/tickets/:id/triage (202), then refetch.

Context (AuthorBookPanel): author name, email, city; the book's facts (status, MRP, copies sold, royalty earned / paid / pending,
last payout date, platforms, print partner) with em dash for nulls. For in-production books show the stage and no royalty numbers.
Highlight "Pending royalty never paid" when paid = 0 and pending > 0. General tickets: "General / Account Level, no book".

DraftEditor (the AI core of the UI):

- When the page opens and latestDraft is null and the ticket is not Closed, call POST /admin/tickets/:id/draft ONCE and show
  "Drafting a reply..." in the editor area (guard against StrictMode double invocation with a ref). If latestDraft exists, load it.
  Drafts are generated on open, then cached by the backend, so opening the same ticket again costs nothing.
- The draft goes into an editable textarea with a source badge: "AI draft" (model name) or "Template draft (AI unavailable)" with the
  failure reason in a tooltip, plus "cached" when applicable. If generation fails, show the error and let the admin type manually:
  the reply box is ALWAYS usable.
- Buttons: "Regenerate" (POST draft with {regenerate:true}; if the admin has edited the text, confirm before replacing),
  "Reset to draft" (restore the generated text), "Send reply" (POST reply with {body, markResolved}), and a "Mark as resolved after sending" checkbox.
- NEVER overwrite text the admin has typed because of a live refetch. Draft state lives in the editor and is only replaced by explicit
  Regenerate / Reset actions or after a successful send.
- Send: trim, require non-empty (max 5000 chars with a counter), disable while sending, prevent double submit, on success clear the editor,
  append the message to the thread, show a success notice. A template draft or an unedited AI draft should show a small hint
  "Review before sending". Keep the text if sending fails.

InternalNotes: list of notes (admin name, time), add-note textarea -> POST notes. A clear "Internal, never visible to the author" label
and a distinct (yellow) style so it cannot be confused with the reply box.

Live: use useTicketStream; refetch the ticket in place on events for this ticketId (a new author message or status change by another
admin), without touching the draft editor state.
States: loading, 404 "Ticket not found" with a link back to the queue, error with retry.
Acceptance: opening Ananya's BK005 royalty ticket shows a grounded draft; editing then triggering a live event keeps my edits; send reply
-> author's window shows it live and status becomes In Progress; override priority -> badge shows Admin; internal note is invisible in the
author's view; with AI_MOCK_FAILURE=always the page shows a template draft and the manual reply still works; retry triage works.
Commit: feat(frontend): admin ticket detail with ai draft editor
