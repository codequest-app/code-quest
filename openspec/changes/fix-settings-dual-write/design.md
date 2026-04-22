## Context

`container.ts` wraps multi-driver stores in their respective composite classes:

```ts
const rawEventStore = eventStores.length === 1 ? eventStores[0] : new CompositeRawEventStore(...);
const sessionStore  = sessionStores.length === 1 ? sessionStores[0] : new CompositeSessionStore(...);
const settingsStore = settingsStores[0];   // ← bug: no composite
```

`settingsStore` was written before the composite pattern was generalised; the fix is to make it consistent.

## Goals / Non-Goals

**Goals:**
- `SettingsStore.set` fans out to all configured backends when more than one is active.
- `get` / `getMany` stay read-from-first for simplicity (writes keep backends in sync).
- Unit-tested partial-failure behaviour matching the rest of the composite family.

**Non-Goals:**
- Migrating existing divergent data (sqlite has 4 rows, mysql has 0). Out of scope; can be a one-time script if needed.
- Conflict-resolution semantics (writes to both always succeed or all fail; no "last-writer-wins" reconciliation).

## Decisions

### Decision 1: Mirror `CompositeSessionStore` / `CompositeRawEventStore` structure

Same constructor signature, same `fanOut` pattern, same failure semantics. Keeps the codebase consistent.

```ts
class CompositeSettingsStore implements SettingsStore {
  constructor(private stores: SettingsStore[]) {
    if (stores.length === 0) throw new Error(...);
  }
  get(provider, key)    { return this.stores[0].get(provider, key); }
  getMany(provider, ks) { return this.stores[0].getMany(provider, ks); }
  async set(provider, key, value) {
    const results = await Promise.allSettled(this.stores.map((s) => s.set(...)));
    // Partial failure → log; all-fail → throw AggregateError
  }
}
```

### Decision 2: Read from `stores[0]` — no read-side UNION

Settings are single-value-per-key, not a collection. After a successful `set` both backends have the same value, so reading from either one is equivalent. If a write partially failed, the logged error surfaces the divergence; the user-facing read still returns the first store's value (which is the one that succeeded under our current `RAW_EVENTS_DRIVERS=sqlite,mysql` convention).

### Decision 3: No backfill

Historical SQLite settings (4 rows in dev) are not backfilled to MySQL. Rationale: this PR's goal is to fix the go-forward bug; operational reconciliation of past drift is a separate concern. Single-machine development doesn't need it; cross-machine deployments would use their own tooling.

## Risks / Trade-offs

- **[Risk]** The first `set` after this PR will write to MySQL for the first time; any unique/NOT-NULL constraint miss would surface there. **Mitigation**: schema is identical (covered by `schema-consistency.test.ts`); tests ensure fan-out across both backends.
- **[Risk]** Partial-failure path quietly swallows one backend's error. **Mitigation**: `logger.error` emits structured log; behaviour matches other composites — team convention is consistent.

## Migration Plan

None. Ship the composite + container one-liner. Existing data divergence continues to exist until someone runs an ad-hoc reconciliation (not required for correctness — reads continue from `stores[0]` which has the "truth").
