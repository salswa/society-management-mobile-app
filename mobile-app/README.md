# Portl — Mobile App

Expo SDK 55 (React Native 0.83) + Expo Router app for the Portl society platform.
It talks to the Node backend in [`../backend`](../backend). This is the **core vertical
slice**: auth, role-based navigation, the full visitor approval flow, and notices — for
Residents, Guards and Society Admins.

## Stack

- **Expo Router** — file-based navigation, role-segmented route groups
  `(auth)` / `(resident)` / `(guard)` / `(admin)`
- **TanStack Query** — all server data (caching, refetch, loading/error states)
- **Auth Context + expo-secure-store** — session tokens, auto refresh on 401
- **Custom design system** — theme tokens + primitives in `src/components` (no UI lib)

## Prerequisites

1. The backend running and reachable (see [`../backend/README.md`](../backend/README.md)):
   run its migrations, `npm run seed`, then `npm run dev` (listens on `:4000`).
2. Node 18+, and the **Expo Go** app on your phone or an Android/iOS emulator.

## Run

```bash
cd mobile-app
npm install
npx expo start
```

Then press `a` (Android emulator), `i` (iOS simulator), or scan the QR with Expo Go.

### Pointing the app at the backend

`src/lib/config.ts` resolves the API base URL automatically:

| Where you run the app | URL used |
| --- | --- |
| iOS simulator | `http://localhost:4000/api` |
| Android emulator | `http://10.0.2.2:4000/api` |
| **Physical phone (Expo Go)** | set `EXPO_PUBLIC_API_URL` — see below |

For a physical device, the app can't reach your PC's `localhost`. Create `.env`:

```
EXPO_PUBLIC_API_URL=http://<your-PC-LAN-IP>:4000/api
```

(Find your IP with `ipconfig`. Phone and PC must be on the same Wi-Fi. Alternatively
run `npx expo start --tunnel` and point the var at the tunnel URL.) Restart `expo start`
after changing `.env`.

## Demo accounts (from `backend npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@portl.app` | `admin123` |
| Resident | `riya@example.com` | `riya123` (flat A-101) |
| Guard | `guard@example.com` | `guard123` |

## Try the end-to-end flow

1. Sign in as **guard** → **Register** → search `A-101` → pick the flat → send request.
2. Sign out, sign in as **resident** (`riya`) → the visitor is **pending** → open it → **Approve**.
3. Sign in as **guard** again → **Approvals → To arrive** → open the visitor → **Mark entry**,
   then **Mark exit** → it moves to **History**.
4. Resident → **Pre-approve a guest**; read a **notice**.
5. Admin → **Post a notice** (resident sees it); open the **Visitor log**.
6. Register a brand-new account → lands on the **"Awaiting approval"** screen (no society yet).

## Structure

```
app/                       # Expo Router routes
  _layout.tsx              # providers (SafeArea + Query + Auth)
  index.tsx                # redirect by auth + role
  (auth)/                  # login, register
  pending.tsx              # awaiting-approval screen
  (resident)/ (guard)/ (admin)/   # role tab groups
src/
  api/                     # client (token refresh) + typed endpoint modules
  auth/                    # AuthContext + SecureStore
  query/                   # QueryClient + hooks
  components/              # design-system primitives
  features/                # shared screens (VisitorDetail, Notices, Profile)
  theme/tokens.ts          # colors, spacing, typography
  lib/                     # config (API URL), formatting
```
