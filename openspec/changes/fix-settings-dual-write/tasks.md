## Tasks

### 1. Red — unit tests for CompositeSettingsStore
- [x] `packages/server/src/__tests__/composite-settings-store.test.ts`
- [x] Throws when constructed with empty stores array.
- [x] `set` fans out to all stores (spy stores both observe the write).
- [x] `get` / `getMany` read from `stores[0]` only.
- [x] Partial failure (1 of 2 stores throws): logs error, the other store still writes, caller doesn't see the exception.
- [x] All-fail: throws `AggregateError`.

### 2. Green — implement CompositeSettingsStore
- [x] `packages/server/src/services/composite-settings-store.ts`
- [x] Mirror `CompositeSessionStore` / `CompositeRawEventStore` patterns.

### 3. Container wiring
- [x] In `container.ts`, change `const settingsStore = settingsStores[0];` to wrap composite when length > 1.

### 4. Regression
- [x] `pnpm -r test` green (529 server, 1314 client, 326 summoner).
- [x] `pnpm tsc --noEmit` clean.

### 5. Smoke (manual, user-run)
- [ ] Boot server with `RAW_EVENTS_DRIVERS=sqlite,mysql`.
- [ ] Trigger any settings write (change model / permissionMode in UI).
- [ ] Verify both SQLite + MySQL `settings` tables receive the row.
