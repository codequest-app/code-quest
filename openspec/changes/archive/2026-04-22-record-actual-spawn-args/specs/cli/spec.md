## ADDED Requirements

### Requirement: ProcessRunner exposes launchArgs and augments session:init

`ProcessRunner` SHALL expose the resolved spawn args (the output of
`adapter.buildArgs(opts)` from its constructor) as `public readonly
launchArgs: string[]`. When parsing stdout line yields a
`session:init` ClientMessage, `_processLine` MUST augment the event
payload with an `args` field whose value equals `this.launchArgs`.
Other event types MUST pass through unmodified.

#### Scenario: session:init payload augmentation

- **WHEN** CLI emits a `session:init` line and ProcessRunner
  processes it
- **THEN** the emitted `client_message` event's payload includes
  `args: string[]` equal to `runner.launchArgs`

#### Scenario: non-init events not augmented

- **WHEN** CLI emits any other event type (e.g. `session:status`,
  `result`)
- **THEN** the emitted payload does NOT contain an `args` field

#### Scenario: launchArgs public after construction

- **WHEN** caller accesses `runner.launchArgs`
- **THEN** the value equals what `adapter.buildArgs(options.args)`
  returned at construction, unchanged for the runner's lifetime
