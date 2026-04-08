# fake-summoner Specification

## Purpose
TBD - created by archiving change fake-summoner-test-infra. Update Purpose after archive.
## Requirements
### Requirement: FakeSummoner SHALL provide filesystem and claude as hardcoded domains

FakeSummoner SHALL expose `.filesystem` as a property (shared FakeFilesystemService instance) and `.claude()` as a factory method (returns FakeClaude per call). These are hardcoded domains matching summoner's production structure.

#### Scenario: Access filesystem service
- **WHEN** test creates `const summoner = createFakeSummoner()`
- **THEN** `summoner.filesystem` is a `FakeFilesystemService` instance

#### Scenario: Create Claude client
- **WHEN** test calls `summoner.claude()`
- **THEN** it returns a `FakeClaude` instance connected to the shared server

#### Scenario: Multiple Claude clients share same server
- **WHEN** test calls `summoner.claude()` twice
- **THEN** both FakeClaude instances connect to the same server and can see each other's events

### Requirement: FakeFilesystemService SHALL implement FilesystemService in-memory

FakeFilesystemService SHALL implement the `FilesystemService` interface without touching the real filesystem. It SHALL provide setup methods for tests to configure the fake filesystem state.

#### Scenario: Setup roots and browse
- **WHEN** test calls `summoner.filesystem.setRoots(['/projects'])` then a client sends `explorer:browse` with no path
- **THEN** server returns `[{ name: 'projects', path: '/projects' }]`

#### Scenario: Setup directories and browse children
- **WHEN** test calls `summoner.filesystem.addDirectory('/projects', ['app', 'blog'])` then a client sends `explorer:browse` with path `/projects`
- **THEN** server returns `[{ name: 'app', path: '/projects/app' }, { name: 'blog', path: '/projects/blog' }]`

#### Scenario: Setup files and read
- **WHEN** test calls `summoner.filesystem.addFile('/projects/app/index.ts', 'export {}')` then a client sends `file:read` with filePath `index.ts` and cwd `/projects/app`
- **THEN** server returns `{ content: 'export {}' }`

#### Scenario: Browse non-existent path returns empty
- **WHEN** client sends `explorer:browse` with a path that was not added
- **THEN** server returns `{ directories: [] }`

#### Scenario: Reset clears all state
- **WHEN** test calls `summoner.filesystem.reset()`
- **THEN** all roots, directories, and files are cleared

### Requirement: FakeClaude SHALL hide socket as internal detail

FakeClaude SHALL NOT expose its socket as a public property. All socket communication SHALL go through FakeClaude's public API methods.

#### Scenario: FakeClaude has no public socket property
- **WHEN** test accesses a FakeClaude instance
- **THEN** there is no `socket` property on the public interface

#### Scenario: send() works without socket access
- **WHEN** test calls `claude.send('explorer:browse', { path: '/projects' })`
- **THEN** it sends the event through the internal socket and returns the server response

### Requirement: FakeClaude from summoner.claude() SHALL have full API

FakeClaude returned by `summoner.claude()` SHALL provide the same public API as the current FakeClaude: `initialize()`, `emit()`, `send()`, `received()`, `prepareInit()`, `handle`, `onControlRequest()`.

#### Scenario: Initialize session
- **WHEN** test calls `claude.initialize()`
- **THEN** it triggers session:launch, auto-responds to CLI init, and returns channelId

#### Scenario: Emit CLI segment
- **WHEN** test calls `claude.emit(segment)`
- **THEN** the segment is pushed through the CLI process pipeline

#### Scenario: Check received messages
- **WHEN** test calls `claude.received('user_message')`
- **THEN** it returns messages the server sent to the CLI process

### Requirement: createFakeClaude() SHALL remain backward-compatible

The existing `createFakeClaude()` function (no arguments) SHALL continue to work by internally creating a FakeSummoner and returning `summoner.claude()`.

#### Scenario: Existing tests work without changes
- **WHEN** existing test calls `createFakeClaude()` with no arguments
- **THEN** behavior is identical to before the refactoring

### Requirement: Server SHALL accept FilesystemService via DI

Server SHALL obtain FilesystemService from the DI container instead of directly instantiating `LocalFilesystemService`. This allows tests to inject `FakeFilesystemService`.

#### Scenario: Production uses LocalFilesystemService
- **WHEN** server starts in production
- **THEN** container provides `LocalFilesystemService` bound to `TYPES.FilesystemService`

#### Scenario: Test overrides with FakeFilesystemService
- **WHEN** test creates container with `filesystemService` override
- **THEN** container provides the fake instance for `TYPES.FilesystemService`

### Requirement: Multi-window tests SHALL use summoner.claude() multiple times

Multi-window test scenarios SHALL create multiple FakeClaude instances via `summoner.claude()` instead of `claude.connect()`. Each FakeClaude SHALL have the full API.

#### Scenario: Two windows, one session
- **WHEN** `claudeA = summoner.claude()` initializes a session, then `claudeB = summoner.claude()` joins
- **THEN** both receive events from the shared session

#### Scenario: Window B receives broadcast events
- **WHEN** claudeA sends a message and CLI emits assistant response
- **THEN** claudeB receives the assistant message event

