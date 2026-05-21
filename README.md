# BGV — Background Verification Platform

A full-stack platform for submitting candidate details, running Aadhaar &
PAN identity verification, and generating professional PDF reports.

> Built as a take-home assignment. Production-grade architecture (service
> layer, validation, masking, JWT, rate limiting, audit logs) with a
> deliberately simple scope.

---

## Features

- **JWT authentication** — register / login / `/me`, bcrypt password hashing
- **Candidate CRUD** — search, status filter, pagination
- **Bulk CSV upload** — papaparse on the client, per-row validation, partial-success reporting
- **Aadhaar & PAN verification** — calls mock external APIs (provider URLs are env-configurable so you can swap to a licensed vendor without code changes)
- **Verification audit log** — every check is recorded with request + response payload
- **PDF reports** — generated with PDFKit, **uploaded to Cloudinary** for shareable links
- **Analytics dashboard** — Recharts donut (status distribution), area chart (7-day activity), and bar chart (verification breakdown)
- **Security** — JWT + bcrypt, Aadhaar/PAN masking in all API responses, Zod validation, helmet, CORS, rate limiting on `/api/auth`, `/api/verifications`, and global API

---

## Tech Stack

### Frontend
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand (auth store, persisted in localStorage)
- React Hook Form + Zod
- Axios (with interceptors for auth + 401 handling)
- Recharts (analytics)
- Papaparse (CSV)
- React Hot Toast, Lucide React

### Backend
- Node.js + Express + TypeScript
- Prisma ORM (MongoDB provider)
- JWT (jsonwebtoken) + bcryptjs
- Zod (validation)
- PDFKit (report generation, pure JS — no Chromium)
- Cloudinary (report storage)
- express-rate-limit, helmet, cors, morgan

### Database
- MongoDB Atlas (free M0 cluster)

---

## Architecture

```
+--------------------+      HTTPS      +---------------------+
|   Next.js (Vercel) | <-------------> |  Express (Render)   |
|   - App Router     |   axios + JWT   |  - Controllers      |
|   - Tailwind UI    |                 |  - Services         |
|   - Zustand store  |                 |  - Validations      |
+--------------------+                 +----------+----------+
                                                  |
                                +-----------------+-----------------+
                                |                 |                 |
                          MongoDB Atlas      Cloudinary       Mock provider
                          (Prisma ORM)       (PDF reports)    (in-backend
                                                              /mock-api/*)
```

---

## Project structure

```
vsheild/
├── backend/                       Node + Express + Prisma
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config/                env loader, prisma singleton
│   │   ├── controllers/           thin HTTP handlers
│   │   ├── services/              business logic (auth, candidate, verification, report, cloudinary)
│   │   ├── routes/                express routers
│   │   ├── middleware/            auth, errors, rate-limit
│   │   ├── validations/           Zod schemas
│   │   ├── utils/                 jwt, password, masking
│   │   └── app.ts                 server entry
│   ├── .env.example
│   └── package.json
├── frontend/                      Next.js + Tailwind + Zustand
│   ├── src/
│   │   ├── app/
│   │   │   ├── login, register    public auth pages
│   │   │   ├── (app)/             protected route group
│   │   │   │   ├── layout.tsx     sidebar + header + auth guard
│   │   │   │   ├── dashboard/
│   │   │   │   └── candidates/{,/new, /bulk, /[id], /[id]/edit}
│   │   ├── components/            Sidebar, Header, StatusBadge, CandidateForm, charts/
│   │   ├── lib/                   axios client + API services
│   │   ├── store/                 Zustand auth store
│   │   └── types/                 shared TS types
│   ├── .env.local.example
│   └── package.json
├── sample_bulk_upload.csv         11 rows (8 valid + 3 invalid) for demoing bulk upload
├── postman_collection.json        importable Postman collection
└── README.md (this file)
```

---

## Setup Instructions

### Prerequisites
- Node.js 18 or higher
- A MongoDB Atlas account (free) — for the database
- A Cloudinary account (free, optional) — for shareable PDF report URLs

### 1. Clone & install
```bash
git clone <your-repo-url>
cd vsheild

# Backend
cd backend
npm install
cp .env.example .env   # then edit .env (see below)

# Frontend (in another terminal)
cd ../frontend
npm install
cp .env.local.example .env.local
```

### 2. MongoDB Atlas setup
1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. **Database Access** → add a database user (username + password)
4. **Network Access** → allow access from anywhere (or your IP)
5. Click **Connect → Drivers** → copy the connection string
6. Add `bgv` as the database name before the `?` like:
   `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/bgv?retryWrites=true&w=majority`
7. Paste it into `backend/.env` as `DATABASE_URL`

### 3. (Optional) Cloudinary setup — for shareable report URLs
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Dashboard → copy `cloud_name`, `api_key`, `api_secret`
3. Paste into `backend/.env` as `CLOUDINARY_CLOUD_NAME`, `_API_KEY`, `_API_SECRET`
4. **Important:** Settings → Security → enable **"Allow delivery of PDF and ZIP files"**

If you skip this step, the app still works fine — the "Download Report"
button streams the PDF directly. You just won't see the "Shareable cloud
link" panel on the candidate detail page.

### 4. Push the Prisma schema to Mongo
```bash
cd backend
npm run prisma:generate
npm run prisma:push
```

### 5. Start the servers
```bash
# Terminal 1 — backend
cd backend
npm run dev               # http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm run dev               # http://localhost:3000
```

