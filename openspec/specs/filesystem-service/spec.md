# filesystem-service Specification

## Purpose
TBD - created by archiving change filesystem-service. Update Purpose after archive.
## Requirements
### Requirement: FilesystemService interface SHALL define filesystem operations

FilesystemService interface SHALL provide three methods: `browseDirectories`, `listFiles`, `readFile`. All handlers that perform filesystem operations SHALL use this interface instead of direct fs API calls.

#### Scenario: Handler uses FilesystemService instead of direct fs calls
- **WHEN** explorer handler processes `explorer:browse` event
- **THEN** it calls `FilesystemService.browseDirectories()` instead of `readdirSync`

#### Scenario: File handler uses FilesystemService
- **WHEN** file handler processes `file:list` or `file:read` event
- **THEN** it calls `FilesystemService.listFiles()` or `FilesystemService.readFile()` instead of `globSync`/`readFileSync`

### Requirement: browseDirectories SHALL list child directories with filtering

`browseDirectories(path?)` SHALL return filtered, sorted child directories. When path is omitted, it SHALL return the configured explorer roots.

- Hidden directories (`.` prefix) SHALL be excluded
- Ignored directories (`node_modules`, `.git`, `dist`, `coverage`) SHALL be excluded
- Symlink directories SHALL be excluded
- Results SHALL be sorted alphabetically by name
- Path validation SHALL reject paths outside allowed roots
- Permission errors SHALL return empty array (no throw)

#### Scenario: Browse without path returns roots
- **WHEN** `browseDirectories()` is called without path
- **THEN** it returns the configured explorer roots as directory entries

#### Scenario: Browse with valid path returns filtered children
- **WHEN** `browseDirectories('/projects/my-app')` is called
- **THEN** it returns non-hidden, non-ignored, non-symlink child directories sorted alphabetically

#### Scenario: Path outside roots returns empty
- **WHEN** `browseDirectories('/etc')` is called and `/etc` is not under any root
- **THEN** it returns `[]`

### Requirement: listFiles SHALL support glob and fuzzy search

`listFiles(cwd, pattern)` SHALL list files in cwd matching the pattern. It SHALL support three modes: empty pattern (root listing), directory listing (trailing `/`), and fuzzy search.

#### Scenario: Empty pattern lists root entries
- **WHEN** `listFiles(cwd, '')` is called
- **THEN** it returns root-level directories and files in cwd

#### Scenario: Trailing slash lists directory contents
- **WHEN** `listFiles(cwd, 'src/')` is called
- **THEN** it returns entries inside `src/` directory

#### Scenario: Other patterns do fuzzy search
- **WHEN** `listFiles(cwd, 'session-connect')` is called
- **THEN** it returns fuzzy-matched files and directories

### Requirement: readFile SHALL read file content with path protection

`readFile(cwd, filePath)` SHALL read file content and prevent path traversal outside cwd.

#### Scenario: Valid file path returns content
- **WHEN** `readFile(cwd, 'src/index.ts')` is called and file exists
- **THEN** it returns `{ content: '...' }`

#### Scenario: Path traversal returns error
- **WHEN** `readFile(cwd, '../../etc/passwd')` is called
- **THEN** it returns `{ error: 'Path traversal not allowed' }`

#### Scenario: Non-existent file returns error
- **WHEN** `readFile(cwd, 'does-not-exist.ts')` is called
- **THEN** it returns `{ error: 'File not found: does-not-exist.ts' }`

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

