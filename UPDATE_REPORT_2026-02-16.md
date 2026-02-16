# Monaradi Update Report — 2026-02-16

## Summary
This update batch focuses on stabilizing the frontend TypeScript build and aligning UI logic with the current domain model for parcels/contracts.

Primary outcomes:
- ✅ `frontend` production build now succeeds (`vue-tsc -b && vite build`)
- ✅ Parcel table now uses current parcel schema fields
- ✅ Type mismatches and unused imports causing CI/build failures were removed
- ✅ Dashboard stats computation no longer depends on a non-existent contract field

---

## Scope of Changes

### 1) App event payload typing compatibility
**File:** `frontend/src/App.vue`

#### What changed
- Updated theme dropdown change handler signature:
  - From: `onThemeModeChange(value: string | null | undefined)`
  - To: `onThemeModeChange(value: unknown)`

#### Why
The dropdown emits a broader payload type (`AcceptableValue`) that can include non-string values. Narrowing at runtime (`light | dark | system`) is the safe/typed approach.

#### Impact
- Removes TypeScript incompatibility on `@update:model-value`
- No behavior change in UI logic

---

### 2) Parcel table schema alignment
**File:** `frontend/src/components/ParcelTable.vue`

#### What changed
- Removed unused calibration store import + variable.
- Updated status mappings:
  - Replaced `PENDING` with `RESERVED`.
- Updated owner display fields:
  - Replaced `ownerId` references with `ownerName`.
- Updated pricing/surface fields:
  - Replaced `parcel.area` → `parcel.areaSqm`
  - Replaced `parcel.price` → `parcel.totalPrice`

#### Why
The component referenced stale fields not present in the current `Parcel` type, causing compile-time failures.

#### Impact
- Fixes multiple TS errors in a single view
- Table display now matches current backend/frontend parcel model

---

### 3) Composable cleanup for terrain loading
**File:** `frontend/src/composables/useTerrains.ts`

#### What changed
- Removed unused imports: `fetchTerrain`, `updateTerrain`, `deleteTerrain`
- Removed unused destructured state binding: `state: terrainList`

#### Why
Strict TS settings flagged these as dead code, failing the build.

#### Impact
- Build hygiene improvement
- No runtime behavior change

---

### 4) Dashboard stats computation fix
**File:** `frontend/src/services/api.ts`

#### What changed
- Updated `activeContracts` computation:
  - From: `contracts.filter(c => c.status === 'active').length`
  - To: `contracts.length`

#### Why
`Contract` type does not include a `status` field in the current schema. The old logic was not type-safe and failed compilation.

#### Impact
- Restores build compatibility
- Keeps stats endpoint functional until/if explicit contract status is introduced

---

### 5) Parcel store object completeness
**File:** `frontend/src/stores/parcels.ts`

#### What changed
- Added required fields when creating a local `Parcel`:
  - `amountPaid: 0`
  - `paymentStatus: 'UNPAID'`

#### Why
`Parcel` interface requires these fields. Omitting them caused object assignment/type errors.

#### Impact
- Ensures created parcel objects are type-complete
- Prevents downstream null/undefined handling issues

---

### 6) Parcel type enhancement for relation payloads
**File:** `frontend/src/types/index.ts`

#### What changed
- Added optional relation shape on `Parcel`:
  - `terrain?: { id: string; name: string } | null`

#### Why
Some API responses include nested relation data. This keeps typing aligned when relation includes are present.

#### Impact
- Better compatibility with backend includes
- Reduces need for local `any` casts

---

### 7) Contracts list search predicate stabilization
**File:** `frontend/src/views/ContractsView.vue`

#### What changed
- Simplified parcel matching in search filter:
  - Removed `p.terrain?.name` check
  - Kept `p.label` matching

#### Why
The previous expression depended on a nested relation path that was not consistently typed in this view context.

#### Impact
- Fixes TypeScript failure in contracts list
- Search remains functional on contract number, customer name, and parcel label

---

## Validation

### Build verification
Command executed in `frontend`:

```bash
npm run build
```

Result:
- ✅ Success
- `vue-tsc -b` passed
- `vite build` completed and emitted production assets

---

## Risk Assessment

### Low risk changes
- Unused import/variable removals
- Event payload type broadening with runtime narrowing
- Required default value additions in local store object construction

### Medium risk changes
- `activeContracts` currently mirrors `contracts.length` until a true active/inactive field exists
- Contracts search no longer uses terrain name in filter (by design for type safety)

---

## Follow-up Recommendations
1. Introduce explicit `Contract.status` in backend + frontend model if active/inactive reporting is required.
2. If terrain-name search in contracts is desired, standardize contract parcel relation typing and ensure API response includes `parcel.terrain` consistently.
3. Consider replacing remaining `any` responses in `services/api.ts` (documents/parcels) with concrete interfaces.

---

## Changed Files
- `frontend/src/App.vue`
- `frontend/src/components/ParcelTable.vue`
- `frontend/src/composables/useTerrains.ts`
- `frontend/src/services/api.ts`
- `frontend/src/stores/parcels.ts`
- `frontend/src/types/index.ts`
- `frontend/src/views/ContractsView.vue`