Open `http://localhost:3000` → register an account → start verifying.

---

## Environment Variables

### `backend/.env`
| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | MongoDB Atlas connection string (with `/bgv` database) |
| `JWT_SECRET` | ✅ | — | Long random string for signing JWTs |
| `JWT_EXPIRES_IN` | | `7d` | Token lifetime |
| `PORT` | | `5000` | Backend port |
| `NODE_ENV` | | `development` | `development` or `production` |
| `FRONTEND_URL` | | `http://localhost:3000` | Used for CORS allow-list |
| `AADHAAR_API_URL` | | local mock | Aadhaar verification provider endpoint |
| `PAN_API_URL` | | local mock | PAN verification provider endpoint |
| `CLOUDINARY_CLOUD_NAME` | optional | — | Skip Cloudinary if blank |
| `CLOUDINARY_API_KEY` | optional | — | |
| `CLOUDINARY_API_SECRET` | optional | — | |
| `CLOUDINARY_UPLOAD_FOLDER` | | `bgv-reports` | Folder inside your Cloudinary library |

### `frontend/.env.local`
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/api/auth/register` | | Create account |
| POST | `/api/auth/login` | | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/candidates` | ✅ | List with `?page=&limit=&search=&status=` |
| GET | `/api/candidates/stats` | ✅ | Status counts (total/verified/pending/partial/failed) |
| GET | `/api/candidates/analytics` | ✅ | 7-day timeseries + Aadhaar/PAN breakdown |
| POST | `/api/candidates` | ✅ | Create one |
| POST | `/api/candidates/bulk` | ✅ | Bulk create (max 500 rows per request) |
| GET | `/api/candidates/:id` | ✅ | Get with verification logs |
| PUT | `/api/candidates/:id` | ✅ | Update |
| DELETE | `/api/candidates/:id` | ✅ | Delete |
| POST | `/api/verifications/:id/start` | ✅ | Run Aadhaar + PAN checks |
| GET | `/api/reports/:id` | ✅ | Download PDF report |
| POST | `/mock-api/aadhaar/verify` | | Mock Aadhaar (regex check) |
| POST | `/mock-api/pan/verify` | | Mock PAN (regex check) |

A ready-to-import **Postman collection** is included: `postman_collection.json`.

### Validation rules
- **Aadhaar:** `/^\d{12}$/` (exactly 12 digits, numeric only)
- **PAN:** `/^[A-Z]{5}[0-9]{4}[A-Z]$/` (e.g. `ABCDE1234F`)
- **Phone:** 10–15 digits, optional `+` country code
- **Password:** minimum 8 characters

### Mock verification rule
The mock APIs return `verified` if the format matches the regex above,
else `failed`. In production, swap `AADHAAR_API_URL` / `PAN_API_URL` to
point at a licensed provider (Karza, Surepass, IDfy, etc.) and the rest
of the app needs no changes.

---

## Database

Three collections (Mongo):

**users**  → `id, name, email (unique), passwordHash, createdAt, updatedAt`
**candidates**  → `id, fullName, email, phone, aadhaarNumber, panNumber, dob, address, status, reportUrl, reportGeneratedAt, createdById -> users.id, createdAt, updatedAt`
**verification_logs**  → `id, candidateId -> candidates.id, verificationType (AADHAAR|PAN), requestPayload (json), responsePayload (json), verificationStatus (VERIFIED|FAILED), verifiedAt`

Full schema: see `backend/prisma/schema.prisma`.

---

## Security

- **JWT** with configurable expiration (default 7 days)
- **bcrypt** password hashing (10 salt rounds)
- **Aadhaar & PAN masked** in every API response (`XXXX-XXXX-1234`, `ABCXXXXX4F`)
- **Raw identity numbers** never logged or sent to the client
- **Rate limiting** — 10/15min on `/api/auth`, 30/min on `/api/verifications`, 200/min globally
- **Helmet** for security headers
- **CORS** restricted to `FRONTEND_URL`
- **Input validation** with Zod on every endpoint

---

## Deployment

See `DEPLOYMENT.md` for step-by-step Vercel (frontend) + Render (backend) + Atlas (DB) instructions.

---

## Sample report

After running verification on any candidate, click **Report** on the
candidate detail page to download a PDF. A sample report is also
generated automatically — see `sample_report.pdf` (if included in the
repo) for what the output looks like without running the app.

---

## Testing

- The bundled `sample_bulk_upload.csv` (11 rows: 8 valid + 3 invalid) tests both happy and error paths
- Manual test scenarios covered in the `Setup Instructions` section
- Rate limit test: `for i in {1..15}; do curl ...; done` shows 429 on the 11th auth attempt

---

## Scripts

### Backend
```bash
npm run dev               # ts-node-dev with hot reload
npm run build             # compile TS -> dist/
npm start                 # run compiled JS
npm run prisma:generate   # regen Prisma client
npm run prisma:push       # push schema to MongoDB
```

### Frontend
```bash
npm run dev               # next dev (http://localhost:3000)
npm run build             # production build
npm start                 # run production build
```

---

## Acknowledgements

Built against the "Build a Background Verification Platform" assignment
brief. Stack picks (Next.js, Tailwind, Express, TypeScript, Prisma,
MongoDB, JWT, PDFKit, Cloudinary, Recharts) all align with the brief's
recommended/optional tech list.
