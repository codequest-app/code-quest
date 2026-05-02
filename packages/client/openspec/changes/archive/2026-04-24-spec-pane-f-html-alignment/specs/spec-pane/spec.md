## ADDED Requirements

### Requirement: Change rows prefix a `📋` icon; spec rows prefix a `▸` chevron

Each row in the Spec pane SHALL render a distinguishing glyph so changes and specs are visually separable at a glance, matching `docs/prototype/F.html`.

#### Scenario: Change row glyph
- **WHEN** an active change is listed
- **THEN** the row's leading element is the `📋` glyph

#### Scenario: Spec row glyph
- **WHEN** a shipped spec capability is listed
- **THEN** the row's leading element is a right-chevron (`▸` or equivalent icon)

### Requirement: Change rows show task progress as a pill badge

Task progress (`done/total`) SHALL render as a `badge task` pill (bordered, small, monospace) rather than plain muted text. Matches F.html `.spec-row .badge.task`.

#### Scenario: Change with task progress
- **WHEN** a change has a non-null `tasks` summary
- **THEN** the progress string (e.g. `3/8`) renders inside a bordered pill element

#### Scenario: Change without tasks.md
- **WHEN** a change has `tasks === null`
- **THEN** no task-progress pill is rendered

### Requirement: Change rows show a `Ready` badge when all tasks are complete

Since OpenSpec has no native `status` field, the pane derives a readiness hint from `tasks`. Changes with `tasks.total > 0 && tasks.done === tasks.total` SHALL render an additional `Ready` badge in success tone next to the task-progress pill.

#### Scenario: 100% complete tasks
- **WHEN** a change has `tasks = { done: 8, total: 8 }`
- **THEN** a `Ready` badge renders in success-accent color

#### Scenario: In-progress tasks
- **WHEN** a change has `tasks = { done: 3, total: 8 }`
- **THEN** no `Ready` badge renders

### Requirement: Active-changes header exposes a `+ new` action

The Active changes section header SHALL include an `+ new` affordance that opens a dialog to create a new OpenSpec change via the `openspec change new <name>` CLI.

#### Scenario: Click `+ new`
- **WHEN** the user clicks the `+ new` button in the Active changes header
- **THEN** a dialog opens with a name input field

#### Scenario: Submit valid name
- **WHEN** the user submits a name matching `/^[a-z0-9-]+$/`
- **THEN** the server executes `openspec change new <name>` in the worktree cwd, and on success the pane refreshes to show the new change

#### Scenario: Submit invalid name
- **WHEN** the user submits a name with uppercase / spaces / special chars
- **THEN** the dialog displays a validation error and does not fire the RPC

#### Scenario: CLI error
- **WHEN** the server returns `{ error }` from `openspec change new`
- **THEN** a toast surfaces the error and the dialog remains open

### Requirement: Specs header exposes a `sync` action

The Specs section header SHALL include a `sync` affordance that runs `openspec sync` in the worktree cwd.

#### Scenario: Click `sync`
- **WHEN** the user clicks the `sync` button
- **THEN** the server executes `openspec sync` and a toast confirms success or surfaces the error

### Requirement: Tasks tab in SpecModal is an interactive checklist

For changes, the Tasks tab SHALL render task lines as clickable checkboxes. Clicking a checkbox toggles `- [ ]` ↔ `- [x]` at the corresponding line in `tasks.md` on the server, then the pane refreshes via the existing `openspec:dirty` broadcast.

#### Scenario: Toggle unchecked → checked
- **WHEN** the user clicks an unchecked task checkbox
- **THEN** the UI optimistically renders checked, the server rewrites that line in `tasks.md` from `- [ ]` to `- [x]`, and the task-progress counter updates on refresh

#### Scenario: Toggle checked → unchecked
- **WHEN** the user clicks a checked task checkbox
- **THEN** the line in `tasks.md` becomes `- [ ]` again

#### Scenario: Write failure
- **WHEN** the server returns `{ error }` from the toggle RPC
- **THEN** the UI reverts to the previous checkbox state and a toast surfaces the error

### Requirement: Spec-pane RPCs validate paths stay under `<cwd>/openspec/`

All three new RPCs (`openspec:changeNew`, `openspec:sync`, `openspec:toggleTask`) SHALL resolve any user-supplied path or slug against the worktree's `openspec/` directory, rejecting inputs that escape that root.

#### Scenario: Slug contains `..`
- **WHEN** a caller submits `name: "../foo"` to `openspec:changeNew` or `openspec:toggleTask`
- **THEN** the RPC returns `{ error: 'invalid-name' }` and performs no filesystem operation

#### Scenario: `cwd` is not a registered explorer root
- **WHEN** `cwd` is not under the server's `explorerRoots` allowlist
- **THEN** the RPC returns `{ error: 'invalid-cwd' }`
