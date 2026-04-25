# filesystem-service Specification

## Purpose
TBD - created by archiving change filesystem-service. Update Purpose after archive.
## Requirements
### Requirement: FilesystemService interface SHALL define filesystem operations

FilesystemService interface SHALL provide three async methods: `browseDirectories`, `listFiles`, `readFile`. All methods SHALL return `Promise<>`. All handlers that perform filesystem operations SHALL use this interface instead of direct fs API calls.

#### Scenario: Handler uses FilesystemService instead of direct fs calls
- **WHEN** explorer handler processes `explorer:browse` event
- **THEN** it awaits `FilesystemService.browseDirectories()` instead of calling `readdirSync`

#### Scenario: File handler uses FilesystemService
- **WHEN** file handler processes `file:list` or `file:read` event
- **THEN** it awaits `FilesystemService.listFiles()` or `FilesystemService.readFile()` instead of `globSync`/`readFileSync`

### Requirement: browseDirectories SHALL list child directories with filtering

`browseDirectories(path?)` SHALL return `Promise<DirectoryEntry[]>` with filtered, sorted child directories. When path is omitted, it SHALL return the configured explorer roots.

- Hidden directories (`.` prefix) SHALL be excluded
- Ignored directories (`node_modules`, `.git`, `dist`, `coverage`) SHALL be excluded
- Symlink directories SHALL be excluded
- Results SHALL be sorted alphabetically by name
- Path validation SHALL reject paths outside allowed roots
- Permission errors SHALL return empty array (no throw)

#### Scenario: Browse without path returns roots
- **WHEN** `await browseDirectories()` is called without path
- **THEN** it resolves with the configured explorer roots as directory entries

#### Scenario: Browse with valid path returns filtered children
- **WHEN** `await browseDirectories('/projects/my-app')` is called
- **THEN** it resolves with non-hidden, non-ignored, non-symlink child directories sorted alphabetically

#### Scenario: Path outside roots returns empty
- **WHEN** `await browseDirectories('/etc')` is called and `/etc` is not under any root
- **THEN** it resolves with `[]`

### Requirement: listFiles SHALL support glob and fuzzy search

`listFiles(cwd, pattern)` SHALL return `Promise<FileResult[]>`. It SHALL support three modes: empty pattern (root listing), directory listing (trailing `/`), and fuzzy search.

#### Scenario: Empty pattern lists root entries
- **WHEN** `await listFiles(cwd, '')` is called
- **THEN** it resolves with root-level directories and files in cwd

#### Scenario: Trailing slash lists directory contents
- **WHEN** `await listFiles(cwd, 'src/')` is called
- **THEN** it resolves with entries inside `src/` directory

#### Scenario: Other patterns do fuzzy search
- **WHEN** `await listFiles(cwd, 'session-connect')` is called
- **THEN** it resolves with fuzzy-matched files and directories

### Requirement: readFile SHALL read file content with path protection

`readFile(cwd, filePath)` SHALL return `Promise<ReadFileResult>` and prevent path traversal outside cwd.

#### Scenario: Valid file path returns content
- **WHEN** `await readFile(cwd, 'src/index.ts')` is called and file exists
- **THEN** it resolves with `{ content: '...' }`

#### Scenario: Path traversal returns error
- **WHEN** `await readFile(cwd, '../../etc/passwd')` is called
- **THEN** it resolves with `{ error: 'Path traversal not allowed' }`

#### Scenario: Non-existent file returns error
- **WHEN** `await readFile(cwd, 'does-not-exist.ts')` is called
- **THEN** it resolves with `{ error: 'File not found: does-not-exist.ts' }`

### Requirement: FilesystemService SHALL be injectable via constructor parameter

Handlers SHALL receive FilesystemService as a constructor/create parameter. Server SHALL instantiate the service and pass it to handlers during registration.

#### Scenario: Server passes FilesystemService to handlers
- **WHEN** server registers handlers in `register()` method
- **THEN** explorer and file handlers receive a FilesystemService instance

### Requirement: Socket event APIs SHALL remain unchanged

All existing socket events (`explorer:browse`, `file:list`, `file:read`) SHALL maintain identical request/response formats. This is a pure internal refactoring.

#### Scenario: explorer:browse response format unchanged
- **WHEN** client sends `explorer:browse` after refactoring
- **THEN** response format is identical to before

#### Scenario: file:list response format unchanged
- **WHEN** client sends `file:list` after refactoring
- **THEN** response format is identical to before

### Requirement: Filesystem service supports create / delete / rename / copy / move

`FilesystemService` SHALL expose five mutation methods, each guarded by the existing explorer-roots boundary used by `readFileAbsolute` / `writeFileAbsolute`. Operations refuse paths that escape any configured root, contain `..` segments, or would overwrite existing destinations (for create / rename / copy / move). All five return a tagged `{ ok: true } | { error: string }` result and never throw on user-input errors.

#### Scenario: create a new file
- **WHEN** `create(path, 'file')` is called for an absolute path under an explorer root, with parent existing and the target absent
- **THEN** an empty file is created at `path` and the result is `{ ok: true }`

#### Scenario: create a new directory
- **WHEN** `create(path, 'directory')` is called for a path whose parent exists and target is absent
- **THEN** a directory is created at `path` and the result is `{ ok: true }`

#### Scenario: create rejects existing target
- **WHEN** `create(path, kind)` is called for a path that already exists
- **THEN** the result is `{ error: 'exists' }` and no filesystem mutation occurs

#### Scenario: delete a file
- **WHEN** `delete(path)` is called for an existing file
- **THEN** the file is removed and the result is `{ ok: true }`

#### Scenario: delete a directory recursively
- **WHEN** `delete(path)` is called for a non-empty directory
- **THEN** the directory and all descendants are removed; result is `{ ok: true }`

#### Scenario: rename within same directory
- **WHEN** `rename(from, to)` is called and `from` exists, `to` does not, and both share the same parent directory under an explorer root
- **THEN** the entry is renamed and result is `{ ok: true }`

#### Scenario: rename rejects collision
- **WHEN** `rename(from, to)` and `to` already exists
- **THEN** result is `{ error: 'exists' }` and no rename occurs

#### Scenario: copy a file
- **WHEN** `copy(from, to)` for an existing file with `to` absent
- **THEN** a byte-identical copy is created at `to`; result `{ ok: true }`

#### Scenario: copy a directory recursively
- **WHEN** `copy(from, to)` for a directory tree
- **THEN** the entire subtree is reproduced under `to`; result `{ ok: true }`

#### Scenario: move across parents
- **WHEN** `move(from, to)` and `from` exists, `to` is absent, both under explorer roots (parents may differ)
- **THEN** the entry is moved (atomic when same volume, copy+delete when crossing) and result is `{ ok: true }`

#### Scenario: any mutation rejects path traversal
- **WHEN** any of the five methods receives a path containing `..` or pointing outside explorer roots
- **THEN** the result is `{ error: 'Path outside explorer roots' }` (or `'Invalid path'`) and no filesystem operation runs

