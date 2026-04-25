## ADDED Requirements

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
