# client-add-project-dialog Specification

## Purpose
TBD - created by archiving change add-project-dialog-improvements. Update Purpose after archive.
## Requirements
### Requirement: Already-added projects MUST be visually disabled and non-selectable

When the "Select Project Directory" dialog opens, rows whose absolute path equals a cwd already tracked in `ProjectContext` SHALL render in a disabled visual state (reduced opacity + `cursor-not-allowed`) and MUST ignore left-click and double-click. Highlight state and `onSelect` MUST NOT fire for disabled rows.

#### Scenario: User clicks a row that's already a project
- **WHEN** the user left-clicks a tree row whose path is in `addedProjectCwds`
- **THEN** the row's highlighted state does not change AND the dialog does not call `onSelect`

#### Scenario: Existing highlight persists when a disabled row is clicked
- **WHEN** the user has highlighted a non-disabled row, then clicks a disabled row
- **THEN** the previous highlight (and the path shown in the dialog header) is preserved AND `onSelect` is not invoked for the disabled row's path

### Requirement: Confirm button label MUST match the action verb

The dialog's primary confirm button SHALL read "Add" — the verb that matches
`projects:add`. The legacy "Open" label MUST NOT appear.

#### Scenario: Confirm button is rendered
- **WHEN** the dialog is open
- **THEN** the primary action button is labelled "Add"

### Requirement: Right-click CRUD menu MUST work inside the dialog

The dialog's embedded `<FileTree>` SHALL surface the same Radix ContextMenu used
elsewhere in the app: New file… / New folder… / Rename… / Delete (file-only
options like "Open in New Tab" are gated as in the standalone tree).

#### Scenario: User right-clicks a directory in the dialog tree
- **WHEN** the user right-clicks a directory row in the dialog
- **THEN** the context menu appears with at least: New file…, New folder…, Rename…, Delete

#### Scenario: User picks "New folder…" from the dialog tree
- **WHEN** the user selects "New folder…" from the right-click menu
- **THEN** the existing `NewEntryDialog` opens scoped to that directory

