# AI design (25% of grade: keep this sharp)

## Provider abstraction
`LLMProvider { generateJSON<T>(req, schema): Promise<{data:T, usage}>; generateText(req): Promise<{text, usage}> }`
Implementations: `GeminiProvider` (@google/genai, model from `GEMINI_MODEL`), `MockProvider` (deterministic, for dev/tests/demo safety).
Selected via `AI_PROVIDER` env. Model choice justification (for README): free tier, fast, JSON-mode with response schema, good at short classification + drafting.

## Triage call (classification + priority, ONE call)
- System prompt: 6 categories with one-line definitions; priority rubric; output JSON `{category, priority, reason}`.
- Input: subject + description + book status (1 line). NO KB, NO history. ~300 tokens.
- Use Gemini JSON mode + response schema; validate with zod; invalid -> fallback.
- Priority rubric: Critical = money overdue >3 months / data corruption affecting sales (wrong ISBN live) / legal; High = ISBN errors, printing defects, book unavailable, royalty dispute;
  Medium = status/timeline questions, minor royalty questions; Low = general info, bio/description updates.
- Rule hint: ISBN errors are never below High (KB policy).

## Draft call
Prompt parts (in order): (1) system: persona + tone rules from KB [tone]; (2) KB slices for the ticket's category only
(`royalty`->[royalty]+[examples row], `isbn`, `printing`, `distribution`, `production`, general->[company]); (3) author's book facts as compact JSON
(status, mrp, copies_sold, earned, paid, pending, last_payout_date, platforms, print_partner; "none" for General tickets);
(4) ticket subject/description + last 3 messages max. (5) Instructions: use real numbers; do not invent dates/policy; if data missing say what we will check; end with next step + timeline.
Computed helpers injected as facts (not left to the LLM): pending below Rs 1,000 threshold? never paid? in-production? next payout window.
Output: plain text email-style reply signed "BookLeaf Support Team". Cap `maxOutputTokens` ~400.

## Graceful degradation
timeout (AI_TIMEOUT_MS) -> 1 retry with backoff on 5xx/429 -> fallback. Fallback triage = keyword rules (`ai/fallbackClassifier.ts`).
Fallback draft = per-category template filled with real book data (`ai/fallbackDraft.ts`). UI shows "AI unavailable" badge + retry button. Admin can always type manually.
In-process rate limiter (AI_RPM_LIMIT) + queue so bursts don't trigger 429s.

## Cost awareness (document in README)
One call per triage, one per draft (cached in ai_drafts); KB sliced per category; short history; capped output; usage logged in ai_usage_log (tokens, latency, success).

## Security
Key only from env on server; `.env` gitignored; no AI endpoint reachable by authors; never log full prompts containing PII in production.
Note: Gemini free tier may use data for product improvement. Use only the synthetic sample data.
