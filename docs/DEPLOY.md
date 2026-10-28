# Deployment Guide — BookLeaf Author Support Portal

This guide provides step-by-step instructions for deploying the BookLeaf Author Support Portal across Neon (PostgreSQL), Render (Express backend API), and Vercel (React + Vite frontend SPA).

---

## Architecture Topology

```
                  ┌──────────────────────┐
                  │  Vercel (Frontend)   │
                  │  React + Vite (SPA)  │
                  └──────────┬───────────┘
                             │ HTTPS / SSE
                             ▼
                  ┌──────────────────────┐
                  │   Render (Backend)   │
                  │   Node 20+ Express   │
                  └──────────┬───────────┘
                             │ TLS
                             ▼
                  ┌──────────────────────┐
                  │  Neon (Database)     │
                  │  Serverless Postgres │
                  └──────────────────────┘
```

---

## 1. Environment Variables Reference

### Backend (`backend/`)
> [!IMPORTANT]
> The Gemini API key and JWT secret must **ONLY** be set on the backend server. Never expose backend secrets to the frontend.

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | Yes | Listening HTTP port (Render supplies automatically) | `4000` |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection URI with SSL | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Yes | Cryptographic secret for signing author/admin tokens | `your-secure-random-32+-char-secret` |
| `JWT_EXPIRES_IN` | No | Token lifetime string | `8h` |
| `CORS_ORIGIN` | Yes | Frontend origin allowed for CORS and SSE | `https://bookleaf-portal.vercel.app` |
| `AI_PROVIDER` | Yes | AI engine (`gemini` for live model, `mock` for testing) | `gemini` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key (required if `AI_PROVIDER=gemini`) | `AIzaSy...` |
| `GEMINI_MODEL` | No | Target model name | `gemini-2.5-flash` or `gemini-3.5-flash-lite` |
| `AI_RPM_LIMIT` | No | Self-imposed rate limit cap (reqs/min) | `5` |
| `AI_TIMEOUT_MS` | No | Timeout for Gemini requests in ms | `20000` |
| `AI_DAILY_LIMIT` | No | Daily request limit budget | `200` |

### Frontend (`frontend/`)
> [!NOTE]
> Vite only bundles variables prefixed with `VITE_`. No secrets should ever be placed here.

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | Public HTTPS URL of the deployed backend API (without trailing slash) | `https://bookleaf-api.onrender.com` |

---

## 2. Database Setup (Neon PostgreSQL)

1. Create a serverless PostgreSQL database on [Neon](https://neon.tech).
2. Copy the pooled connection string (with `sslmode=require`).
3. Run migrations and initial data seed from your local environment or deployment console:
   ```bash
   cd backend
   # Ensure DATABASE_URL is set in backend/.env
   npm run migrate
   npm run seed
   npm run seed:demo
   ```

---

## 3. Backend Deployment (Render)

1. Connect your repository to [Render](https://render.com) and create a **Web Service**.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Node Version**: `>=20.0.0`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   - `JWT_SECRET`: *(A strong random string)*
   - `CORS_ORIGIN`: `https://your-frontend-project.vercel.app`
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: *(Your Google AI Studio API key)*
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite` (or `gemini-2.5-flash`)
   - `AI_RPM_LIMIT`: `5`
   - `AI_TIMEOUT_MS`: `20000`
4. Deploy the service and note the assigned URL (e.g., `https://bookleaf-api.onrender.com`).

---

## 4. Frontend Deployment (Vercel)

1. Import your repository into [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend.onrender.com` (your Render backend URL from Step 3)
4. Verify SPA routing:
   `frontend/vercel.json` contains the SPA rewrite:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   This ensures deep client-side routes (like `/tickets/:id` or `/admin/tickets/:id`) do not return 404 on page reload.
5. Deploy the project. Note the Vercel domain and verify it matches the backend's `CORS_ORIGIN`.

---

## 5. Post-Deploy Smoke Test

Execute this verification sequence after deployment:

1. **Health Check**:
   ```bash
   curl -s https://your-backend.onrender.com/api/v1/health
   # Expected response: {"status":"ok","db":"ok","time":"..."}
   ```
2. **Author Login**:
   - Navigate to `https://your-frontend.vercel.app/login`
   - Email: `ananya.reddy@email.com` / Password: `Password@123`
   - Check the **Books** dashboard: verifies author-scoped book details, sales, and royalties in INR (`₹`).
   - Open ticket `/tickets/d0000000-0000-4000-a000-000000000001` to view the thread.
3. **Admin Queue & AI Triage**:
   - Log in with `admin@bookleaf.com` / `Password@123`
   - Check the `/admin` queue:
     - Verify 7 demo tickets appear with proper urgency sorting.
     - Verify ticket A (`Royalty payment not received for Between Two Temples`) is highlighted with an **Overdue** SLA breach badge.
     - Open ticket A: verify the AI generated reply draft loads with grounded facts (₹2,546 pending royalty).
4. **Real-time Live Stream (SSE)**:
   - Check the stream status pill in the top header: should indicate **Live** (green indicator).
5. **Demo Reset**:
   - If demo tickets are modified during testing, reset them to the clean state:
     ```bash
     CONFIRM_RESET=yes npm run reset:demo
     ```

---

## 6. Cold-Start Note (Render Free Tier)

> [!NOTE]
> On Render's free tier, backend instances automatically spin down after 15 minutes of inactivity. When a request arrives, a cold start may take **30 to 50 seconds** to initialize. 
> 
> The frontend handles this gracefully:
> - Initial requests show explicit loading spinners.
> - The SSE stream (`useTicketStream`) attempts reconnection with exponential backoff and transparent fallback polling every 30 seconds.
> - Once the backend responds, the live stream status indicator changes automatically from `Reconnecting` to `Live`.
