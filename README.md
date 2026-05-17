# Nokta Academy Management System

Nokta Academy is a full-stack educational management system for schools and academies. It includes role-based dashboards, authentication, student and teacher management, classes, attendance, exams, results, books, finance, reports, multilingual UI, theme support, and offline-first frontend caching.

## Project Structure

- `backend/` - Node.js, Express, TypeScript, MongoDB/Mongoose API.
- `frontend/` - React 18, Vite, TypeScript, Tailwind CSS web app with PWA support.
- `Nokta_App/frontend_mobile/` - Separate mobile frontend copy.
- `account/` - Local account notes and sample credentials.
- `SYSTEM_WORK_LOG.md` - Phase-by-phase engineering work log.

## Technology Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Zustand, React Query, React Router, i18next, Recharts, vite-plugin-pwa.
- Backend: Express, TypeScript, Mongoose, JWT authentication, bcrypt password hashing, Joi validation, Helmet, CORS, rate limiting.
- Database: MongoDB, default local URI `mongodb://localhost:27017/nokta_academy`.
- Build system: npm scripts for each app.

## Prerequisites

- Node.js 18 or newer.
- npm.
- MongoDB running locally on port `27017`.
- Windows PowerShell users: run commands with `npm.cmd` if `npm` is blocked by execution policy.

## Backend Setup

```bash
cd backend
npm.cmd install
copy .env.example .env
npm.cmd run seed
npm.cmd run dev
```

The backend runs on `http://localhost:8081` by default. Health check:

```bash
curl http://localhost:8081/health
```

## Frontend Setup

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` to `http://127.0.0.1:8081`.

## Production Build

```bash
cd backend
npm.cmd run build

cd ..\frontend
npm.cmd run build
```

To preview the built frontend:

```bash
cd frontend
npm.cmd run preview
```

## Offline Notes

- Dependencies are installed locally in `node_modules`, so builds and local dev can run without downloading packages once installed.
- The frontend includes PWA service worker generation with cache rules for pages, scripts, styles, images, and GET API responses.
- Home page hero images and app icons are served from `frontend/public`, not from a CDN.
- The web app stores successful GET API responses in a small local offline cache and reuses them when the API is unavailable.
- The home and registration pages include bundled fallback academic data so they still render before the backend is available.
- MongoDB must be available locally for the backend API to start.

## Main Local URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8081/api`
- Backend health: `http://localhost:8081/health`

## Sample Accounts

See `account/accounts.md` for local sample credentials. Common seeded accounts include:

- Super Admin: `admin@gmail.com` / `12345678`
- Admin: `admin1@nokta.com` / `Admin123!`
- Teacher: `teacher1@nokta.com` / `Teacher123!`
- Student: `student1@nokta.com` / `Student123!`
- Parent/Family: `family1@nokta.com` / `Family123!`

## Troubleshooting

- If `npm` fails in PowerShell with an execution policy error, use `npm.cmd`.
- If the backend does not start, confirm MongoDB is running and `MONGO_URI` in `backend/.env` is correct.
- If login fails after reseeding, clear browser local storage and try the seeded credentials again.
- If the frontend cannot reach the API, confirm the backend is on port `8081` or set `VITE_API_URL`.
# Nokta_V8
