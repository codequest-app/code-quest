# files-pane Specification

## Purpose
TBD - created by archiving change files-pane-icons-by-extension. Update Purpose after archive.
## Requirements
### Requirement: File rows render an extension-appropriate icon

Each file row in `FileTree` SHALL render a leading icon chosen by the file's filename or extension. The lookup MUST resolve in this order: (1) exact filename match (e.g. `package.json` → JSON-with-Node-style icon), (2) extension match (e.g. `.ts` → TypeScript icon), (3) generic file-icon fallback. Folder rows continue to use the chevron expand/collapse icon — per-folder type icons are not part of this change.

#### Scenario: TypeScript file
- **WHEN** a file row is rendered for `foo.ts`
- **THEN** the leading icon is the TypeScript icon from the chosen icon set

#### Scenario: Filename match wins over extension
- **WHEN** a file row is rendered for `package.json`
- **THEN** the leading icon is the package-specific icon, not the generic JSON icon

#### Scenario: Unknown extension falls back to generic
- **WHEN** a file row is rendered for `mystery.xyz`
- **THEN** the leading icon is the generic file icon (no error / blank)

#### Scenario: Folder row keeps chevron
- **WHEN** a directory row is rendered
- **THEN** the leading icon is the existing expand/collapse chevron, not a folder-type icon

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

