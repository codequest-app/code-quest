## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Specs header exposes a `sync` action

**Reason**: `openspec sync` was never a real CLI command — F.html's prototype toasts the intent but has no backing. Our `openspec:sync` RPC could only ever return errors. Removing the surface is the correct fix; if a future OpenSpec release ships a real sync command we'll re-add a proposal at that time.

Migration: delete the `sync` button from Specs header, `openspec:sync` socket event, `openspecSyncPayloadSchema` / `openspecSyncResultSchema`, and `OpenspecService.sync`. `openspec:dirty` broadcasts triggered by the watcher continue to refresh the list organically.
