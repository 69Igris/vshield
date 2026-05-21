# BGV Backend

Background Verification Platform — Backend API.

## Stack
- Node.js + Express + TypeScript
- Prisma ORM (MongoDB provider)
- MongoDB Atlas
- JWT + bcrypt
- Puppeteer (PDF reports)

## Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Then open `.env` and fill in:
- `DATABASE_URL` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string

Other vars have sensible defaults:
- `AADHAAR_API_URL` defaults to our local mock at `/mock-api/aadhaar/verify`
- `PAN_API_URL` defaults to our local mock at `/mock-api/pan/verify`
- `AWS_BUCKET_NAME` is unused (reports stream on demand instead of S3)

In production, point `AADHAAR_API_URL` and `PAN_API_URL` at a licensed
verification provider (Karza, Surepass, IDfy, etc.) without changing any code.

### 3. Generate Prisma client + push schema to DB
```bash
npm run prisma:generate
npm run prisma:push
```

### 4. Run dev server
```bash
npm run dev
```

Server will start at `http://localhost:5000`.

Test it:
```bash
curl http://localhost:5000/api/health
```

Should return: `{"success":true,"status":"ok"}`

## Scripts
- `npm run dev` — start dev server with hot reload
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled JS (production)
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:push` — push schema to MongoDB

## Folder structure
```
src/
├── config/         env loader, prisma client
├── controllers/    route handlers
├── services/       business logic
├── routes/         express routers
├── middleware/     auth, errors
├── validations/    Zod schemas
├── utils/          helpers (masking, JWT)
└── types/          TS type defs
```
