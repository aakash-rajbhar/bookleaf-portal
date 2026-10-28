# T01 Backend bootstrap
Goal: skeleton runs locally and `/api/v1/health` responds.
Files: `backend/src/config/env.ts`, `src/app.ts`, `src/server.ts`, `src/routes/health.ts`, `src/middleware/errorHandler.ts`, `src/utils/errors.ts`.
Steps: `cd backend && cp .env.example .env && npm install && npm run typecheck && npm run dev`.
Acceptance: `curl localhost:4000/api/v1/health` -> `{"status":"ok",...}`; unknown route -> 404 JSON error shape; server refuses to start if JWT_SECRET/DATABASE_URL missing.
Verify: curl both URLs. Commit: `chore: backend bootstrap`.
