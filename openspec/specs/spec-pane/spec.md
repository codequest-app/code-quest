# spec-pane Specification

## Purpose
TBD - created by archiving change spec-pane-f-html-alignment. Update Purpose after archive.
## Requirements
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

The pane SHALL render a `Ready` badge in success tone when a change's `status` field equals `"complete"` (as reported by `openspec list --json`). The CLI emits three status values — `"in-progress"`, `"complete"`, `"no-tasks"` — and only `"complete"` triggers the badge.

#### Scenario: Complete change
- **WHEN** a change has `status: 'complete'`
- **THEN** a `Ready` badge renders in success-accent color

#### Scenario: In-progress change
- **WHEN** a change has `status: 'in-progress'`
- **THEN** no `Ready` badge renders

#### Scenario: Change with no tasks
- **WHEN** a change has `status: 'no-tasks'` (no tasks.md or zero checkbox lines)
- **THEN** no `Ready` badge renders, and no task-progress pill renders either

### Requirement: Active-changes header exposes a `+ new` action

The Active changes section header SHALL include an `+ new` affordance that opens a dialog to create a new OpenSpec change via the `openspec new change <name>` CLI.

#### Scenario: Click `+ new`
- **WHEN** the user clicks the `+ new` button in the Active changes header
- **THEN** a dialog opens with a name input field

#### Scenario: Submit valid name
- **WHEN** the user submits a name matching `/^[a-z0-9-]+$/`
- **THEN** the server executes `openspec new change <name>` in the worktree cwd, and on success the pane refreshes to show the new change

#### Scenario: Submit invalid name
- **WHEN** the user submits a name with uppercase / spaces / special chars
- **THEN** the dialog displays a validation error and does not fire the RPC

#### Scenario: CLI error
- **WHEN** the server returns `{ error }` from `openspec new change`
- **THEN** a toast surfaces the error and the dialog remains open

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

### Requirement: Complete change rows expose an `Archive` action

Change rows whose `status === 'complete'` SHALL render an `Archive` button next to the `Ready` badge. Rows with `status === 'in-progress'` or `'no-tasks'` MUST NOT render the button — premature archiving is the wrong default.

#### Scenario: Complete change shows Archive button
- **WHEN** a change has `status: 'complete'`
- **THEN** an `Archive` button is rendered in the row, alongside the `Ready` badge

#### Scenario: In-progress change hides Archive button
- **WHEN** a change has `status: 'in-progress'`
- **THEN** no `Archive` button is rendered

### Requirement: Archive opens a confirmation dialog

Clicking the `Archive` button SHALL open a confirmation dialog before any RPC fires. The dialog displays the change name, a warning that the change will move under `openspec/changes/archive/`, and an opt-in checkbox `Skip spec update (--skip-specs)` that defaults to **off** (i.e. specs are propagated by default).

#### Scenario: Click opens dialog, no RPC yet
- **WHEN** the user clicks `Archive` on a complete change row
- **THEN** an `ArchiveChangeDialog` opens, and no `openspec:archive` RPC has fired

#### Scenario: Cancel closes dialog without firing RPC
- **WHEN** the user clicks `Cancel` in the dialog
- **THEN** the dialog closes and no RPC has fired

#### Scenario: Confirm fires RPC with skipSpecs=false by default
- **WHEN** the user clicks `Archive` in the dialog without toggling the skip-specs checkbox
- **THEN** the RPC is invoked with `{ cwd, name, skipSpecs: false }`

#### Scenario: Confirm with skip-specs toggle propagates the flag
- **WHEN** the user toggles `Skip spec update` on, then clicks `Archive`
- **THEN** the RPC is invoked with `{ cwd, name, skipSpecs: true }`

### Requirement: `openspec:archive` RPC spawns the CLI

The server RPC `openspec:archive` SHALL spawn `openspec archive <name> -y` (always non-interactive) plus `--skip-specs` when `skipSpecs === true`. cwd is validated against explorer roots; name is validated against the slug regex `/^[a-z0-9-]+$/`.

#### Scenario: Successful archive
- **WHEN** the CLI exits zero
- **THEN** the RPC resolves to `{ ok: true }` and the openspec dirty broadcast (already wired via the file watcher on `openspec/`) refreshes the pane

#### Scenario: Non-zero CLI exit
- **WHEN** the CLI exits non-zero
- **THEN** the RPC resolves to `{ error: <stderr> }` and the dialog stays open with a toast

#### Scenario: Invalid slug
- **WHEN** `name` contains uppercase / spaces / path separators
- **THEN** the RPC resolves to `{ error: 'invalid-name' }` without spawning the CLI

#### Scenario: cwd outside explorer roots
- **WHEN** `cwd` is not under the server's `explorerRoots`
- **THEN** the RPC resolves to `{ error: 'Path outside explorer roots' }`

