---
name: DNP360 Firestore migration
description: Details of RTDB→Firestore migration: collection names, persistence setup, storage version, and helper patterns.
---

## Collections (top-level in Firestore)
- `complaints`, `houses`, `wards`, `groups`, `notices`, `attendance`, `houseVisits`, `users`, `secretKeys`, `passwordResetRequests`, `importHistory` — each doc uses the app's own ID as the Firestore document ID.
- `settings/support` — single doc for SupportDetails object.
- `usersByMobile/{mobile}` — doc with `{ email }` field for mobile→email lookup.
- `meta/version` — doc with `{ value: STORAGE_VERSION }` for cache-bust migrations.

## Storage version
- Current: `'7'` (bump when seeded data shape changes; triggers full collection wipe + re-seed).

## Offline persistence
- Web: `initializeFirestore(app, { localCache: persistentLocalCache() })`
- Native: `initializeFirestore(app, { experimentalForceLongPolling: true })`
- Wrapped in try/catch → falls back to `getFirestore(app)` if already initialized.

## Helper patterns (lib/firebase.ts → contexts)
- `fsSaveDoc(col, item)` — setDoc with `_updatedAt: serverTimestamp()`.
- `fsDeleteDoc(col, id)` — deleteDoc.
- `fsLoadCollection(col, seed)` — getDocs; if empty, batch-seeds with serverTimestamp.
- `fsLoadDoc(col, docId, seed)` — getDoc single doc (used for `settings/support`).
- `fsUpdateDocFields(col, id, fields)` — updateDoc partial fields + `_updatedAt`.
- Batch writes used for: bulkImportHouses (500-doc chunks), assignGroupToHouses, removeGroupFromHouses, deleteGroup, updateUserId, updateUserFull.

**Why:** RTDB stored entire arrays under one path; Firestore uses individual documents — this is more efficient, supports offline persistence natively on web, and scales correctly.
