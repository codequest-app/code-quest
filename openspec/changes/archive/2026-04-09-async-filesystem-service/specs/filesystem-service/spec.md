## MODIFIED Requirements

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
