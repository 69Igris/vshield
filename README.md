# BGV — Background Verification Platform

A full-stack platform for submitting candidate details, running Aadhaar &
PAN identity verification, and generating professional PDF verification
reports.

> Built as a take-home assignment. Production-grade architecture (service
> layer, Zod validation, JWT auth, masked identity numbers, audit logs,
> rate limiting) with a deliberately simple feature scope.

## Live demo

- **Frontend:** https://vshield-mauve.vercel.app
- **Backend:**  https://vshield-1xtl.onrender.com  (health check: `/api/health`)

> The Render backend is on the free tier and sleeps after 15 min of inactivity. First request after sleep takes ~30 sec to wake up.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project structure](#project-structure)
5. [Setup instructions](#setup-instructions)
6. [Environment variables](#environment-variables)
7. [API endpoints](#api-endpoints)
8. [Bulk CSV upload format](#bulk-csv-upload-format)
9. [Validation rules](#validation-rules)
10. [Database schema](#database-schema)
11. [Security](#security)
12. [Deployment](#deployment)
13. [Testing](#testing)
14. [Scripts](#scripts)

---

## Features

### Core
- **JWT authentication** — register, login, `/me`. Passwords hashed with bcrypt.
- **Show/hide password toggle** on both login and signup forms; signup also has a "confirm password" field with mismatch validation.
- **Candidate CRUD** — create, list, view, edit, delete. Owned scoping (users only see their own candidates).
- **Search, status filter, pagination** on the candidates list.
- **Aadhaar & PAN verification** — calls external provider APIs (configurable URLs). Stores every request/response in an audit log.
- **Overall verification status** is computed automatically: both `VERIFIED` → `VERIFIED`, both `FAILED` → `FAILED`, mixed → `PARTIAL`.
- **Professional PDF reports** generated with PDFKit (pure JS, no Chromium needed). Reports show masked Aadhaar/PAN, status banner, per-check cards with timestamps, and a signature footer.
- **Cloudinary integration** — every generated report is uploaded to Cloudinary in the background, giving each candidate a shareable HTTPS link.

### Dashboard & analytics
- 5 stat cards (Total / Verified / Pending / Partial / Failed) with trend labels ("X added this week", "Y% verification success").
- **Donut chart** (Recharts) of status distribution.
- **Area chart** of new candidates per day over the last 7 days.
- **Bar chart** of Aadhaar vs PAN verification outcomes — uses *latest* verification per candidate, so re-running verification doesn't inflate counts.

### Bulk operations
- **Bulk CSV upload** — drag-and-drop or click-to-browse. Client-side parsing with Papaparse, header validation, 10-row preview, per-row error reporting. Bad rows don't block good ones (partial success).
- **Downloadable CSV template** built into the bulk upload page.

### Security & ops
- **Aadhaar and PAN masked** in every API response (`XXXX-XXXX-1234`, `ABCXXXXX4F`). Raw numbers never leave the backend.
- **Rate limiting** — 10/15min on `/api/auth` (anti-brute-force), 30/min on `/api/verifications`, 200/min globally.
- **Helmet** for security headers, **CORS** restricted to a configurable frontend origin.
- **Zod input validation** on every endpoint with structured error responses.
- **Graceful Cloudinary fallback** — if Cloudinary env vars are blank, uploads are silently skipped and the app continues working with just the direct-download flow.

---

## Tech stack

### Frontend
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Zustand** for auth state (persisted to `localStorage`)
- **React Hook Form** + **Zod** for forms + validation
- **Axios** with interceptors (auto-injects JWT, redirects on 401)
- **Recharts** for analytics
- **Papaparse** for client-side CSV parsing
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** (MongoDB provider)
- **JWT** (`jsonwebtoken`) + **bcryptjs**
- **Zod** validation
- **PDFKit** for PDF generation
- **Cloudinary** for report storage
- **express-rate-limit**, **helmet**, **cors**, **morgan**

### Database
- **MongoDB Atlas** (free M0 cluster works fine)

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

---

## Architecture

```
┌─────────────────────┐     HTTPS      ┌──────────────────────┐
│  Next.js (Vercel)   │ ←────────────→ │  Express (Render)    │
│  - App Router       │   axios + JWT  │  - Controllers       │
│  - Tailwind UI      │                │  - Services          │
│  - Zustand store    │                │  - Validations       │
│  - Recharts         │                │  - Middleware        │
└─────────────────────┘                └──────────┬───────────┘
                                                  │
                  ┌───────────────────────────────┼───────────────────────────────┐
                  │                               │                               │
            MongoDB Atlas                    Cloudinary                  Provider APIs
            (Prisma ORM)                  (PDF report hosting)        (Aadhaar + PAN URLs;
                                                                       default to local /mock-api)
```

---

## Project structure

```
vsheild/
├── backend/
│   ├── prisma/schema.prisma           Mongo data models
│   ├── src/
│   │   ├── config/                    env loader, prisma singleton
│   │   ├── controllers/               thin HTTP handlers
│   │   ├── services/                  business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── candidate.service.ts   includes bulk + analytics
│   │   │   ├── verification.service.ts
│   │   │   ├── report.service.ts      PDFKit + Cloudinary
│   │   │   └── cloudinary.service.ts
│   │   ├── routes/                    express routers (incl. /mock-api)
│   │   ├── middleware/                auth, errors, rate-limit
│   │   ├── validations/               Zod schemas
│   │   ├── utils/                     jwt, password, masking
│   │   └── app.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/                 public auth pages
│   │   │   ├── register/
│   │   │   ├── (app)/                 protected route group (auth-guarded layout)
│   │   │   │   ├── dashboard/
│   │   │   │   └── candidates/{,/new,/bulk,/[id],/[id]/edit}
│   │   │   ├── layout.tsx             root layout + Toaster
│   │   │   └── page.tsx               / → redirects based on auth
│   │   ├── components/                Sidebar, Header, StatusBadge,
│   │   │                              CandidateForm, charts/*
│   │   ├── lib/                       axios client, API services
│   │   ├── store/                     Zustand auth store
│   │   └── types/                     shared TS types
│   ├── .env.local.example
│   └── package.json
│
├── samples/                           pre-generated sample PDFs (VERIFIED/FAILED/PARTIAL)
├── sample_bulk_upload.csv             11 rows (8 valid + 3 invalid) for demoing bulk
├── postman_collection.json            importable Postman collection
├── API.md                             full request/response API reference (markdown)
├── API_Documentation.docx             same content, Word doc format
├── DEPLOYMENT.md                      Vercel + Render + Atlas guide
└── README.md                          you are here
```

---

## Setup instructions

### Prerequisites
- Node.js 18 or higher
- A MongoDB Atlas account (free M0 tier)
- A Cloudinary account (free, optional — only needed for shareable PDF links)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd vsheild

# Backend
cd backend
npm install
cp .env.example .env       # then fill in DATABASE_URL + JWT_SECRET (see below)

# Frontend (new terminal)
cd ../frontend
npm install
cp .env.local.example .env.local
```

### 2. MongoDB Atlas

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com), create a free M0 cluster.
2. **Database Access** → add a user with a strong password.
3. **Network Access** → allow `0.0.0.0/0` (for development; tighten in production).
4. **Connect → Drivers** → copy the connection string.
5. Add `bgv` as the database name **before** the `?`:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/bgv?retryWrites=true&w=majority
   ```
6. Paste into `backend/.env` as `DATABASE_URL`.

### 3. Cloudinary (optional but recommended)

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Dashboard → copy `cloud_name`, `api_key`, `api_secret`.
3. Paste into `backend/.env`.
4. **Important:** Settings → Security → enable **"Allow delivery of PDF and ZIP files"**. Cloudinary blocks PDF delivery by default for security.

> Skipping Cloudinary is fine — the **Download Report** button still works (it streams directly from the backend). You just won't see the "Shareable cloud link" panel on the candidate detail page.

### 4. Sync the Prisma schema to Mongo

```bash
cd backend
npm run prisma:generate
npm run prisma:push
```

### 5. Run

```bash
# Terminal 1
cd backend && npm run dev          # http://localhost:5000

# Terminal 2
cd frontend && npm run dev         # http://localhost:3000
```

Open http://localhost:3000 → register → start verifying.

---

## Environment variables

### `backend/.env`

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `DATABASE_URL` | ✅ | — | MongoDB Atlas connection string with `/bgv` as the database name |
| `JWT_SECRET` | ✅ | — | Long random string. Generate with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | | `7d` | Token lifetime |
| `PORT` | | `5000` | Backend port |
| `NODE_ENV` | | `development` | Use `production` when deploying |
| `FRONTEND_URL` | | `http://localhost:3000` | CORS allow-list — must match your deployed frontend exactly (no trailing slash) |
| `AADHAAR_API_URL` | | local mock | In production, point at a licensed provider (Karza, Surepass, IDfy, etc.) |
| `PAN_API_URL` | | local mock | Same as above, separate endpoint |
| `CLOUDINARY_CLOUD_NAME` | optional | — | Skip Cloudinary if blank |
| `CLOUDINARY_API_KEY` | optional | — | |
| `CLOUDINARY_API_SECRET` | optional | — | |
| `CLOUDINARY_UPLOAD_FOLDER` | | `bgv-reports` | Folder inside your Cloudinary library |

### `frontend/.env.local`

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend base URL, including `/api` |

---

## API endpoints

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET | `/api/health` | | Health check |
| POST | `/api/auth/register` | | Create account |
| POST | `/api/auth/login` | | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/candidates` | ✅ | List with `?page=&limit=&search=&status=` |
| GET | `/api/candidates/stats` | ✅ | Counts by status |
| GET | `/api/candidates/analytics` | ✅ | 7-day timeseries + Aadhaar/PAN breakdown |
| POST | `/api/candidates` | ✅ | Create one |
| POST | `/api/candidates/bulk` | ✅ | Bulk create (max 500 rows per request) |
| GET | `/api/candidates/:id` | ✅ | Detail with verification logs |
| PUT | `/api/candidates/:id` | ✅ | Update |
| DELETE | `/api/candidates/:id` | ✅ | Delete |
| POST | `/api/verifications/:id/start` | ✅ | Run Aadhaar + PAN checks |
| GET | `/api/reports/:id` | ✅ | Download PDF report |
| POST | `/mock-api/aadhaar/verify` | | Mock provider endpoint (regex check) |
| POST | `/mock-api/pan/verify` | | Mock provider endpoint (regex check) |

Full request/response specs for every endpoint:
- **[`API.md`](./API.md)** — markdown
- **[`API_Documentation.docx`](./API_Documentation.docx)** — Word doc (same content, printable / shareable)

A ready-to-import Postman collection lives at `postman_collection.json` in the project root. Login/register auto-save the JWT to a collection variable; create-candidate auto-saves the candidate ID. Bearer auth is pre-wired on all protected requests.

### Sample reports

Three pre-generated sample PDFs live in **[`samples/`](./samples/)** so you can see the output format without running the app:
- `samples/sample_report_verified.pdf` — both checks pass → overall **VERIFIED**
- `samples/sample_report_failed.pdf` — both checks fail → overall **FAILED**
- `samples/sample_report_partial.pdf` — one passes, one fails → overall **PARTIAL**

Regenerate them anytime with:
```bash
cd backend && npm run samples
```

---

## Bulk CSV upload format

The **Bulk upload** page (`/candidates/bulk`) accepts CSV files following this exact format.

### Quick reference

```
fullName , email , phone , aadhaarNumber , panNumber , dob , address
```

- **7 columns**, exact names, case-sensitive
- First row is the header
- One candidate per data row
- Use `YYYY-MM-DD` for `dob`
- Wrap `address` in `"..."` if it contains commas
- Up to **500 rows per upload**

Ready-to-use sample: **[`sample_bulk_upload.csv`](./sample_bulk_upload.csv)** (8 valid + 3 invalid rows for demoing both happy and failure paths).

### Required columns

The header row must contain these **7 columns** with these exact names (case-sensitive):

| Column | Type | Format / rules |
|---|---|---|
| `fullName` | string | 2–100 characters |
| `email` | string | valid email address |
| `phone` | string | 10–15 digits, optional leading `+` country code |
| `aadhaarNumber` | string | exactly 12 digits, numeric only |
| `panNumber` | string | `AAAAA9999A` — 5 uppercase letters + 4 digits + 1 uppercase letter (auto-uppercased on upload) |
| `dob` | date | `YYYY-MM-DD` format |
| `address` | string | 5–500 characters; quote with `"..."` if it contains commas |

### Sample CSV

```csv
fullName,email,phone,aadhaarNumber,panNumber,dob,address
Asha Verma,asha@example.com,9876543201,123456789012,ABCDE1234F,1992-04-15,"21 MG Road, Bengaluru"
Rohan Mehta,rohan@example.com,9876543202,234567890123,BCDEF2345G,1988-11-02,"7 Marine Drive, Mumbai"
Sneha Iyer,sneha@example.com,9876543203,345678901234,CDEFG3456H,1995-06-30,"45 Park Street, Kolkata"
```

A ready-to-use file with 8 valid + 3 deliberately-invalid rows is bundled in the repo: **`sample_bulk_upload.csv`**. Upload it to see both success and failure paths in one go.

### Behaviour

- Up to **500 rows per upload**. Split larger files.
- Each row is **validated independently** — bad rows don't block good ones.
- The result screen shows three counters (Total / Created / Failed) plus:
  - A list of created candidates (clickable to their detail pages)
  - A list of failed rows with per-field error messages (e.g. `Row 9 — phone: Invalid phone number`)
- The frontend also lets you **download the template** (`bgv_candidates_template.csv`) directly from the bulk upload page.

### Common errors and how to fix them

| Error | What it means | Fix |
|---|---|---|
| `Missing required column(s): ...` | Header row is missing one of the 7 required columns | Add the missing column. Header names are case-sensitive. |
| `aadhaarNumber: Aadhaar must be exactly 12 digits` | Number has fewer/more digits, or contains non-digit chars | Use exactly 12 digits, numeric only. |
| `panNumber: Invalid PAN format (expected ABCDE1234F)` | PAN doesn't match `5 letters + 4 digits + 1 letter` | Re-check the format. Lowercase is auto-uppercased; everything else must be exact. |
| `phone: Invalid phone number` | Less than 10 digits, or contains spaces/dashes | Use 10–15 digits, no separators. `+91` country code prefix is allowed. |
| `dob: Invalid date of birth` | Date isn't a recognisable format | Use `YYYY-MM-DD`. |

---

## Validation rules

| Field | Rule | Regex / detail |
|---|---|---|
| Aadhaar | exactly 12 digits | `/^\d{12}$/` |
| PAN | 5 letters + 4 digits + 1 letter | `/^[A-Z]{5}[0-9]{4}[A-Z]$/` |
| Phone | 10–15 digits, optional `+` | `/^\+?[0-9]{10,15}$/` |
| Password | minimum 8 characters | — |
| Email | RFC-valid email | Zod's `.email()` |

### Mock verification rule

The mock provider endpoints return `verified` if the input matches the
regex above, else `failed`. In production, swap `AADHAAR_API_URL` /
`PAN_API_URL` to a licensed provider and the rest of the app needs no
changes — the verification service is fully decoupled.

---

## Database schema

Three collections in MongoDB:

### `users`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | |
| `email` | String | unique |
| `passwordHash` | String | bcrypt |
| `createdAt`, `updatedAt` | DateTime | |

### `candidates`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `fullName`, `email`, `phone` | String | |
| `aadhaarNumber`, `panNumber` | String | stored raw, never returned to client |
| `dob` | DateTime | |
| `address` | String | |
| `status` | String | `PENDING` / `VERIFIED` / `FAILED` / `PARTIAL` |
| `reportUrl` | String? | Cloudinary URL after first download |
| `reportGeneratedAt` | DateTime? | |
| `createdById` | ObjectId | FK → `users._id` |
| `createdAt`, `updatedAt` | DateTime | |

### `verification_logs`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `candidateId` | ObjectId | FK → `candidates._id` (cascade-delete) |
| `verificationType` | String | `AADHAAR` or `PAN` |
| `requestPayload` | Json | masked Aadhaar/PAN, never raw |
| `responsePayload` | Json | full provider response |
| `verificationStatus` | String | `VERIFIED` or `FAILED` |
| `verifiedAt` | DateTime | |

Full Prisma schema: see `backend/prisma/schema.prisma`.

---

## Security

- **JWT** access tokens with configurable expiry (default 7 days)
- **bcrypt** password hashing (10 salt rounds)
- **Aadhaar and PAN masked** in every API response (`XXXX-XXXX-1234`, `ABCXXXXX4F`)
- **Raw identity numbers** are never logged or sent to the client; even in audit logs we store only the masked version of the request payload
- **Show/hide password toggle** on login and signup so users can verify what they typed
- **Confirm password** field on signup with mismatch validation (client-side only)
- **Rate limiting** — 10/15min on `/api/auth`, 30/min on `/api/verifications`, 200/min globally
- **Helmet** middleware for standard security headers
- **CORS** restricted to a single configurable origin (the frontend URL)
- **Zod** validation on every endpoint, with structured error responses
- **MongoDB injection prevention** is automatic via Prisma's parameterised queries

---

## Deployment

Full step-by-step Vercel + Render + MongoDB Atlas guide lives in **`DEPLOYMENT.md`**.

Short version:
1. Push to GitHub.
2. Render → New Web Service → connect repo, root dir `backend`, build `npm install && npm run prisma:generate && npm run build`, start `npm start`. Set env vars.
3. Run `prisma db push` once locally against the production `DATABASE_URL`.
4. Vercel → import repo, root dir `frontend`. Set `NEXT_PUBLIC_API_URL` to your Render URL + `/api`.
5. Back in Render, set `FRONTEND_URL` to your Vercel domain (no trailing slash). Wait for redeploy.

### Common deploy gotchas

- **CORS error** mentioning `localhost:3000` after deploy → `FRONTEND_URL` on Render still has the default. Update it to your real Vercel URL, no trailing slash.
- **"Prisma client did not initialize"** → build command is missing `npm run prisma:generate`.
- **Cold start (~30 sec)** on the first request after idle → Render free tier sleeps after 15 min. Hit `/api/health` from a free uptime monitor every 10 min to keep it warm.

---

## Testing

The project ships with two ready-made fixtures for manual testing:

- **`sample_bulk_upload.csv`** — 11 rows (8 valid + 3 invalid) to exercise the bulk upload happy path and per-row error reporting in one upload.
- **`postman_collection.json`** — every endpoint with automatic token + candidateId chaining. Import into Postman, run Login → Create candidate → Start verification → Download PDF.

### Suggested manual test flow

1. Register a new account → toast confirms, redirected to dashboard
2. Click **New candidate**, fill the form with valid data, submit
3. On the detail page, click **Start verification** → status updates to VERIFIED, timeline shows 2 log entries
4. Expand "Show API response" on a log entry → see the raw mock provider response JSON
5. Click **Report** → PDF downloads. Wait ~2 sec, the "Shareable cloud link" panel appears (if Cloudinary is configured)
6. Open the shareable link in a new tab → the same PDF, hosted on Cloudinary
7. Click **Bulk upload** → drop `sample_bulk_upload.csv` → see preview → upload → see 8 created + 3 failed with per-row errors
8. Refresh the dashboard → charts show updated counts and the 7-day activity spike

### Rate-limit smoke test

```bash
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@y.com","password":"wrong"}'
done
# expected: 401 × 10, then 429 × 5
```

---

## Scripts

### Backend
```bash
npm run dev                # ts-node-dev, hot reload
npm run build              # tsc -> dist/
npm start                  # node dist/app.js
npm run prisma:generate    # regen Prisma client
npm run prisma:push        # push schema to MongoDB
npm run samples            # regenerate the 3 sample PDFs in ../samples/
```

### Frontend
```bash
npm run dev                # next dev → http://localhost:3000
npm run build              # production build
npm start                  # run production build
npm run lint               # eslint
```

---

## Acknowledgements

Built against the **"Build a Background Verification Platform"** assignment
brief. Every stack pick (Next.js, Tailwind, Express, TypeScript, Prisma,
MongoDB, JWT, PDFKit, Cloudinary, Recharts, Papaparse) is taken from
the brief's recommended or optional tech list.
