# DNP360 — Daudnagar Nagar Parishad 360

A full-featured municipal governance mobile app for Nagar Parishad Daudnagar, Bihar. Four role-based modules covering citizen complaint management, safai karmi attendance/QR scanning, official ward management, and admin system control.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native), expo-router v6, Material 3 + glassmorphism
- Fonts: Inter (400/500/600/700) via expo-google-fonts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile/` — Expo React Native app (DNP360)
  - `app/` — Expo Router file-based routing
    - `_layout.tsx` — Root layout (AuthProvider + AppProvider)
    - `login.tsx` — Login screen (email/password + secret code)
    - `forgot-password.tsx` — Password reset flow
    - `(tabs)/` — Tab dispatcher (5 tabs, role-aware)
  - `screens/` — Role-specific screen components
    - `citizen/` — CitizenHome, CitizenComplaints, CitizenNotices, CitizenEmergency
    - `safaikarmi/` — SKHome, SKScan, SKAttendance, SKPerformance
    - `official/` — OfficialHome, OfficialComplaints, OfficialWorkers, OfficialHouses
    - `admin/` — AdminHome, AdminUsers, AdminKeys, AdminManagement
    - `shared/` — ProfileScreen
  - `contexts/` — AuthContext, AppContext (full in-memory CRUD)
  - `constants/colors.ts` — All design tokens (light + dark)
  - `hooks/useColors.ts` — Color hook (dark mode aware)
  - `components/` — Shared UI (DNP360Logo, StatCard, QuickActionBtn, ComplaintCard, NoticeCard, HouseCard, SettingsItem, SearchBar, SectionHeader)
  - `types/index.ts` — All TypeScript types + COMPLAINT_CATEGORIES

## Architecture decisions

- **Tab dispatch pattern**: 5 fixed tabs (index/action/secondary/tertiary/profile) each dispatch to role-specific screen components based on `user?.role` — avoids nested navigators
- **In-memory data**: AppContext holds all app state (complaints, houses, wards, users, notices, secretKeys) with seed data — no backend calls yet
- **Role-based auth**: Citizens use email+password; staff (SK/Official/Admin) use secret code tabs — `loginWithCode()` separate from `login()`
- **Simulated QR**: No expo-camera installed; QR scanning is a fake camera frame + manual entry fallback
- **Color system**: Role colors (citizen blue, SK green, official orange, admin dark blue) threaded through all screens via `useColors()` hook

## Product

- **Citizen**: File complaints with category/photos, track status, read notices, emergency contacts
- **Safai Karmi**: Daily attendance QR scan (simulated), house visit log, performance metrics
- **Official**: Full complaint management pipeline (submitted → assigned → in_progress → resolved), worker oversight, ward house registry
- **Admin**: User management (CRUD), secret key generation/revocation, ward management, notice publishing

## Demo Credentials

| Role | Login Method | Credential |
|------|-------------|-----------|
| Citizen | Email + Password | citizen.dnp360@gmail.com / 12345678 |
| Safai Karmi | Secret Code | SK2566F |
| Official | Secret Code | OFF4416A |
| Admin | Secret Code | ADMIN5790X |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `SafeAreaView` from `react-native-safe-area-context` — use `edges={['top']}` on all screens
- All ScrollViews need `paddingBottom: 100` in `contentContainerStyle` for tab bar clearance
- `colors.dnpBlue` may be undefined in dark mode — use `?? '#0F2D6B'` fallback
- Never use `console.log` in server code — use `req.log` / `logger` singleton
- Tab bar height ~60px

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
