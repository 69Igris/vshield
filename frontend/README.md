# BGV Frontend

Background Verification Platform — Next.js dashboard.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand (auth state)
- React Hook Form + Zod
- Axios
- React Hot Toast (notifications)
- Lucide React (icons)

## Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```

The default value points to the backend at `http://localhost:5000/api`. Adjust if needed.

### 3. Run dev server
```bash
npm run dev
```

Frontend will start at `http://localhost:3000`.

> Make sure the backend is running at `http://localhost:5000` first.

## Pages
- `/` — auto-redirects to `/login` or `/dashboard`
- `/login` — sign in
- `/register` — create account
- `/dashboard` — (coming next phase)
- `/candidates` — (coming next phase)

## Scripts
- `npm run dev` — start dev server (with hot reload)
- `npm run build` — production build
- `npm start` — run production build
