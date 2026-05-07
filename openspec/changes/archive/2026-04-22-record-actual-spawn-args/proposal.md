## Why

`sessions.args` in DB currently stores the adapter's base args (no
per-launch opts) instead of the actual args used to spawn the CLI.
Every session row looks identical, regardless of model / thinking /
cwd / mcp flags. This breaks any forensic use of the column
(who launched with what config?) and fails the operator-trust test:
you can't reproduce a session from its record.

Root cause is two intertwined architectural leaks:
1. Server calls `adapter.buildArgs()` at container boot (`container.ts`)
   and stashes the result on `runnerFactory.args`. This is server
   predicting what summoner would produce — a layering violation.
2. `onSessionInit` reads that predicted value (via
   `channelManager.runnerArgs`) and writes it to DB — baking the
   prediction in as if it were fact.

The correct model: **summoner owns args** (it's the layer that actually
spawns). Server hands opts down, summoner decides args, and when server
needs to record them, the data arrives via the existing event stream.

## What Changes

- **Remove** `runnerFactory.args` (container.ts) and
  `channelManager.runnerArgs` getter — dead-wrong abstractions.
- `ProcessRunner` (summoner): make `launchArgs` `public readonly` and
  augment the `session:init` ClientMessage payload with its
  `launchArgs` in `_processLine`. Other event types pass through
  unchanged.
- Shared schema: add `args: z.array(z.string()).optional()` to
  `sessionInitEventSchema` so the server can type-safely read the
  augmented field.
- Server `onSessionInit`: read args from the event payload and write
  it to DB. No more reaching into summoner's state.
- FakeProcessRunner / test harness: carry `launchArgs` the same way
  so fake events also carry them through.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `cli`: session:init event payload gains a `args: string[]`
  field contributed by ProcessRunner (not CLI).
- `adapter`: server session record now stores the args that the
  spawned process actually received, sourced from the runner event.

## Impact

- `apps/summoner/src/runner.ts` — launchArgs visibility +
  `_processLine` session:init augmentation
- `apps/summoner/src/test/fake-runner.ts` (or equivalent) —
  mirror the augmentation for fake spawns
- `packages/shared/src/schemas/session.ts` —
  `sessionInitEventSchema.args`
- `apps/server/src/container.ts` — drop `runnerFactory.args`
- `apps/server/src/socket/channel-manager.ts` — drop
  `runnerArgs` getter (and confirm no callers besides
  `onSessionInit`)
- `apps/server/src/socket/handlers/session/connect.ts` —
  `onSessionInit` reads `payload.args`
