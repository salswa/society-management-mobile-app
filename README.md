# UrbanSo — Society Management

A mobile-first society (gated-community) management app that moves the conversations
and paperwork that used to happen at the society gate into one community app —
visitor approvals, notices, complaints, maintenance dues, polls, amenity bookings and
member management, across three roles: **Resident**, **Guard**, and **Admin**.

> UrbanSo is the product name. The backend package/seed still use the original
> internal name (`portl`) in a few places (npm name, the `admin@portl.app` seed login) —
> harmless and intentionally left as-is.

## Monorepo layout

| Folder                       | What it is                          | Stack                                     | Status                 |
| ---------------------------- | ----------------------------------- | ----------------------------------------- | ---------------------- |
| [`backend/`](backend/)       | REST API — owns all Supabase access | Node.js · Express · TypeScript · Supabase | ✅ Built & deployed    |
| [`mobile-app/`](mobile-app/) | The app (resident / guard / admin)  | Expo SDK 55 · React Native · Expo Router  | ✅ Built (Android APK) |

## Live links

- **Demo site:** https://urbanso-demo.pages.dev — role walkthrough videos + APK install page
- **API:** `https://smapp-theta.vercel.app` (health: `/api/health`)
- **Android APK / build:** via the demo site's _Download App_ page (links to the Expo build)

## Roles & features

- **Resident** — pre-approve guests, approve/deny visitors, notices, helpdesk (complaints),
  maintenance dues, community polls, amenity booking, profile & flat.
- **Guard** — gate console (pending / inside / expected), register a visitor, see
  pre-approved guests, live resident approvals, verify & mark entry, full visitor log.
- **Admin** — dashboard (approvals / complaints / dues), manage members (approve sign-ups,
  set roles, assign flats), towers & flats, staff & service providers, notices, maintenance
  dues, polls, amenities & bookings, helpdesk, society-wide visitor log. An admin who also
  has a flat can switch between the **Admin** and **Resident** experiences.

Two identity axes on a profile: `role` (`resident | guard | admin`) and `user_type`
(`resident | non_resident`). Residents pick a tower + flat at sign-up; an admin approves
every new member (and assigns the role for non-residents).

---

# Backend (`backend/`)

Node.js + Express + TypeScript API backed by **Supabase** (Postgres + Auth). The mobile app
talks **only** to this API; the API owns all Supabase access using the new Supabase keys
(`sb_publishable_…` to verify user JWTs, `sb_secret_…` for privileged operations). RLS is
enabled on every table as deny-by-default defense-in-depth. Auth is email + password
(accounts are admin-confirmed server-side; phone + OTP is planned).

### Run locally

```bash
cd backend
cp .env.example .env      # fill SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY
npm install
# run migrations 0001..0007 (SQL editor or `supabase db push`) — see below
npm run seed              # creates a society, towers/flats, demo members & data
npm run dev               # http://localhost:4000
```

`npm run seed` prints the demo logins (default admin `admin@portl.app` / `admin123`).

### Environment

| Var                        | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `SUPABASE_URL`             | Project URL, e.g. `https://xxxx.supabase.co`         |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` — verify user JWTs                |
| `SUPABASE_SECRET_KEY`      | `sb_secret_…` — server-only privileged access        |
| `NODE_ENV`                 | `development` / `production`                         |
| `PORT`                     | Local dev port (default 4000; ignored on serverless) |
| `SUPABASE_PROJECT_ID`      | Only for `npm run gen:types`                         |
| `SEED_*`                   | Bootstrap society/admin values for `npm run seed`    |

### Migrations

Run in order from [`backend/supabase/migrations/`](backend/supabase/migrations/):

```
0001_init.sql               schema + RLS
0002_visitors.sql           visitor flow
0003_community.sql          notices, complaints, amenities
0004_engagement.sql         polls, maintenance, staff
0005_triggers.sql           triggers/functions
0006_flat_single_resident.sql   one account per flat (unique index)
0007_user_type.sql          profiles.user_type enum
```

### API overview (all under `/api`)

| Area            | Routes                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Health          | `GET /health`                                                                                                                     |
| Public (unauth) | `GET /public/societies`, `/public/towers?society_id=`, `/public/flats?tower_id=` (free flats)                                     |
| Auth            | `POST /auth/{register,login,refresh,logout}`, `GET /auth/me`                                                                      |
| Profile         | `GET/PATCH /profile`, `POST /profile/push-token`                                                                                  |
| Society         | `GET /society`, `PATCH /society` _(admin)_                                                                                        |
| Org (admin)     | CRUD `/towers`, `/flats`, `/residents` (+ `/:id/approve`, `/:id/role`, `/:id/status`, `/:id/flats`)                               |
| Resident search | `GET /residents/search?q=` _(guard/admin)_                                                                                        |
| Visitors        | `POST /visitors`, `GET /visitors`, `/visitors/history`, `/visitors/:id`, `POST /visitors/:id/{approve,reject,check-in,check-out}` |
| Complaints      | `POST/GET /complaints`, `GET /:id`, `POST /:id/comments`, `PATCH /:id` _(admin)_                                                  |
| Amenities       | `GET /amenities`, `/:id`, `/:id/availability`, admin `POST/PATCH`; `GET/POST /bookings`, `DELETE /bookings/:id`                   |
| Notices         | `GET /notices`, `/:id`, admin `POST/PATCH/DELETE`                                                                                 |
| Polls           | `GET /polls`, `/:id`, `/:id/results`, `POST /:id/vote`, admin `POST /polls`, `POST /:id/close`                                    |
| Directory       | `GET /staff`, admin `POST/PATCH/DELETE`                                                                                           |
| Maintenance     | `GET /maintenance`, admin `POST /maintenance`, `POST /:id/mark-paid`                                                              |

Errors: `{ "error": { "code", "message", "details?" } }`. Auth is a Bearer access token.
Verify the whole flow end-to-end with [`backend/requests.http`](backend/requests.http)
(VS Code REST Client). More detail in [`backend/README.md`](backend/README.md).

### Deploy (Vercel — serverless)

The Express app is exported as a single serverless function ([`backend/api/index.ts`](backend/api/index.ts))
with a catch-all route ([`backend/vercel.json`](backend/vercel.json)):

1. Vercel → New Project → this repo → **Root Directory = `backend`**, Framework = _Other_.
2. Add env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NODE_ENV=production`.
3. Deploy → test `https://<app>.vercel.app/` and `/api/health`.

