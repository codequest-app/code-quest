## ADDED Requirements

### Requirement: Dirty matchers live in a dedicated module

`matchesFs`, `matchesGit`, `matchesOpenspec`, `IGNORE_RES`, and `GIT_META_RE` SHALL be defined in `packages/server/src/socket/dirty-matchers.ts`. Handler files (`handlers/fs.ts`, `handlers/git.ts`, `handlers/openspec.ts`) MUST NOT export these predicates and MUST NOT import predicates or regexes from each other. `container.ts` MUST import the three predicates from `dirty-matchers.ts` when constructing the `DirtyBroadcaster` instances.

#### Scenario: Adding a new ignore pattern
- **WHEN** a developer needs to ignore an additional path family in dirty events
- **THEN** they edit `socket/dirty-matchers.ts` exactly once and `container.ts` plus all three handlers pick up the change with no edits

#### Scenario: Handler cross-imports
- **WHEN** the codebase is inspected
- **THEN** no `handlers/<x>.ts` file imports from another `handlers/<y>.ts` for matchers or regexes

### Requirement: Socket-to-broadcaster wiring is centralized in `subscribeDirtyForSocket`

`packages/server/src/socket/dirty-subscriber.ts` SHALL export `subscribeDirtyForSocket(socket, cwd, dirty): Unsubscribe[]`, which subscribes the socket to `dirty.files`, `dirty.git`, and `dirty.openspec` for the given `cwd`, emitting `files:dirty` / `git:dirty` / `openspec:dirty` events to the socket with the established payload shape, and returns the three unsubscribe handles. Both `socket/channel-manager.ts` and `socket/handlers/fs.ts` MUST call this helper instead of re-implementing the three subscribe calls inline.

#### Scenario: Channel-manager subscribes a socket to a cwd
- **WHEN** `channel-manager.ts` joins a socket to a channel and needs dirty broadcasting
- **THEN** it calls `subscribeDirtyForSocket(socket, cwd, dirty)` exactly once and stores the returned unsubs in its existing per-channelId Map

#### Scenario: fs handler subscribes a socket to a cwd
- **WHEN** `handlers/fs.ts` processes an `fs:watch` request
- **THEN** it calls `subscribeDirtyForSocket(socket, cwd, dirty)` exactly once and stores the returned unsubs in its existing per-cwd Map

### Requirement: Per-consumer bookkeeping remains independent

The two bookkeeping `Map`s — `channel-manager.ts` keyed by `channelId` and `handlers/fs.ts` keyed by `cwd` — SHALL remain separate. They MUST NOT be merged into a shared registry, because their lifecycles differ (`leaveChannel` vs socket disconnect / `fs:unwatch`).

#### Scenario: Socket disconnect cleanup
- **WHEN** a socket disconnects with both channel-manager subscriptions and fs-handler subscriptions active
- **THEN** each consumer's existing cleanup path runs against its own Map and invokes every recorded unsub from its earlier `subscribeDirtyForSocket` call, with no duplicate or missed cleanup
