---
name: DNP360 Mobile Architecture
description: Key architecture decisions and conventions for the DNP360 Expo app
---

## Project
- Expo Router (file-based routing), pnpm monorepo at `artifacts/mobile`
- All data persisted via AsyncStorage in `AppContext.tsx` (STORAGE_VERSION = '3')
- No real backend — `api-server` artifact exists but mobile uses only local context

## Roles & login
- Citizens & Admin → email or 10-digit mobile + password (login.tsx, method='mobile'|'email')
- Officials & Safai Karmis → secret code (loginWithCode in AuthContext)
- Login screen shows a role hint box clarifying this distinction

## Custom Alert system
- `contexts/AlertContext.tsx` exports `AlertProvider` + `useAlert` hook
- `useAlert().showAlert(title, message, buttons?, type?)` — type: `'info' | 'success' | 'error' | 'warning'`
- Renders a dark-gradient Modal; completely replaces `Alert` from react-native
- `AlertProvider` is in `app/_layout.tsx` (wraps the whole app)
- ALL `Alert.alert(...)` calls removed from every screen — zero remain
- `useColors()` hook now always returns dark palette (hardcoded) to prevent white-box mismatch on Android light mode

## Key files
- `app/_layout.tsx` — providers: SafeAreaProvider > ErrorBoundary > GestureHandler > LanguageProvider > AuthProvider > AppProvider > AlertProvider
- `contexts/LanguageContext.tsx` — EN/HI translations, persisted to AsyncStorage as 'dnp360_language'
- `components/LanguageSwitcher.tsx` — compact EN/हि toggle used in all home screens
- `lib/firebase.ts` — Firebase JS SDK (not React Native Firebase), project admin-dnp360
- `types/index.ts` — PasswordResetRequest has optional `adminNote?: string`

## Official screens theme
- All 4 official screens use ember-orange/gold LinearGradient: `['#78350F', '#92400E', '#B45309']`
- Stat cards use `['#D97706','#F59E0B']` gold gradient

**Why:** User explicitly requested ember-orange/gold for all official role screens.

## Secret code → Firebase user creation
- New unused RTDB key: creates Firebase user `{code.toLowerCase()}.dnp360@gmail.com` / password=code
- Marks key `usedBy: newUid` in RTDB after creation
- Subsequent logins: signs into Firebase with same email/code, gets RTDB profile
- Hardcoded demo codes (SK2566F, OFF4416A, ADMIN5790X) still map to DEMO_USERS directly

## Login order (fixed)
- `login()` now checks demo users FIRST (sync), then tries Firebase — prevents Firebase fallback failing for citizens
- `loginWithCode` creates new Firebase user for unused keys; retrieves RTDB profile for used keys

## Forgot password
- Two-tab UI: Submit Request + Check Status
- Check Status looks up by email from local `passwordResetRequests` state
- Admin can add an optional `adminNote` when approving — shown to user in Check Status tab

## Login/Signup/ForgotPassword design
- Background: deep purple-indigo `['#07002E','#100840','#0A1550']` with decorative orbs
- Both "Create Citizen Account" and "Reset Password" always visible on login page (below main card)
- Quick link cards with role-colored gradients (green/amber)
- Vibrant gradient tab pills for Sign In / Secret Code
