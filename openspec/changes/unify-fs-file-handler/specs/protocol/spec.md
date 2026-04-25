## REMOVED Requirements

### Requirement: Channel-scoped file:read RPC
**Reason**: Duplicates `fs:read`. Server-side resolution of `channelId → Channel.cwd → fs.readFile(cwd, filePath)` is redundant once the client propagates `cwd` through `ChannelMetaContext`. Additionally, the relative-path traversal check incorrectly rejects valid out-of-cwd absolute paths from `open_file` tool results.

**Migration**: Callers switch to `fs:read({path: absolutePath})`. The `open_file` tool already provides absolute `file_path`, so no client-side `resolve(cwd, ...)` is needed.

### Requirement: Channel-scoped file:list RPC
**Reason**: Duplicates `fs:search`. The `ListFilesResponse` and `FsSearchResponse` schemas are 1:1 identical (same `{path, name, type}` shape, same `rpcResult` envelope).

**Migration**: Callers switch to `fs:search({cwd, pattern})`, sourcing `cwd` from `ChannelMetaContext`.

## ADDED Requirements

### Requirement: fs:read accepts any path within fsRoots
`fs:read` SHALL accept any absolute path validated by `FilesystemService.isWithinRoots(path)`. The handler MUST NOT impose a stricter cwd-relative constraint, because `open_file` and similar Claude tool inputs may legitimately reference paths outside the active session's cwd (e.g. `/tmp` scratch files, sibling project files).

#### Scenario: Read absolute path inside cwd
- **WHEN** client sends `fs:read({path: '/repo/src/foo.ts'})` and `/repo` is within fsRoots
- **THEN** server returns `{content: <file contents>}`.

#### Scenario: Read absolute path outside cwd but inside fsRoots
- **WHEN** client sends `fs:read({path: '/tmp/scratch.txt'})` and `/tmp` is within fsRoots
- **THEN** server returns `{content: ...}` (the previous channel-scoped `file:read` would have rejected with `'Path traversal not allowed'`).

#### Scenario: Read path outside fsRoots
- **WHEN** client sends `fs:read({path: '/etc/passwd'})` and `/etc` is NOT within fsRoots
- **THEN** server returns `{error: 'Path outside allowed roots'}`.