Seeding stays local (`npm run seed` runs from your machine against Supabase). A
[`render.yaml`](render.yaml) blueprint is also included as an alternative host.

---

# Mobile app (`mobile-app/`)

Expo SDK 55 + React Native + Expo Router. TanStack Query for data, Supabase-backed via
the API, Syne/Inter fonts, a royal-blue (`#4361EE`) theme. File-based routing with role
route groups: `(auth)`, `(resident)`, `(guard)`, `(admin)`.

### Run locally

```bash
cd mobile-app
cp .env.example .env       # set EXPO_PUBLIC_API_URL (see below)
npm install
npx expo start -c          # scan the QR with Expo Go, or run on a simulator
```

### Backend URL

The app reads `EXPO_PUBLIC_API_URL` and falls back to localhost in dev
([`src/lib/config.ts`](mobile-app/src/lib/config.ts)). It **must end in `/api`**.

```
# mobile-app/.env
EXPO_PUBLIC_API_URL=https://smapp-theta.vercel.app/api
```

`EXPO_PUBLIC_*` vars are inlined at bundle time — restart with `npx expo start -c` after
changing them. For release builds the value is baked in via [`eas.json`](mobile-app/eas.json).

### Build the Android APK (EAS)

```bash
npm i -g eas-cli
eas login                  # account: salswaa
cd mobile-app
npm run build:apk          # eas build -p android --profile preview
```

The `preview` profile outputs an installable **APK** (not a Play-Store `.aab`) and bakes in
the production `EXPO_PUBLIC_API_URL`. When it finishes, EAS prints a build URL — download
the `.apk` there and share it, or point people at the demo site's _Download App_ page.
App identity lives in [`app.json`](mobile-app/app.json) (`name: UrbanSo`, `com.urbanso.app`,
icon + splash from `assets/`).

### Structure

```
app/                 Expo Router screens (auth / resident / guard / admin)
src/
  api/               typed API clients per module
  auth/              AuthContext, session storage, view-mode switch
  query/hooks.ts     TanStack Query hooks
  components/        shared UI (Card, Screen, SegmentedControl, SheetModal, …)
  features/          larger composed screens (ProfileScreen, lists, details)
  theme/tokens.ts    colors, fonts, spacing, radius
assets/              app icon + adaptive/splash images
```

More detail in [`mobile-app/README.md`](mobile-app/README.md).

---

## Demo accounts (from `npm run seed`)

| Login                 | Password     | Role                                |
| --------------------- | ------------ | ----------------------------------- |
| `admin@portl.app`     | `admin123`   | Admin (also a resident)             |
| `kabir@example.com`   | `kabir123`   | Admin (non-resident)                |
| `guard@example.com`   | `guard123`   | Guard                               |
| `riya@example.com`    | `riya123`    | Resident                            |
| `amit@example.com`    | `amit123`    | Resident                            |
| `pending@example.com` | `pending123` | Pending sign-up (awaiting approval) |

## Roadmap / deferred

Phone + OTP sign-in · push notifications (`expo_push_token` + endpoint already in place) ·
payment gateway for dues (currently manual "mark paid") · tenant flow (owner-approved) ·
multi-society login.
