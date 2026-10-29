# T15 Documentation

Files: README.md (root), docs/API.md (verified), docs/WRITEUP.md (max 1 page), docs/postman/bookleaf.postman_collection.json (optional but good).

README sections, in this order:

1. What this is (3 sentences) + live demo URL + test credentials table (admin@bookleaf.com, 2 admins, 3-4 authors with a note on which
   author shows which edge case, all Password@123, labelled as demo-only).
2. Screenshots or a short feature list (author portal, admin portal).
3. Run locally: prerequisites, clone, env files (point to .env.example files), migrate, seed, seed:demo, run backend and frontend. Exact commands, tested from a clean clone.
4. Architecture: layer diagram (text or mermaid), folder map, ticket lifecycle, SSE design (stream tokens), data model summary, RBAC rules.
5. AI integration: model choice and justification (with the measured latency numbers from D12); prompt strategy (triage prompt, draft prompt, KB slicing, facts computed in code,
   untrusted-text delimiters, code-level guardrails); error handling and graceful degradation (the failure ladder: timeout, retry, fallback model, rule-based triage,
   template drafts, manual reply); cost management (one call per task, caching, sliced KB, token caps, rate limits, usage log) with the real numbers; classification accuracy table;
   2-3 example drafts with the facts they were grounded in; API key security.
6. API documentation: link to docs/API.md plus a summary table of endpoints with roles.
7. Testing and verification done (curl checklists, eval script, draft-check script).
8. Known limitations and what I would do next (see below).
9. AI-assisted development note: the repo includes AGENTS.md and docs/ so that multiple coding agents could work from the same context; state honestly that AI tools were used and that all code was reviewed.

docs/API.md: for EVERY route: method, path, role, request body/query (with limits), success response example, error codes. Generate from the real routes, controllers and zod
schemas (not from memory), and diff against the code. Include the error shape and an auth section (login, bearer token, SSE stream token flow).

Rules: only claim what the code actually does. Anything not implemented goes under limitations. No secrets, no real keys. Mark places that need my real numbers with
`TODO(me): paste ...` so nothing is invented.
Acceptance: a stranger can clone, follow the README and get both portals running locally; every endpoint in docs/API.md exists in the code.
Commit: docs: readme, api reference and write-up
