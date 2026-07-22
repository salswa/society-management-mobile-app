# Portl — Society Management

A mobile-first society management app that moves the conversations that used to
happen at the society gate into one community app.

- **`backend/`** — Node.js + Express + TypeScript REST API on Supabase (Postgres + Auth).
  Email + password auth (phone + OTP planned later), role-based access
  (resident / guard / admin), and modules for visitors, complaints, amenities,
  notices, polls, staff directory and maintenance.
  **Built and ready — see [backend/README.md](backend/README.md).**
- **`mobile-app/`** — Expo SDK 55 + React Native + Expo Router app (Phase 2, not yet built).

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Full backend (all modules) | ✅ Complete |
| 2 | Expo mobile app | ⏳ Planned |

Start with the backend: `cd backend && cp .env.example .env` (fill Supabase keys),
`npm install`, run the migrations in `backend/supabase/migrations/`, `npm run seed`,
then `npm run dev`. Verify end-to-end with `backend/requests.http`.
