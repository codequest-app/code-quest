## ADDED Requirements

### Requirement: File / folder rows expose CRUD actions via context menu

Each row in `FileTree` SHALL render a Radix `<ContextMenu>` (right-click trigger) containing CRUD items: `New file…`, `New folder…`, `Rename…`, `Duplicate`, `Delete`, plus the existing `Open in New Tab`. New-file / new-folder items create siblings of the right-clicked row (or children, when the row is a directory).

#### Scenario: Right-click a file row opens menu
- **WHEN** the user right-clicks a file row
- **THEN** a context menu opens with all CRUD items + `Open in New Tab`

#### Scenario: New file inside a directory
- **WHEN** the user right-clicks a directory row and selects `New file…`
- **THEN** an inline-edit input or naming dialog appears scoped to that directory; submit creates the file under that directory

#### Scenario: New file alongside a file
- **WHEN** the user right-clicks a file row and selects `New file…`
- **THEN** the new file is created in the right-clicked file's parent directory

#### Scenario: Rename uses inline edit
- **WHEN** the user selects `Rename…` on a row
- **THEN** the row's label becomes editable in-place; pressing Enter calls `fs:rename` with the typed name; pressing Esc cancels

#### Scenario: Duplicate auto-names
- **WHEN** the user selects `Duplicate` on `foo.ts`
- **THEN** the RPC `fs:copy` is invoked targeting `foo copy.ts` (with numeric suffix incrementing if that name exists)

#### Scenario: Delete on a file confirms
- **WHEN** the user selects `Delete` on a file row
- **THEN** a Radix Dialog confirms `Delete <name>?` with Cancel + Delete (danger) buttons; only after confirm does `fs:delete` fire

#### Scenario: Delete on a directory confirms with descendant count
- **WHEN** the user selects `Delete` on a non-empty directory row
- **THEN** the confirm dialog shows the descendant file count (e.g. `Delete src/ and 12 files inside?`)

#### Scenario: Tree refreshes after a successful mutation
- **WHEN** any CRUD RPC returns `{ ok: true }`
- **THEN** the existing `files:dirty` broadcast (already wired) refreshes the affected directory in the tree without manual invalidation
