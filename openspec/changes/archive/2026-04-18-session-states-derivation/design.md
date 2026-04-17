## Context

After the `channel-socket-router` change, `session:states` is subscribed
in two independent places:
- `SessionContext` maintains the full `sessions` list from
  `session:states` + `session:created` + `session:dead`.
- `ChannelConfigContext` independently subscribes via the router's
  `{ guard: false }` opt-out to pull `modelSetting` / `permissionMode` /
  `effort` for its own channelId.
- `ChannelMessagesContext` also subscribes independently to map
  `state: 'busy' | 'exited' | ...` onto `channelState.status`.

Both channel-side subscriptions read a subset of the same data
`SessionContext.sessions` already holds. They exist only because
channel contexts had no way to read from SessionContext without
re-subscribing.

## Goals / Non-Goals

**Goals**
- Collapse the redundant subscription in `ChannelConfigContext` into a
  derivation reading `useSession().sessions`.
- Preserve exact test behavior (no test changes, no expect changes).

**Non-goals**
- **Not** migrating `ChannelMessagesContext` in this change. See below.
- Not unifying into a new router or event bus — SessionContext is
  already the single source of truth for sessions; the derivation just
  uses it.

## Decisions

### Why ChannelMessagesContext is excluded

Migrating Messages to derivation is behaviorally different under the
existing tests. The reason:

`SessionContext.sessions` is a **snapshot** updated by many events:
- `session:created` → inserts `{ state: 'launching', ... }`
- `session:states` → merges per-session fields
- `session:dead` → removes

The old Messages subscription only reacted to `session:states` broadcasts
— nothing else. A derivation keyed on `sessions` would additionally
react to `session:created` inserts (state: 'launching' → mapped to 'idle'
via the default branch of the status mapping), producing a status update
at a point the old path didn't. In tests that emit `session:created`
during channel init (via `claude.initialize(...)` in the FakeClaude
harness), this flips `channelState.status` → `isProcessing` timing,
which changes the compose placeholder from "Esc to focus" to "Queue
another message…" and fails `getByPlaceholderText` lookups in 33 tests
without any change to test assertions.

Since the refactor rule forbids changing `expect` assertions, Messages
derivation requires a follow-up change that either:
(a) separates a "latest session:states delta" signal in SessionContext
    distinct from the `sessions` snapshot, so channel-side subscribers
    can listen to the delta and match the old timing; or
(b) changes the status mapping to distinguish "launching" from "idle"
    and verifies tests still express the intended behavior.

Either is out of scope for a refactor.

### What stays in ChannelConfigContext

Config only cares about `modelSetting` / `permissionMode` / `effort`.
These fields are **late-bound**: they appear on a session summary only
after the CLI reports them (usually via `session:states`). They don't
appear on the `session:created` entry (which has only `channelId`,
`state: 'launching'`, `cwd`, `projectRoot`). So deriving these from
`sessions` introduces no extra updates vs. the old subscription —
`sessions.find(...)` returns an entry whose `modelSetting` etc. are only
populated when a session:states has arrived. The derivation fires at the
same moments the subscription used to.

### Subscription removal only; SessionContext unchanged

`SessionContext` already subscribes to `session:states`. This is the
only remaining `socket.on('session:states')` after this change. No
changes needed to SessionContext.

## Risks / Trade-offs

**Risk**: if future changes add extra events to `SessionContext.sessions`
that modify `modelSetting` / `permissionMode` / `effort` (e.g., a future
`session:settings_changed` that updates these fields on the in-memory
summary), Config would start reacting to those as well, which may be
desirable or may surprise callers. Today those fields only change via
`session:states`, so behavior is equivalent.

**Trade-off**: `onSessionStates` helper in `handlers/settings.ts` is
deleted along with its specific tests-for-helper angle (none existed).
The logic is now inline in `ChannelConfigContext`. Slight loss of
testability in isolation, but the function had a single caller and no
tests, so the split had negative value.

## Migration

One file edit (`ChannelConfigContext.tsx`), one dead export removal
(`handlers/settings.ts`). All tests remain unchanged.
