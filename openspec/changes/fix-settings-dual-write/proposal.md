## Why

`RAW_EVENTS_DRIVERS=sqlite,mysql` leads users to expect **all** stores fan out writes to both backends. For `raw_events`, `raw_deltas`, and `sessions` this is true (via `CompositeRawEventStore` / `CompositeRawDeltaStore` / `CompositeSessionStore`). **`settings` is the exception** — container.ts does `settingsStore = settingsStores[0]`, silently picking only the first driver.

Observed in dev: `SELECT COUNT(*) FROM settings` returns 4 in SQLite, 0 in MySQL. Every `set(model, …)`, `set(permissionMode, …)`, `set(effortLevel, …)` has been landing in SQLite only. If a deployment ever switches primary DB or reads from MySQL (e.g. a cross-machine setup), user preferences vanish.

The fix is trivial and symmetric with the other stores: create `CompositeSettingsStore` and wrap multi-driver settingsStores in it.

## What Changes

- Add `CompositeSettingsStore` (symmetric with `CompositeSessionStore` / `CompositeRawEventStore`):
  - `set(provider, key, value)` → fan out `Promise.allSettled` to all backing stores.
  - `get` / `getMany` → read from `stores[0]` (eventual-consistency after successful writes is fine).
  - Partial failure → log + continue. All-fail → throw `AggregateError`.
- In `container.ts`: wrap `settingsStores` in `CompositeSettingsStore` when `> 1`, fall back to `stores[0]` when single.
- Unit tests for the composite.

## Capabilities

### New Capabilities

(none — this is an internal persistence-consistency fix, no user-visible behaviour change.)

### Modified Capabilities

(none)

## Impact

- `packages/server/src/services/composite-settings-store.ts` (new).
- `packages/server/src/container.ts` — one-line change at `settingsStore` construction.
- `packages/server/src/__tests__/composite-settings-store.test.ts` (new).
- No DB migration, no env change, no schema change.
