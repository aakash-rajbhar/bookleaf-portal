# Architecture & Product Write-Up: BookLeaf Support Portal

**Author**: Antigravity (AI Pair Programmer) & Aakash Rajbhar  
**Project**: BookLeaf Author Support & Communication Portal (Take-Home Assignment)  

---

## 1. Core Priorities

In building the portal, our primary architectural objective was **trust and reliability over superficial complexity**. For a self-publishing platform managing 22,000+ titles, author trust hinges on prompt, consistent, and strictly grounded communication:

1. **Zero-Hallucination AI Grounding**: Rather than exposing raw LLM completions to authors or asking the model to infer accounting rules, we decoupled computation from language generation. Financial facts (whether royalties are overdue beyond 135 days, whether balances fall below the ₹1,000 threshold, or whether a book is still in production) are deterministically computed in pure TypeScript (`computeBookFacts`). Prompts receive only compact, computed facts and tightly sliced Knowledge Base sections matching the ticket's category.
2. **Resilience & Non-Blocking Degradation**: Ticket creation must never fail due to AI outages, rate limits, or network latency. Triage runs asynchronously in a background queue after the HTTP response is sent. If Google Gemini is rate-limited or unavailable, the system transparently degrades to an in-process rule-based keyword classifier (`fallbackClassifier`) and deterministic template drafts (`fallbackDraft`). Admin staff can always reply manually.
3. **Data Boundary Enforcement**: Staff-only intelligence (internal notes, category classifications, priority scores, and AI reasoning) is strictly filtered out of author API responses and database queries. Ownership checks return `404 Not Found` rather than `403 Forbidden` to prevent ID enumeration.
4. **Real-Time Responsiveness**: Authors and support agents receive live ticket status, triage updates, and conversation replies via Server-Sent Events (SSE) with automatic token refresh, preventing stale state and page reloads.

---

## 2. Key Architectural Trade-Offs

| Decision | Chosen Approach | Rationale | Trade-Off / Alternative Considered |
| :--- | :--- | :--- | :--- |
| **Realtime Engine** | Server-Sent Events (SSE) | Unidirectional server-to-client push is simpler, runs over standard HTTP, and traverses corporate firewalls effortlessly. | WebSockets provide bidirectional communication, but client-to-server messaging is already cleanly handled via standard REST POST endpoints. |
| **Asynchronous Triage** | In-Memory Single-Concurrency Queue | Prevents thundering herds on free-tier LLM rate limits with zero infrastructure overhead; features boot-time recovery for stranded tickets. | Limits horizontal scaling to a single server instance. A distributed multi-node architecture would require Redis + BullMQ. |
| **Database & Schema** | PostgreSQL (`pg`) + Plain SQL Migrations | Full control over DDL, foreign keys, and CHECK constraints without ORM abstraction leakage; easy to review, audit, and explain. | Lacks ORM convenience (e.g., Prisma/Drizzle auto-generated query builders), requiring explicit SQL queries and parameterized sanitization. |
| **Authentication Storage** | `localStorage` Bearer Token | Simplifies decoupled deployments (Vercel SPA + Render API) and local Vite dev proxying without complex cross-domain cookie policies. | Vulnerable to XSS if malicious scripts execute. Mitigated by zero third-party dependencies, strict React JSX escaping, and Zod input validation. Production would use `httpOnly` cookies with refresh token rotation. |
| **File Attachments** | UI-Only Mock Attachment | Satisfied assignment core priority (focus on ticket flow and AI grounding within 5 days). | Production requires S3/Cloudflare R2 presigned URLs, MIME-type verification, and antivirus scanning. |
| **Business Heuristics** | Deterministic Assumptions (D11, D17) | Calibrated SLA hours (24h/48h/96h/168h) and 135-day overdue thresholds (90-day quarter + 45-day window) into code. | Real publishing platforms integrate directly with banking ERPs and retail sync webhooks. |

---

## 3. Path to Production (Scaling to 22,000+ Titles)

To scale the BookLeaf portal from this MVP to enterprise production handling thousands of concurrent authors:

1. **Distributed Queue & Worker Cluster**: Replace the in-memory queue with **BullMQ on Redis**. Separate HTTP API servers from background AI worker processes, allowing independent auto-scaling during peak ticket submission spikes.
2. **Distributed Real-Time Pub/Sub**: Replace the in-memory SSE hub with **Redis Pub/Sub** or managed WebSocket infrastructure (e.g., AWS API Gateway WebSocket or Ably), enabling multi-instance API deployments behind a load balancer.
3. **Vector Database / Hybrid Knowledge Retrieval**: Transition the in-code Knowledge Base slices to **PostgreSQL `pgvector`** with hybrid keyword + semantic search. This allows support managers to update policy articles dynamically through a CMS without code redeployments.
4. **Direct Cloud Storage**: Implement direct-to-S3/R2 presigned upload URLs for file attachments with server-side virus scanning and image thumbnail generation.
5. **Hardened Authentication**: Transition auth tokens to **`httpOnly`, `Secure`, `SameSite=Lax` cookies** with sliding refresh tokens, rate-limited login endpoints with Redis-backed IP blocking, and mandatory MFA for administrative personnel.
6. **Retailer Ingestion Webhooks**: Hook real-time catalog feeds from Amazon SP-API and Flipkart Marketplace APIs to auto-detect and resolve listing discrepancies before authors even submit tickets.
