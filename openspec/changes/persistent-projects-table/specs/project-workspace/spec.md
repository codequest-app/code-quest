## MODIFIED Requirements

### Requirement: Project lifecycle MUST be independent of session lifecycle

Projects exist as persistent entities in the `projects` table. They are created when a session opens in a new path (via upsert by canonical path) and are NOT removed when sessions close. Project metadata (name, pinned, color, lastOpenedAt) survives across server restarts and session deletions.

#### Scenario: Project survives session close

- **GIVEN** a project `cc-office` exists in the `projects` table with one active session
- **WHEN** the session is closed and removed
- **THEN** the project entry remains in the table
- **AND** subsequent `projects:list` includes `cc-office`

#### Scenario: Project deduplication by canonical path

- **GIVEN** sessions at `/Users/x/cc-office` and `~/cc-office` (where `~` resolves to `/Users/x`)
- **WHEN** both sessions are created
- **THEN** only one row exists in `projects` table
- **AND** `path` field is the canonical absolute form `/Users/x/cc-office`

#### Scenario: Server restart preserves project list

- **GIVEN** N projects in the `projects` table with various metadata
- **WHEN** server restarts
- **THEN** client connecting fresh receives the full list via `projects:listed`
- **AND** `pinned` / `color` / `name` overrides are preserved

### Requirement: ProjectContext MUST expose persistent project list to UI

The client `ProjectContext` MUST be the single source of truth for project list state in the UI layer. It subscribes to server-emitted `projects:*` events and exposes `projects`, `addProject`, `setActiveProject` to consumers.

#### Scenario: Adding a project from UI

- **GIVEN** a user fills in path `/path/to/foo` in AddProjectDialog
- **WHEN** `addProject('/path/to/foo')` is called
- **THEN** server upserts and emits `projects:added`
- **AND** `ProjectContext.projects` contains the new project
- **AND** the new project becomes the active project

#### Scenario: Project list updates from another tab

- **GIVEN** user has cc-office open in two browser tabs
- **WHEN** one tab adds a new project
- **THEN** the other tab's `ProjectContext.projects` reflects the addition (via socket broadcast)

### Requirement: Session creation MUST upsert project

When a session is created, the server MUST upsert the corresponding project row by canonical path and update `lastOpenedAt`. This ensures projects appear in the list as soon as they are touched, without requiring an explicit `addProject` call.

#### Scenario: First session in unfamiliar directory creates project

- **GIVEN** no row in `projects` table for path `/path/to/new-project`
- **WHEN** a session is created with cwd `/path/to/new-project`
- **THEN** server INSERTs a new project row with name = `new-project`, pinned = false
- **AND** emits `projects:added`

#### Scenario: Session in existing project updates lastOpenedAt

- **GIVEN** a project exists with `lastOpenedAt = 2025-01-01`
- **WHEN** a new session is created in that project
- **THEN** server UPDATEs `lastOpenedAt = now()`
- **AND** emits `projects:updated`
- **AND** other project fields (name, pinned, color) are unchanged

## ADDED Requirements

### Requirement: Project removal MUST be rejected when sessions are active

To prevent accidental data loss, the server MUST reject `projects:remove` requests when one or more sessions in the project have non-terminal state.

#### Scenario: Reject removal of project with active session

- **GIVEN** a project with an `active` session
- **WHEN** client emits `projects:remove` for that project
- **THEN** server returns error `{ error: 'project_has_active_sessions', activeSessionCount: 1 }`
- **AND** project is NOT removed
- **AND** no `projects:removed` event is emitted

#### Scenario: Allow removal when all sessions terminated

- **GIVEN** a project with only terminated sessions (or no sessions)
- **WHEN** client emits `projects:remove`
- **THEN** server deletes the project row
- **AND** emits `projects:removed`

### Requirement: projects:add MUST validate path before persisting

The server-side `projects:add` handler MUST verify that the supplied path exists and is a directory before calling `ProjectStore.upsert`. Validation failures return structured errors and do NOT persist or emit events.

#### Scenario: Reject add for non-existent path

- **GIVEN** path `/does/not/exist` does not exist on filesystem
- **WHEN** client emits `projects:add` with that path
- **THEN** server returns `{ error: 'path_not_found', path: '/does/not/exist' }`
- **AND** no row is inserted in `projects` table
- **AND** no `projects:added` event is emitted

#### Scenario: Reject add for file path

- **GIVEN** path `/etc/hosts` is a file (not a directory)
- **WHEN** client emits `projects:add` with that path
- **THEN** server returns `{ error: 'path_not_directory', path: '/etc/hosts' }`
- **AND** no row is inserted

#### Scenario: Canonicalize path before validation and storage

- **GIVEN** client sends path `~/cc-office`
- **WHEN** `projects:add` is processed
- **THEN** server expands `~` to `os.homedir()` (e.g. `/Users/x/cc-office`)
- **AND** stores the canonical absolute path in `projects.path`

### Requirement: Project schema MUST support metadata fields

The `projects` table MUST include the following columns to support future UI features (Top scope switcher, Pinned/Recent groups, color-coded project identification):

- `id` (uuid, primary key)
- `path` (text, unique, canonical absolute path)
- `name` (text, default = basename(path), user-overridable)
- `pinned` (boolean, default false)
- `color` (text nullable, hex color #RRGGBB)
- `lastOpenedAt` (timestamp ISO8601)
- `createdAt` (timestamp ISO8601)

#### Scenario: Update project name

- **GIVEN** a project with name = `cc-office` (default from basename)
- **WHEN** client emits `projects:update` with `{ id, patch: { name: 'CC Office' } }`
- **THEN** server updates `name` to `CC Office`
- **AND** emits `projects:updated`

#### Scenario: Pin a project

- **GIVEN** a project with pinned = false
- **WHEN** client emits `projects:update` with `{ id, patch: { pinned: true } }`
- **THEN** server updates `pinned = true`
- **AND** subsequent `projects:list` orders pinned projects first
