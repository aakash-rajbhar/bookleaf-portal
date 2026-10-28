# Decisions log (append: date, decision, why)
- D1: Express 5 + TypeScript. Async handler errors propagate automatically; simple, widely known.
- D2: `pg` + plain SQL migrations (no ORM). Schema design is graded; explicit SQL is easy to explain and agent-friendly.
- D3: SSE over WebSockets. One-way server->client is all we need; works over plain HTTP; auto-reconnect built in.
- D4: SSE auth via `?token=` query param because EventSource can't set headers (acceptable trade-off; short-lived JWT in production would be better).
- D5: Gemini free tier behind LLMProvider interface + MockProvider so quota never blocks dev or the live demo.
- D6: AI triage runs async after ticket insert, so ticket creation never depends on the AI.
- D7: Plain SQL migrations executed within transactions and tracked via `schema_migrations` table for atomic, idempotent execution without heavy third-party migration tools.
