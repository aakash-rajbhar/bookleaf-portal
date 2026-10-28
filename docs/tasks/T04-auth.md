# T04 Auth + RBAC

Files: routes/auth.ts, controllers/authController.ts, services/authService.ts,
middleware/authenticate.ts, middleware/requireRole.ts, middleware/validate.ts,
types/express.d.ts, routes/index.ts (wire it).

Behaviour:

- POST /auth/login {email,password} -> 200 {token, user:{id,email,name,role,authorId}}
- GET /auth/me -> current user (re-read from DB, so deleted users stop working)
- Passwords: bcryptjs compare. If email not found, still run a compare against a dummy hash
  (avoid timing leak). Same error for both cases: 401 "Invalid email or password".
- Normalise email: trim + lowercase before lookup.
- JWT: sign with env.JWT_SECRET, algorithm HS256, expiresIn env.JWT_EXPIRES_IN,
  payload {sub: userId, role, authorId}. Verify with algorithms:['HS256'] pinned.
- authenticate: reads "Authorization: Bearer <token>"; missing/invalid/expired -> 401 (AppError.unauthorized).
  Sets req.user = {id, role, authorId}. Do NOT accept tokens from query string yet (T07 handles SSE separately).
- requireRole(...roles): 403 if req.user.role not in roles.
- validate({body?, query?, params?}): zod parse, replace with parsed values, ZodError goes to errorHandler.
- Wiring in routes/index.ts: /health and /auth/login public; then apiRouter.use(authenticate) so
  everything registered after it is protected by default.
- Never return password_hash in any response or log it.
  Acceptance: see curl checklist. Commit: feat(auth): login, jwt, role guard
