# T04 Auth + RBAC
Files: `routes/auth.ts`, `controllers/authController.ts`, `services/authService.ts`, `middleware/authenticate.ts`, `middleware/requireRole.ts`, `middleware/validate.ts`.
Rules: bcryptjs compare; JWT payload {sub, role, authorId}; generic "Invalid email or password" for both unknown email and wrong password; zod validation on login body; `req.user` typed via `src/types/express.d.ts`.
Apply `authenticate` globally after /health and /auth/login.
Acceptance: login ok -> token; /auth/me works with token, 401 without; author token on an admin route -> 403.
Commit: `feat(auth): login, jwt, role guard`.
