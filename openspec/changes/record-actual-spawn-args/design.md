## Context

`DrizzleSessionStore.sessions.args` is populated by
`connect.ts#onSessionInit` from `channelManager.runnerArgs`, which
returns `runnerFactory.args` set at `container.ts:68` via
`adapter.buildArgs()` (no opts). Result: every row stores a
model-agnostic / session-agnostic base args set. Verified by
`SELECT id, args FROM sessions` — all rows identical.

The actual spawn goes through
`runnerFactory.create(launchOptions) → new ProcessRunner({ args: opts })`
and `ProcessRunner` stores `this.launchArgs = adapter.buildArgs(opts)`
(runner.ts:47). So the real args exist — they just aren't surfaced
where the session-record flow looks.

The consumer search for the static `runnerArgs` (grep) returned
exactly one caller: `onSessionInit`. No routes, no logs, no UI reads
it. Safe to delete.

## Goals / Non-Goals

**Goals:**
- `sessions.args` reflects the args that were actually handed to
  `child_process.spawn` for that session.
- Server does not call `adapter.buildArgs` anywhere. That method
  stays a summoner internal.
- Data flows via the existing `session:init` event — no new event
  type, no reverse state pull from the handler.

**Non-Goals:**
- Remote ProcessRunner / cross-process summoner.
- Redacting sensitive args (no sensitive fields exist in
  `LaunchOptions` today; if future fields warrant filtering, handle
  it then).
- Backfilling historical rows (accept that pre-change rows contain
  only base args).

## Decisions

### 1. ProcessRunner owns `launchArgs`, exposes via event payload

ProcessRunner already computes `this.launchArgs = adapter.buildArgs(opts)`
in its constructor. Flip `private` → `public readonly` for
introspection (tests, logging). For the DB-write flow, augment the
`session:init` ClientMessage payload inside `_processLine`:

```ts
if (message.name === 'session:init') {
  message.payload = { ...message.payload, args: this.launchArgs };
}
```

Other event types pass through untouched.

**Alternative considered — new `'spawned'` event:** Rejected as
over-engineering. The `session:init` event is already the exact
point when server needs args. Co-locating the data here avoids a
new event contract + subscriber bookkeeping.

**Alternative considered — getter on ProcessRunner, handler pulls:**
Rejected per user feedback. `onSessionInit` should be a pure event
handler (reacts to data in the event); reaching back into runner
state inverts the dependency.

### 2. Remove `runnerFactory.args` + `channelManager.runnerArgs`

These were the concrete artifact of the layering leak. Only
consumer is `onSessionInit` (replaced). After that's done, both
are dead.

`runnerFactory.command` stays — it's just `adapter.command`
(constant) and is used for the session record's `command` column
(which is correct — command doesn't vary per launch).

### 3. Shared schema change

Add `args: z.array(z.string()).optional()` to
`sessionInitEventSchema`. Optional because:
- CLI doesn't emit it; only ProcessRunner augments. Tests or fakes
  might emit without augmentation.
- Historical or alternative emitters stay valid.

Server `onSessionInit` falls back to `[]` if missing, and logs a
warning — this shouldn't happen in practice after the change.

### 4. Test harness mirrors augmentation

`FakeProcessRunner` (or the fake factory used by tests) also
publishes `launchArgs` and augments its synthetic session:init. If
tests skip the augmentation, assertions on `sessions.args` would
get empty — acceptable, surfaces misconfigured fakes.

## Risks / Trade-offs

- **Risk:** `sessionInitEventSchema` is `looseObject` and consumers
  may be doing exact-shape equality. Adding an optional field won't
  break schema validation but might surprise snapshot tests.
  Mitigation: grep for schema fixture snapshots, update any that
  serialize the full payload.
- **Trade-off:** args leak runner-local data into an event payload.
  Future architectural cost is low because args are already
  public-ish (they're the process's argv). Not a secrecy concern.
- **Trade-off:** loose optional field means consumers can't rely on
  presence. Server uses `?? []` defensively rather than demanding
  the field — this matches the loose-event convention.

## Migration Plan

None for existing rows. The change is forward-only: new sessions
get accurate args; historical rows keep whatever base-only array
they stored. No DB migration.

For deployment: safe to ship as a single commit. No schema changes
at DB level, only TS/runtime.
