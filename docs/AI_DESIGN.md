# AI design (25% of grade: keep this sharp)

## Provider abstraction
`LLMProvider { generateJSON<T>(req, schema): Promise<{data:T, usage}>; generateText(req): Promise<{text, usage}> }`
Implementations: `GeminiProvider` (@google/genai, model from `GEMINI_MODEL`), `MockProvider` (deterministic, for dev/tests/demo safety).
Selected via `AI_PROVIDER` env. Model choice justification (for README): free tier, fast, JSON-mode with response schema, good at short classification + drafting.

## Triage call (classification + priority, ONE call)
- System prompt: 6 exact assignment categories (`Royalty & Payments`, `ISBN & Metadata Issues`, `Printing & Quality`, `Distribution & Availability`, `Book Status & Production Updates`, `General Inquiry`) with one-line definitions; priority rubric (`Critical`, `High`, `Medium`, `Low`); output JSON `{category, priority, reason}`.
- Input: subject + description + book status (1 line). NO KB, NO history. ~300 tokens.
- Use Gemini JSON mode + response schema; validate with zod; invalid -> fallback.
- Priority rubric: Critical = money overdue >3 months / data corruption affecting sales (wrong ISBN live) / legal; High = ISBN errors, printing defects, book unavailable, royalty dispute;
  Medium = status/timeline questions, minor royalty questions; Low = general info, bio/description updates.
- Rule hint: ISBN errors are never below High (KB policy).

## Draft call
Prompt parts (in order):
1. System: persona + tone rules from KB (`[Tone & Style Guidelines]`).
2. Sliced KB context for ticket's category only (`[Tone]` + category section + one golden example).
3. Author's book facts as compact JSON (`title`, `status`, `inProduction`, `productionStage`, `mrp`, `copiesSold`, `royaltyEarned`, `royaltyPaid`, `royaltyPending`, `lastPayoutDate`, `neverPaid`, `pendingBelowThreshold`, `rollsOver`, `platforms`, `printPartner`, `daysSinceReference`, `likelyOverdue`, `nextPayoutDeadline`). "General / account level" for tickets without a book.
4. Ticket subject/description + last 3 messages max in `<ticket>...</ticket>` delimiters.
5. Strict instructions:
   - Ground strictly in computed facts; use exact numbers; do not invent dates or policy.
   - When `likelyOverdue`: own delay directly, state real elapsed time in months from `daysSinceReference`, commit to 48-hour escalation, do not quote a normal payout date.
   - When `rollsOver`: state that balance carries into next quarterly calculation and is paid once reaching Rs 1,000; state NO payout date (`nextPayoutDeadline` is null).
   - When `inProduction`: state current stage and exact KB stage order; commit only to 48h follow-up; never discuss royalties.
   - Forbid invented internal activity or progress (no "finalizing layout", no non-KB teams like "finance team"; refer only to "our team" or KB-listed teams).
   - Under 180 words, plain text email, sign off as "BookLeaf Support Team". Output cap `maxOutputTokens: 600`.

## Graceful degradation
timeout (AI_TIMEOUT_MS) -> 1 retry with backoff on 5xx/429 -> fallback. Fallback triage = keyword rules (`ai/fallbackClassifier.ts`).
Fallback draft = per-category template filled with real book data (`ai/fallbackDraft.ts`). UI shows "AI unavailable" badge + retry button. Admin can always type manually.
In-process rate limiter (AI_RPM_LIMIT) + queue so bursts don't trigger 429s.

## Cost awareness (document in README)
One call per triage, one per draft (cached in ai_drafts); KB sliced per category; short history; capped output; usage logged in ai_usage_log (tokens, latency, success).

## Security
Key only from env on server; `.env` gitignored; no AI endpoint reachable by authors; never log full prompts containing PII in production.
Note: Gemini free tier may use data for product improvement. Use only the synthetic sample data.
