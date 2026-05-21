# Deployment Guide

Free-tier deployment to **Vercel (frontend) + Render (backend) + MongoDB
Atlas (database)**. Total cost: $0. Total time: ~25 minutes.

> Cloudinary is optional but recommended. If you use it, sign up before
> starting so you have the keys ready.

---

## Prerequisites

- A GitHub account (the code needs to be in a public or private repo)
- Accounts on [vercel.com](https://vercel.com), [render.com](https://render.com), and [cloud.mongodb.com](https://cloud.mongodb.com)
- (Optional) [cloudinary.com](https://cloudinary.com) — for shareable PDF links

---

## 1. Push to GitHub

```bash
cd /Users/<you>/Desktop/vsheild
git init
git add .
git commit -m "feat: initial BGV platform"
gh repo create vsheild --public --source=. --remote=origin --push
# or use the GitHub UI to create the repo and push manually
```

Make sure `.env` files are **not** committed — `.gitignore` already covers them.

---

## 2. MongoDB Atlas (database)

1. **Create a free M0 cluster** if you haven't already
2. **Database Access** — make sure your username + password are working
3. **Network Access** — add `0.0.0.0/0` to allow connections from anywhere (Render IPs change)
4. **Connect → Drivers** — copy the connection string
5. Replace `<password>` and append `/bgv` before the `?`:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/bgv?retryWrites=true&w=majority
   ```
   Save this — you'll paste it into Render in step 3.

---

## 3. Deploy backend to Render

1. Go to [render.com](https://render.com) → **New + → Web Service**
2. **Connect your GitHub repo** (`vsheild`)
3. Fill in:
   - **Name:** `bgv-backend`
   - **Region:** any (closer to your users is faster)
   - **Branch:** `main`
   - **Root directory:** `backend`
   - **Runtime:** Node
   - **Build command:** `npm install && npm run prisma:generate && npm run build`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. **Environment variables** — click "Advanced" → add these:
   ```
   DATABASE_URL          = (your MongoDB connection string from step 2)
   JWT_SECRET            = (any long random string, e.g. `openssl rand -hex 32`)
   JWT_EXPIRES_IN        = 7d
   NODE_ENV              = production
   PORT                  = 5000
   FRONTEND_URL          = (leave blank for now — we'll fill after Vercel deploy)
   AADHAAR_API_URL       = https://YOUR-RENDER-URL.onrender.com/mock-api/aadhaar/verify
   PAN_API_URL           = https://YOUR-RENDER-URL.onrender.com/mock-api/pan/verify
   CLOUDINARY_CLOUD_NAME = (optional)
   CLOUDINARY_API_KEY    = (optional)
   CLOUDINARY_API_SECRET = (optional)
   ```
   > Render will tell you the final URL like `https://bgv-backend-xxxx.onrender.com` after the first deploy. Come back and update `AADHAAR_API_URL` / `PAN_API_URL` to use that real URL.
5. Click **Create Web Service**. First deploy takes 5–7 min.
6. Once deployed, copy the Render URL. Test it:
   ```
   curl https://bgv-backend-xxxx.onrender.com/api/health
   ```
   Should return `{"success":true,"status":"ok"}`.

> **Render free tier sleeps after 15 min of inactivity.** The first request after sleep takes ~30 sec to wake up. Fine for demos; upgrade to a paid plan ($7/mo) if you need always-on.

---

## 4. Push the Prisma schema to Mongo (one-time)

Render's build command already runs `prisma generate`, but **`prisma db
push`** has to be done once against your production database. Easiest way:

From your local machine, point the local `.env` at the production DB
temporarily and run push:

```bash
cd backend
# Edit .env: set DATABASE_URL to your Mongo Atlas connection string (with /bgv)
npm run prisma:push
```

You should see `Your database indexes are now in sync with your Prisma schema.`

Restore your local `.env` to its dev value afterwards.

---

## 5. Deploy frontend to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import your `vsheild` GitHub repo**
3. **Configure project:**
   - **Framework:** Next.js (auto-detected)
   - **Root directory:** `frontend`
   - **Build/Output:** leave defaults
4. **Environment variables:**
   ```
   NEXT_PUBLIC_API_URL = https://bgv-backend-xxxx.onrender.com/api
   ```
   (the URL of your Render backend + `/api`)
5. Click **Deploy**. First build takes ~2 min.
6. Vercel gives you a URL like `https://vsheild-xxxx.vercel.app`.

---

## 6. Wire the CORS allow-list

1. Go back to **Render → bgv-backend → Environment**
2. Update `FRONTEND_URL` to your Vercel URL (e.g. `https://vsheild-xxxx.vercel.app`) — no trailing slash
3. Render will redeploy automatically

---

## 7. Test the live app

1. Open your Vercel URL → register an account
2. Add a candidate → run verification → download report
3. If you set up Cloudinary, refresh the candidate detail page → the shareable link should appear

---

## Troubleshooting

**"Network Error" in browser console**
- CORS issue. Check `FRONTEND_URL` in Render matches your Vercel domain exactly (no trailing slash, with `https://`).

**Backend 500 on every request**
- Check Render → Logs. Most likely `DATABASE_URL` is wrong or Mongo Atlas isn't allowing connections (add `0.0.0.0/0` to network access).

**Login works but every other call returns 401**
- Frontend isn't sending the token. Open browser devtools → Application → Local Storage → confirm `bgv_token` is present.

**Reports not uploading to Cloudinary**
- Check Render logs on a download. If you see `[Cloudinary] Disabled`, the env vars aren't set. If you see `[Cloudinary upload failed]`, the keys are wrong or you forgot to enable PDF delivery in Cloudinary Security settings.

**Cold start delay**
- Render free tier sleeps after 15 min. First request takes ~30 sec. Hitting `/api/health` every 10 minutes via a free uptime monitor (UptimeRobot, BetterStack) keeps it warm.

---

## Custom domain (optional)

Both Vercel and Render support free custom domains:
- Vercel: project settings → Domains → add your domain → follow DNS instructions
- Render: service settings → Custom Domains → add and verify

Make sure to update `FRONTEND_URL` (Render env var) and
`NEXT_PUBLIC_API_URL` (Vercel env var) to the new domains after adding them.

---

## Production hardening checklist

The current setup is fine for a take-home demo. Before any real
production traffic, consider:

- [ ] Rotate `JWT_SECRET` to a cryptographically strong value (`openssl rand -hex 64`)
- [ ] Switch from MongoDB Atlas free tier to M10+ (free tier has connection limits, no SLA, shared resources)
- [ ] Add structured logging (pino, winston) + a log aggregator (Logtail, Datadog)
- [ ] Add error tracking (Sentry)
- [ ] Add monitoring + alerts (UptimeRobot, BetterStack)
- [ ] Set up CI/CD with GitHub Actions (tests on PR, deploy on merge)
- [ ] Replace mock provider URLs with a real licensed Aadhaar/PAN provider (Karza, Surepass, IDfy)
- [ ] Add proper account-recovery flow (forgot password / email verification)
- [ ] Add role-based access control if multi-team
- [ ] Add request ID + correlation IDs to all logs
- [ ] Audit logging for sensitive admin actions
