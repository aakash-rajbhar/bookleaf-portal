# Assignment: Author Support & Communication Portal (transcribed from BookLeaf PDF)
CONFIDENTIAL. Keep repo private. Duration: 5 days. Not looking for pixel-perfect UI: evaluating architecture,
code quality, AI integration, product thinking. AI tools allowed, but every line must be explainable.

## Context
Self-publishing company, 1,200+ books/month, 22,000+ titles, authors in India and US. Author queries (royalties,
book status, ISBN, printing quality) are handled manually -> delays, inconsistency, backlog.

## A. Author Portal
- Auth: email/password. Each author sees only their own data.
- My Books: title, ISBN, genre, publication date, status, MRP, total copies sold, total royalty earned, royalty paid, royalty pending.
- Submit Support Query: dropdown (which book, or "General / Account Level"), subject, detailed description, optional attachment (UI only; real upload is bonus).
- My Tickets: all submitted tickets with status (Open, In Progress, Resolved, Closed), original query, admin responses. Must update real-time / near-real-time without page refresh.

## B. Admin Portal
- Ticket Queue: all tickets, filterable by status, category, priority, date. Most urgent and oldest unresolved easy to spot.
- AI Auto-Classification into: Royalty & Payments | ISBN & Metadata Issues | Printing & Quality | Distribution & Availability | Book Status & Production Updates | General Inquiry. Admin can override.
- AI Priority score: Critical / High / Medium / Low (e.g. "no royalty for 6 months" > "update my author bio"). Admin can override.
- AI-Drafted Response when admin opens ticket, based on query + Knowledge Base. Admin edits before sending. Sent response appears in author's ticket view.
- Ticket management: update status, internal notes (NOT visible to author), assign to self.

## C. API Layer
Clean REST; consistent naming; auth middleware on all routes; RBAC (authors own data only, admins everything);
input validation + meaningful errors (no generic 500s); API docs (Swagger/OpenAPI, Postman, or README section).

## D. AI Integration (critical)
1. Prompt engineering: structured prompts, use KB, sound like a real BookLeaf support rep, not generic AI fluff.
2. API key security: env vars only; never hardcoded or exposed to frontend (they will check).
3. Error handling: AI down / rate-limited -> degrade gracefully; tickets still created; admins can reply manually.
4. Cost awareness: don't send entire history + KB on every call; show evidence of token thinking.
5. Model choice: any LLM; justify briefly in docs.

## Dataset
`data/bookleaf_sample_data.json`: 10 authors, 18 books. System must work with this data out of the box (they test with these exact records). Edge cases are intentional: published+earning, pending payouts, zero payouts, two books still in production.

## Tech guidelines
Any modern frontend/backend/DB. Real-time via WebSockets/SSE/polling. Deploy to a live URL (Vercel/Railway/Render/VPS).

## Submission
1. Private repo (clean commit history is a plus). 2. Live demo URL pre-seeded, test credentials in README.
3. README: local setup, architecture decisions, AI integration (prompt strategy, error handling, cost mgmt), API docs, known limitations.
4. One-page write-up: priorities, trade-offs, path to production.

## Scoring
AI Integration 25 | Architecture & Code Quality 25 | API Design 15 | Functionality 15 | Product Thinking 10 | Docs 10.
Priority advice from the assignment: if short on time, prioritise core ticket flow + AI integration over nice-to-haves.
Follow-up: 45-60 min technical discussion walking through code and AI approach.
