# T14 Deploy prep + demo data

Agent work (code):

1. Fix the backend build (tsconfig.build.json, build script) and confirm `npm run build && npm start` works locally against .env.
2. frontend/vercel.json: SPA rewrite of all paths to /index.html (react-router deep links like /tickets/123 must not 404).
3. scripts/seed-demo.ts (npm run seed:demo): idempotent demo tickets inserted directly in SQL with fixed UUIDs (ON CONFLICT DO NOTHING),
   timestamps relative to now(). Does not call the AI. Sets category/priority/\*\_source/ai_status directly. Tickets:
   a. Ananya BK005 royalty, never paid, created 12 days ago, Open, High, ai/done (overdue per SLA)
   b. Priya BK001 ISBN mismatch, created 3 hours ago, Open, High, ai/done
   c. Kavita BK016 royalty below threshold, 2 days ago, In Progress, Medium, with one admin reply
   d. Kavita BK015 production update, 5 days ago, Open, Medium, ai_status 'failed' with source 'fallback' (shows the degraded state)
   e. Priya General description update, 1 day ago, Resolved, Low, with a reply
   f. Rohit BK003 printing defect, 6 hours ago, Open, High, ai/done
   g. Sneha BK011 low royalty question, 4 days ago, Closed, Medium, with a reply
   No pre-generated drafts: the first open generates one live. Also seed one internal note on ticket (a).
4. scripts/reset-demo.ts (npm run reset:demo): deletes tickets, messages, notes, drafts and usage logs, then runs seed:demo. Guard:
   refuse to run unless the env var CONFIRM_RESET=yes is set. Never touches authors, books or users.
5. docs/DEPLOY.md: env var table, Render and Vercel settings, post-deploy smoke test, cold-start note.
   Acceptance: `npm run seed:demo` twice gives 7 tickets, not 14; the admin queue shows (a) as Overdue; reset:demo without CONFIRM_RESET exits with an error.
   Commit: feat: deploy prep, demo seed and reset scripts
