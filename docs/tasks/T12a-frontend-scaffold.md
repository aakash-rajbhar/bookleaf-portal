# T12a Frontend scaffold + auth

Goal: logged-in author lands on an app shell; routing and API plumbing are solid for every later page.
Files: frontend/ (Vite react-ts + Tailwind), src/api/client.ts, src/api/types.ts, src/auth/AuthContext.tsx,
src/auth/ProtectedRoute.tsx, src/components/{Layout,Spinner,ErrorBanner,EmptyState}.tsx, src/pages/Login.tsx,
src/App.tsx, vite.config.ts (dev proxy), frontend/.env.example, AGENTS.md (frontend rules section).

Rules:

- React Router. Routes: /login, /books, /tickets, /tickets/new, /tickets/:id (author); /admin/\* reserved for T13.
- api/client.ts: one fetch wrapper. Base URL from import.meta.env.VITE_API_BASE_URL, default '/api/v1'.
  Vite dev proxy forwards /api to http://localhost:4000. Adds Authorization header, parses the backend error shape
  {error:{code,message,details}} into an ApiError class. On 401 clear the session and redirect to /login.
- Token in localStorage (document the XSS trade-off in DECISIONS.md). AuthContext exposes user, login, logout, isLoading;
  restores the session on load by calling GET /auth/me.
- ProtectedRoute({role}): not logged in -> /login; wrong role -> redirect to that role's home. Login redirects by role
  (author -> /books, admin -> /admin).
- api/types.ts: TypeScript types matching the REAL backend responses. Read docs/API.md AND the controllers/mappers;
  if they differ, trust the code and fix the docs.
- Login page: email + password, inline error from ApiError, disabled button while loading. Show the seeded demo logins
  in a small collapsible hint ("Demo: priya.sharma@email.com / Password@123").
- Layout: header with app name, nav (My Books, Submit Query, My Tickets), user name, logout. Responsive, plain Tailwind.
- No API keys or secrets anywhere in frontend code. Do not add UI libraries beyond react-router.
  Acceptance: npm run dev works; login as Priya -> /books shell; wrong password shows the backend message; refresh keeps
  the session; visiting /books logged out redirects to /login; author visiting /admin is redirected away.
  Commit: feat(frontend): scaffold, auth, routing and api client
