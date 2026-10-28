# Decisions log (append: date, decision, why)

- D1: Express 5 + TypeScript. Async handler errors propagate automatically; simple, widely known.
- D2: `pg` + plain SQL migrations (no ORM). Schema design is graded; explicit SQL is easy to explain and agent-friendly.
- D3: SSE over WebSockets. One-way server->client is all we need; works over plain HTTP; auto-reconnect built in.
- D4: SSE auth via short-lived stream tokens: browsers' EventSource cannot send Authorization headers. Instead of exposing long-lived login tokens in URLs, clients exchange their Bearer token at POST /events/token for a 60-second single-purpose JWT ({purpose: 'sse'}). GET /events verifies purpose === 'sse' and rejects regular login tokens, while normal authenticate rejects stream tokens.
- D5: Gemini free tier behind LLMProvider interface + MockProvider so quota never blocks dev or the live demo.
- D6: AI triage runs async after ticket insert, so ticket creation never depends on the AI.
- D7: Plain SQL migrations executed within transactions and tracked via `schema_migrations` table for atomic, idempotent execution without heavy third-party migration tools.
- D8: Pinned JWT algorithm to HS256 on sign and verify, with dummy bcrypt comparison for unknown emails to prevent username enumeration timing attacks.
- D9: Book endpoints return 404 instead of 403 when an author requests a book owned by another author to prevent resource existence enumeration.
- D10: Author-facing ticket responses strictly omit internal and AI triage metadata (category, priority, AI fields, internal notes) and return 404 for tickets belonging to other authors.
- D11: SLA thresholds defined by priority (Critical: 24h, High: 48h, Medium: 96h, Low: 168h; null priority defaults to Medium). A ticket is flagged as isOverdue when unresolved ('Open' or 'In Progress') and its age exceeds its SLA limit.
- D12: Model = gemini-3.5-flash-lite (free tier). Measured with a one-word ping: 2.6s and 3.5s, 0 thinking tokens.
  gemini-3.5-flash rejected: 15-27s latency and thinking tokens consumed the output budget, returning empty text.
  gemini-3.1-flash-lite kept as an alternative (one 19.9s outlier in two runs). Triage and short drafts do not need
  deep reasoning, so a lite model is the right cost/latency trade-off. Free tier may use prompts to improve Google's
  models, so only the synthetic sample data is ever sent.
- D13: Rate limiter fails fast with sliding-window per-minute (AI_RPM_LIMIT) and per-day (AI_DAILY_LIMIT) caps. If a slot frees within 10s, it waits; otherwise throws AIUnavailableError('rate_limited') immediately rather than maintaining an unbounded queue, triggering graceful fallback and preserving responsiveness.
- D14: Total deadline (AI_TOTAL_TIMEOUT_MS, default 30s) bounds logical AI requests across retries and fallback models. Per-attempt timeout is min(AI_TIMEOUT_MS, remaining), and retries/fallbacks are aborted if <5000ms remains. Rate limiting is enforced per upstream attempt inside invokeModel (counting waiting time against the deadline), no retries are performed on timeout (failing fast to fallback), finishReason other than STOP is rejected as invalid_output, and cooldown periods prevent hammering during 429s.
