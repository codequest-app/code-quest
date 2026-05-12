## ADDED Requirements

### Requirement: listFiles cwd root guard

`LocalFilesystemService.listFiles(cwd, pattern)` SHALL validate `cwd` against fsRoots before scanning.

#### Scenario: listFiles with cwd inside roots
- **WHEN** `listFiles` is called with a `cwd` that is within fsRoots
- **THEN** files are returned normally

#### Scenario: listFiles with cwd outside roots
- **WHEN** `listFiles` is called with a `cwd` outside all fsRoots
- **THEN** `PathOutsideRootsError` is thrown

#### Scenario: listFiles with cwd traversal (../../)
- **WHEN** `listFiles` is called with `cwd` containing `../..` that resolves outside fsRoots
- **THEN** `PathOutsideRootsError` is thrown

---

### Requirement: readFile cwd root guard

`LocalFilesystemService.readFile(cwd, filePath)` SHALL validate `cwd` against fsRoots in addition to the existing filePath-relative-to-cwd check.

#### Scenario: readFile with cwd inside roots
- **WHEN** `readFile` is called with a `cwd` within fsRoots and a valid relative `filePath`
- **THEN** file content is returned

#### Scenario: readFile with cwd outside roots
- **WHEN** `readFile` is called with `cwd` outside all fsRoots
- **THEN** an error result is returned (not a throw)

#### Scenario: readFile with filePath escaping cwd
- **WHEN** `readFile` is called with `filePath` that resolves outside `cwd` (e.g. `../../etc/passwd`)
- **THEN** an error result is returned

---

### Requirement: git diff untracked path guard

`git.diff(cwd, filePath, "??")` SHALL reject `filePath` values that resolve outside `cwd`.

#### Scenario: untracked diff with safe path
- **WHEN** `diff` is called with a `filePath` that stays within `cwd`
- **THEN** file content is read and a pseudo-diff is returned

#### Scenario: untracked diff with traversal path
- **WHEN** `diff` is called with `filePath` containing `../../` that escapes `cwd`
- **THEN** an empty diff is returned (read is skipped)

---

### Requirement: listFiles cache invalidation in summoner daemon

The summoner daemon's `LocalFilesystemService` SHALL receive a `LocalWatchService` so that `listFiles` cache entries are invalidated on file system changes.

#### Scenario: file change triggers cache invalidation
- **WHEN** a file within `cwd` changes after `listFiles` was cached
- **THEN** the next `listFiles` call rebuilds the cache
