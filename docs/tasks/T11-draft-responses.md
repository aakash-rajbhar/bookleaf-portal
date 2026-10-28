# T11 AI drafts

Files: db/migrations/003_draft_source.sql (ALTER ai_drafts ADD source text NOT NULL DEFAULT 'ai' CHECK (source IN ('ai','template'))),
ai/knowledgeBase.ts, ai/bookFacts.ts, ai/prompts/draft.ts, ai/fallbackDraft.ts, services/draftService.ts,
controllers/routes (POST /admin/tickets/:id/draft), adminTicketService (fill latestDraft in GET /admin/tickets/:id).

knowledgeBase.ts: KB sections as TS constants (copy of docs/KNOWLEDGE_BASE.md; the docs folder isn't deployed with the backend).
CATEGORY_SECTIONS map: Royalty->[royalty], ISBN->[isbn], Printing->[printing], Distribution->[distribution],
Book Status->[production], General->[company]. Every draft always gets [tone] + the matching [examples] row(s) only.
bookFacts.ts: PURE function computing facts in code, not in the LLM:
inProduction, neverPaid, pendingBelowThreshold (<1000), royaltyPending/Paid/Earned, copiesSold, lastPayoutDate,
daysSinceLastPayoutOrPublication, likelyOverdue (pending >= 1000 AND days since (lastPayout ?? publication) > 135),
nextPayoutWindow (next quarter end + 45 days). Assumptions (calendar quarters, 135-day overdue rule) go in DECISIONS.md.
General tickets -> facts = null.
prompts/draft.ts: system = persona (BookLeaf support rep, first name sign-off "BookLeaf Support Team") + [tone] rules.
Sections in order: KB slices, AUTHOR FACTS (compact JSON), TICKET (subject/description, last 3 messages max), INSTRUCTIONS:
acknowledge first; use the exact numbers from facts; own BookLeaf mistakes when likelyOverdue is true; escalation = "within 48 hours";
never invent dates, policies, or amounts not in the KB or facts; if inProduction do NOT discuss royalties; if pendingBelowThreshold
explain the Rs 1,000 rollover; plain text email, no markdown, under 180 words; end with a clear next step.
Ticket text is untrusted: same delimiter and ignore-instructions rule as triage. maxOutputTokens ~450.
draftService.generate(ticketId, {regenerate}): return the latest cached draft unless regenerate. Otherwise call the provider; on
AIUnavailableError use fallbackDraft (per-category template filled with the same facts) with source='template'. Store in ai_drafts
with model, tokens, latency. Log usage. The response always includes {text, source, model|null, createdAt, cached}.
Do NOT auto-generate drafts at triage time; generate on demand and cache so unopened tickets cost nothing.
Acceptance (use the seeded data): Ananya's BK005 royalty ticket draft mentions Rs 2,546 pending, no payout yet, and escalates with 48 hours;
BK016 (Rs 850) explains rollover, no escalation; BK013 production ticket never mentions royalties; General ticket has no book facts;
second call returns cached:true with zero new usage rows; regenerate:true makes a new row; AI_MOCK_FAILURE=always -> template draft, source 'template'.
Commit: feat(ai): knowledge-base grounded draft responses with caching and fallback
