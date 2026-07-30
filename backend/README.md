# Portl — Backend

Node.js + Express + TypeScript API for the Portl society management app, backed by
Supabase (Postgres + Auth). The mobile app talks **only** to this API; the API owns
all Supabase access.

- **Auth:** email + password (no verification email). Users are created server-side with
  the Supabase **secret key** (`auth.admin.createUser` with `email_confirm: true`) and sign
  in with `signInWithPassword({ email, password })`. Phone + OTP sign-in is planned for
  later; a `phone` column is already stored on the profile.
- **Keys:** uses the new Supabase API keys — `sb_publishable_…` (verifying user JWTs)
  and `sb_secret_…` (privileged operations) — instead of legacy anon/service_role.
- **Roles:** `resident`, `guard`, `admin`. Authorization is enforced in middleware;
  RLS is enabled on every table as deny-by-default defense-in-depth.

## 1. Prerequisites

- Node.js 18+
- A Supabase project (free tier is fine)

## 2. Supabase setup

1. Create a project at https://supabase.com.
2. **Settings → API Keys** → create/copy the **Publishable** (`sb_publishable_…`) and
   **Secret** (`sb_secret_…`) keys, and the project URL.
3. **Authentication → Providers → Email**: make sure **Email** is enabled and turn
   **off** "Confirm email" (the backend confirms accounts via admin, so no verification
   email is sent). No SMS/Twilio setup is needed — phone sign-in comes later.
4. **Run the migrations** (in order) from `supabase/migrations/`:
   - Easiest: open the **SQL Editor**, paste each file `0001 → 0005` in order, run.
     (Each table has RLS enabled in the same migration, so the "RLS not enabled"
     warning won't appear.)
   - Or with the Supabase CLI: `supabase link` then `supabase db push`.

## 3. Configure & run

```bash
cd backend
cp .env.example .env          # fill in SUPABASE_URL / PUBLISHABLE / SECRET keys
npm install
npm run seed                  # creates a society + bootstrap admin
npm run dev                   # http://localhost:4000
```

`npm run seed` prints the admin login (default email `admin@portl.app`, password `admin123`).

## 4. Verify end-to-end

Open `requests.http` with the VS Code **REST Client** extension and run the requests
top to bottom. It exercises the full flow: admin creates tower/flat/resident/guard/
amenity/notice/poll → resident raises a complaint, books the amenity, votes, pre-approves
a guest → guard registers a visitor, resident approves, guard checks in/out → history.
It ends with 401/403/400 negative checks.

## 5. API overview (all under `/api`)

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Profile | `GET /profile`, `PATCH /profile`, `POST /profile/push-token` *(stored for later)* |
| Society | `GET /society`, `PATCH /society` *(admin)* |
| Org (admin) | CRUD `/towers`, `/flats`, `/residents` (+ `/:id/approve`, `/:id/status`, `/:id/flats`) |
| Resident search | `GET /residents/search?q=` *(guard/admin)* |
| Visitors | `POST /visitors`, `GET /visitors`, `GET /visitors/history`, `GET /visitors/:id`, `POST /visitors/:id/{approve,reject,check-in,check-out}` |
| Complaints | `POST /complaints`, `GET /complaints`, `GET /:id`, `POST /:id/comments`, `PATCH /:id` *(admin)* |
| Amenities | `GET /amenities`, `GET /:id`, `GET /:id/availability`, admin `POST/PATCH`; bookings `GET/POST /bookings`, `DELETE /bookings/:id` |
| Notices | `GET /notices`, `GET /:id`, admin `POST/PATCH/DELETE` |
| Polls | `GET /polls`, `GET /:id`, `GET /:id/results`, `POST /:id/vote`, admin `POST /polls`, `POST /:id/close` |
| Directory | `GET /staff`, admin `POST/PATCH/DELETE` |
| Maintenance | `GET /maintenance`, admin `POST /maintenance`, `POST /:id/mark-paid` |

Errors are returned as `{ "error": { "code", "message", "details?" } }`.
Auth is a Bearer access token from login/refresh.

## 6. Project structure

```
src/
  config/env.ts          validated environment
  lib/                   supabase clients, errors, db helpers, validators, context
  middleware/            authenticate, rbac, validate, error
  modules/<name>/        controller (router + zod) + service per feature
  routes/index.ts        mounts all routers under /api
  app.ts / server.ts
supabase/migrations/     0001..0005 SQL (schema, RLS, triggers)
scripts/seed.ts          bootstrap society + admin
requests.http            end-to-end manual test suite
```


