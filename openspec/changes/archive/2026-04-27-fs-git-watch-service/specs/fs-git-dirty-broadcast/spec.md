## ADDED Requirements

### Requirement: Classify FS events into files-dirty and git-dirty signals
The broadcaster SHALL classify each `WatchEvent` into one of `files:dirty`, `git:dirty`, or `drop` based on the path.

#### Scenario: Git metadata paths map to git:dirty
- **WHEN** the event path matches `.git/HEAD`, `.git/index`, `.git/packed-refs`, or `.git/refs/…`
- **THEN** the classification is `git:dirty` for the event's cwd.

#### Scenario: Ignored paths are dropped
- **WHEN** the event path falls under `.git/objects/`, `.git/logs/`, `node_modules/`, `dist/`, or similar build artifact paths
- **THEN** the classification is `drop` and no signal is emitted.

#### Scenario: Other paths map to files:dirty
- **WHEN** the event path is any non-ignored, non-git-metadata path (e.g. `src/foo.ts`)
- **THEN** the classification is `files:dirty` for the event's cwd with the path included in the dirty paths list.

### Requirement: Debounced per-cwd broadcasting
Signals SHALL be coalesced within a 200 ms window per cwd. Each flush emits at most one `git:dirty` and one `files:dirty` per cwd.

#### Scenario: Single event triggers a single delayed emit
- **WHEN** exactly one `src/foo.ts` change occurs at t=0
- **THEN** a `files:dirty` emit fires at approximately t=200ms with `paths: ['src/foo.ts']` and no earlier.

#### Scenario: Event storm collapses to one emit per signal per cwd
- **WHEN** 100 changes to different files under `/repo` fire in <50ms
- **THEN** exactly one `files:dirty` emit fires for `/repo` containing all 100 paths in `paths[]`.

#### Scenario: Concurrent git and file changes emit both signals once
- **WHEN** both `.git/HEAD` and `src/foo.ts` change within a single 200ms window
- **THEN** exactly one `git:dirty` emit and one `files:dirty` emit fire for that cwd.

#### Scenario: Events across different cwds do not coalesce
- **WHEN** `/repo-a` and `/repo-b` both receive changes in the same window
- **THEN** each cwd emits its own signal; cwds are independent buckets.

### Requirement: Scope broadcasts to the socket channels watching that cwd
The broadcaster SHALL emit `files:dirty` / `git:dirty` only to socket.io channels whose session cwd matches the event cwd.

#### Scenario: Only subscribing channels receive the broadcast
- **WHEN** channel A has cwd `/repo-a`, channel B has cwd `/repo-b`, and `/repo-a` is dirtied
- **THEN** channel A receives the `files:dirty` event; channel B does not.

#### Scenario: Multiple channels on the same cwd all receive
- **WHEN** channels C1 and C2 both have cwd `/repo-a` and `/repo-a` is dirtied
- **THEN** both C1 and C2 receive the event once.

### Requirement: Lifecycle-coupled subscriptions
The broadcaster SHALL subscribe to a channel's cwd on channel creation and unsubscribe on channel close. Closed channels MUST NOT receive further broadcasts.

#### Scenario: Channel create starts watching
- **WHEN** a new channel with cwd `/repo` is created
- **THEN** `WatchService.subscribe('/repo', ...)` is called once for that channel.

#### Scenario: Channel close stops watching
- **WHEN** the last channel for cwd `/repo` closes
- **THEN** the corresponding subscription is released (refcount hits zero inside `WatchService`) and a subsequent `simulate('/repo', ...)` event does not produce any broadcast.

### Requirement: Socket event schemas
`files:dirty` and `git:dirty` SHALL be declared in the shared event catalog with zod schemas.

#### Scenario: files:dirty payload validates
- **WHEN** a `files:dirty` event is emitted
- **THEN** its payload matches `{ cwd: string; paths: string[] }` per the shared schema.

#### Scenario: git:dirty payload validates
- **WHEN** a `git:dirty` event is emitted
- **THEN** its payload matches `{ cwd: string }` per the shared schema.
