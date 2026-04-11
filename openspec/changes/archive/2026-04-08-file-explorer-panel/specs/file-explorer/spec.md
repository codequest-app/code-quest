## ADDED Requirements

### Requirement: Server SHALL provide directory browsing via `explorer:browse` event

Server SHALL handle `explorer:browse` socket event without requiring a channel binding. The event accepts an optional `path` parameter and returns a list of direct child directories at that path.

- When `path` is omitted or empty, server SHALL return the configured root directories
- When `path` is a valid directory, server SHALL return its direct child directories (non-recursive)
- Response format: `{ directories: Array<{ name: string; path: string }> }`
- Directories SHALL be sorted alphabetically by name
- Server SHALL NOT return files, only directories

#### Scenario: Browse without path returns roots
- **WHEN** client emits `explorer:browse` with no `path`
- **THEN** server responds with the list of configured root directories (from `FILE_EXPLORER_ROOTS` or home directory)

#### Scenario: Browse a valid directory
- **WHEN** client emits `explorer:browse` with `path: '/Users/user/projects'`
- **THEN** server responds with `{ directories }` containing direct child directories sorted alphabetically

#### Scenario: Browse an empty directory
- **WHEN** client emits `explorer:browse` with a path that contains no subdirectories
- **THEN** server responds with `{ directories: [] }`

### Requirement: Server SHALL filter out hidden and ignored directories

Server SHALL exclude directories starting with `.` (hidden) and common noise directories (`node_modules`, `dist`, `coverage`, `.git`) from browse results.

#### Scenario: Hidden directories excluded
- **WHEN** client browses a directory containing `.hidden/`, `node_modules/`, and `src/`
- **THEN** server responds with only `src/` in the directories list

### Requirement: Server SHALL enforce path security via allowed roots

Server SHALL read `FILE_EXPLORER_ROOTS` environment variable (comma-separated paths) to determine allowed browsing scope. If not set, server SHALL default to the user's home directory.

- Every browse request path MUST resolve to a descendant of at least one allowed root
- Paths that fail validation SHALL return `{ directories: [] }` without error details
- Server SHALL resolve paths to absolute form before validation (no `..` traversal bypass)

#### Scenario: Path within allowed root succeeds
- **WHEN** `FILE_EXPLORER_ROOTS=/Users/user/projects` and client browses `/Users/user/projects/cc-office`
- **THEN** server responds with the directory's children normally

#### Scenario: Path outside allowed root returns empty
- **WHEN** `FILE_EXPLORER_ROOTS=/Users/user/projects` and client browses `/etc/passwd/..`
- **THEN** server responds with `{ directories: [] }`

#### Scenario: Path traversal attempt blocked
- **WHEN** client browses `/Users/user/projects/../../etc`
- **THEN** server resolves to `/etc`, finds it outside allowed roots, and responds with `{ directories: [] }`

#### Scenario: No env var defaults to home directory
- **WHEN** `FILE_EXPLORER_ROOTS` is not set
- **THEN** server uses the user's home directory as the single allowed root

### Requirement: Server SHALL handle unreadable directories gracefully

Server SHALL catch permission errors and other filesystem exceptions when reading directories, returning empty results instead of throwing.

#### Scenario: Permission denied on directory
- **WHEN** client browses a directory the server process cannot read
- **THEN** server responds with `{ directories: [] }`

### Requirement: Server SHALL skip symlink directories

Server SHALL exclude symbolic link directories from browse results to prevent symlink loops and unexpected traversal.

#### Scenario: Symlink directory excluded
- **WHEN** a directory contains a symlink pointing to another directory
- **THEN** server excludes the symlink from the browse response

### Requirement: Shared package SHALL define explorer event schemas

Shared package SHALL export Zod schemas for the `explorer:browse` request and response payloads.

- `explorerBrowsePayloadSchema`: `{ path?: string }`
- `explorerBrowseResponseSchema`: `{ directories: Array<{ name: string; path: string }> }`

#### Scenario: Valid payload passes schema validation
- **WHEN** payload `{ path: '/some/dir' }` is validated against `explorerBrowsePayloadSchema`
- **THEN** validation succeeds

#### Scenario: Empty payload passes schema validation
- **WHEN** payload `{}` is validated against `explorerBrowsePayloadSchema`
- **THEN** validation succeeds (path is optional)

### Requirement: Client SHALL display a File Explorer panel with lazy-loaded directory tree

Client SHALL render a FileExplorerPanel component that displays a tree of directories. Each level of the tree SHALL be loaded on demand when the user expands a directory node.

- Initial state: show root directories (fetched via `explorer:browse` with no path)
- Expanding a node: fetch children via `explorer:browse({ path })`
- Collapsing a node: toggle visibility, preserve cached children
- Loading state: show spinner or indicator while fetching

#### Scenario: Initial load shows root directories
- **WHEN** FileExplorerPanel mounts
- **THEN** it emits `explorer:browse({})` and renders the returned directories as root-level tree nodes

#### Scenario: Expand a directory node
- **WHEN** user single-clicks a collapsed directory node
- **THEN** panel emits `explorer:browse({ path })` and renders children under the node with expand animation

#### Scenario: Collapse a directory node
- **WHEN** user single-clicks an expanded directory node
- **THEN** panel hides children but preserves them in state (no re-fetch on next expand)

#### Scenario: Loading indicator during fetch
- **WHEN** user expands a node and fetch is in progress
- **THEN** panel shows a loading indicator for that node

### Requirement: Double-click directory SHALL open new tab with that cwd

When user double-clicks a directory node in the File Explorer, the system SHALL create a new tab with that directory as the working directory.

#### Scenario: Double-click opens new tab
- **WHEN** user double-clicks directory node `/Users/user/projects/my-app`
- **THEN** system calls `createNewTab({ cwd: '/Users/user/projects/my-app' })` and the new tab launches a Claude session in that directory

### Requirement: Right-click directory SHALL show context menu with "Open in New Tab"

When user right-clicks a directory node, the system SHALL display a context menu with at least "Open in New Tab" option.

#### Scenario: Right-click shows context menu
- **WHEN** user right-clicks a directory node
- **THEN** a context menu appears at the cursor position with "Open in New Tab" option

#### Scenario: Selecting "Open in New Tab" opens new tab
- **WHEN** user selects "Open in New Tab" from the context menu
- **THEN** system creates a new tab with that directory as cwd (same as double-click behavior)

#### Scenario: Context menu dismisses on outside click
- **WHEN** context menu is open and user clicks outside it
- **THEN** context menu closes without action

### Requirement: File Explorer SHALL display Recents section

File Explorer panel SHALL display a "Recents" section below the directory tree, showing recently used working directories. Recents SHALL be stored in localStorage.

- Maximum 10 entries, ordered by most recent first
- Each entry shows the directory path
- Double-click or right-click + "Open in New Tab" SHALL open a new tab with that cwd
- A new entry SHALL be added when user opens a tab via the File Explorer (not for server-initiated sessions)

#### Scenario: Recents displayed on panel load
- **WHEN** FileExplorerPanel mounts and localStorage contains recent cwds
- **THEN** Recents section displays stored entries ordered by most recently used

#### Scenario: New recent entry added on tab creation
- **WHEN** user double-clicks a directory to open a new tab
- **THEN** that directory path is added to recents (or moved to top if already present)

#### Scenario: Recents capped at 10 entries
- **WHEN** a new entry is added and there are already 10 entries
- **THEN** the oldest entry is removed

#### Scenario: Double-click recent item opens tab
- **WHEN** user double-clicks a path in the Recents section
- **THEN** system creates a new tab with that cwd
