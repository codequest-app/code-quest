# protocol Specification

## Purpose

定義 client ↔ server 之間所有 Socket.IO 事件的 TypeScript 型別與 Zod 驗證 schema。

**核心模組**

`socket-events.ts` 定義兩個 interface：

- **ClientToServerEvents**：session:launch / join / close、chat:send / cancel / respond / stop_task / set_fast_mode、settings:set_model / set_permission_mode / set_thinking_level、rewind_code / cancel_request / hook_callback_respond、mcp:*、plugin:*、file:read / git:* / plan:* 等。
- **ServerToClientEvents**：session:created / closed / dead / init / status、message:assistant / user / result、stream:chunk / end / text / block_start、control:permission / elicitation / diff_review / cancel / hook_callback、system:hook_started / hook_response / task_started / compact_boundary / rate_limit / available_models、notification:toast / show / auth_url、state:update / usage 等。

`event-types.ts` 定義 `ContentBlock`（TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock）、`SessionStats`、`UpdateStatePayload`、`ModelInfo`、`AccountInfo`。

`schemas/` 下 60+ Zod schemas 覆蓋所有 payload，分為 session / message / control / settings / mcp / plugin 等檔案。

**Action / 錯誤事件**：`action:open_url`、`action:open_file`、`error:message`、`raw:event` (catch-all)。

**MCP 特殊型別**：`ChromeMcpState`、`DebuggerMcpState`、`JupyterMcpState`、`EnsureChromeMcpEnabledRequest/Response`、`EnableJupyterMcpRequest/Response`、`AskDebuggerHelpRequest/Response`。

**測試覆蓋**：`control-permission-response.contract.test.ts`（Permission response 格式驗證）、`launch-options.contract.test.ts`（啟動選項 schema 驗證）。

## Requirements

### Requirement: All RPC ack responses SHALL follow the RpcResult discriminated union

Every socket.io RPC (emit with callback) SHALL ack with a value matching `RpcResult<T>`:

```ts
type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
```

On success, data fields live under `data`. On failure, the error message is a user-facing string; `code` is an optional machine-readable classifier.

Fire-and-forget events (no ack callback) and broadcast events (no request-response pairing) are exempt.

#### Scenario: successful launch returns ok with channel data

- WHEN a client emits `session:launch` with a valid cwd
- THEN the ack SHALL be `{ ok: true, data: { channelId, slashCommands?, models?, account? } }`

#### Scenario: failed launch returns err with message

- WHEN `session:launch` handler throws during processing
- THEN the ack SHALL be `{ ok: false, error: <string message> }`

#### Scenario: resume reuse acks ok with existing channel

- GIVEN an alive channel for the requested sessionId
- WHEN a client emits `session:resume`
- THEN the ack SHALL be `{ ok: true, data: { channelId: <alive channelId> } }`

#### Scenario: fork rejected with unknown parent

- GIVEN no sessionStore row for the parent channelId
- WHEN a client emits `session:fork`
- THEN the ack SHALL be `{ ok: false, error: /parent session not found/ }`

#### Scenario: file:list returns ok with files array

- WHEN a client emits `file:list`
- AND the channel has a valid cwd
- THEN the ack SHALL be `{ ok: true, data: { files: FileResult[] } }`

#### Scenario: zod response schemas accept only the discriminated union shape

- GIVEN any response schema `rpcResult(T)`
- WHEN `safeParse` is called on a legacy shape `{ success: true, channelId: 'X' }`
- THEN `success` SHALL be `false`
- AND `error.issues` SHALL indicate the missing `ok` discriminator


### Requirement: `worktree:create` handler isolates rollback in a dedicated step

The server handler for `worktree:create` SHALL separate three responsibilities into named functions:
1. Project-root resolution (`resolveProjectRoot`) — rejects with a clear error when `cwd` is not inside a git repo.
2. Worktree + channel spawn (`spawnChannelInWorktree`) — creates the worktree on disk, creates the channel, broadcasts `session:created`, and on spawn failure MUST delete the freshly-created worktree to prevent orphaned filesystem state.
3. Top-level orchestration in `handleCreate` — parses the payload, composes the steps, and returns the callback with `ok`/`err`.

#### Scenario: Spawn failure triggers worktree rollback

- **WHEN** `gitService.createWorktree` succeeds but `channelManager.create` throws
- **THEN** `gitService.deleteWorktree` is called with the freshly-created worktree name
- **AND** the callback receives an `err(...)` describing the spawn failure

#### Scenario: Non-git cwd rejected before any filesystem mutation

- **WHEN** `cwd` is not inside a git repository
- **THEN** `gitService.createWorktree` is NOT called
- **AND** the callback receives `err('Not inside a git repository')`

#### Scenario: Happy path returns channel id and worktree path

- **WHEN** payload is valid, `cwd` is inside a repo, and both worktree creation and channel spawn succeed
- **THEN** the callback receives `ok({ channelId, worktreePath })`
- **AND** `session:created` is broadcast with the channel id, worktree cwd, and project root

### Requirement: Session title generation separates request, persist, and broadcast

The server module that produces session titles SHALL expose three disjoint steps:
1. Title request — sends `session:generate_title` to the CLI, validates the response with `controlGenerateTitleResponseSchema`, returns the title or `null` (on invalid / empty response).
2. Title persistence — calls `sessionStore.renameByChannelId(channelId, title)`; a persistence failure MUST be logged as a warning (`'Failed to persist session title'`) but MUST NOT block the broadcast.
3. Title broadcast — calls `channelManager.broadcastSessionState(channelId, 'idle', title)`.

The orchestrator for these steps SHALL early-return when no pending title prompt exists, clear the pending prompt before the request (to prevent duplicate requests on re-entry), and log an error (`'Failed to generate session title'`) if the request itself throws.

#### Scenario: No pending prompt — no-op

- **WHEN** `ch.pendingTitlePrompt` is `undefined`
- **THEN** no CLI request is sent, no persistence occurs, and no broadcast fires

#### Scenario: Happy path — title reaches DB and clients

- **WHEN** a pending prompt exists and the CLI returns a valid `{ title }` response
- **THEN** `ch.title` is set, `sessionStore.renameByChannelId` is called with the channel id and title, and `broadcastSessionState(channelId, 'idle', title)` fires

#### Scenario: Persistence failure does not block broadcast

- **WHEN** the CLI responds successfully but `sessionStore.renameByChannelId` rejects
- **THEN** the rejection is logged at warn level with message `'Failed to persist session title'`
- **AND** the broadcast still fires with the new title

#### Scenario: CLI error swallowed with error log

- **WHEN** `ch.sendRequest('session:generate_title', …)` throws
- **THEN** the error is logged at error level with message `'Failed to generate session title'`
- **AND** no persistence or broadcast occurs

### Requirement: Socket event names are referenced via the shared `EVENTS` constant

All code under `packages/server` and `packages/client` that registers handlers, emits, or awaits a reply on a project-defined socket event SHALL reference the event name via the `EVENTS` constant exported from `@code-quest/shared`. Bare string literals MUST NOT be used for project-defined event names.

Exemptions:
- Socket.IO transport events (`'connection'`, `'disconnect'`, `'error'`) — these are library-level and not part of the project protocol.
- Test fixtures explicitly asserting on the wire-level string (if any) — these remain as literals but MUST assert equality with `EVENTS.*` to pin the binding.

#### Scenario: Typo in an event name fails at type-check time

- **WHEN** a developer writes `socket.emit(EVENTS.session.lsit, …)` (typo)
- **THEN** TypeScript reports a missing-property error at build time, before runtime

#### Scenario: Rename of an event updates every caller via the constant

- **WHEN** `EVENTS.chat.rewind_code` is renamed to `EVENTS.chat.rewindCode` in the shared module
- **THEN** TypeScript flags every call site that still references the old key

### Requirement: `EVENTS` mirrors the existing typed socket signature

The `EVENTS` tree SHALL cover every event name currently listed in the typed socket/emitter signatures exported from `packages/shared/src/socket-events.ts`. The project MUST NOT accept a state where a typed signature references an event name that is not also present in `EVENTS`.

#### Scenario: Adding a new protocol event requires adding to `EVENTS`

- **WHEN** a new event name is introduced in a typed socket/emitter signature
- **THEN** the corresponding `EVENTS.<ns>.<name>` key MUST be added in the same change, or TypeScript rejects the addition

### Requirement: MCP request handlers share a single factory

Handlers in `packages/server/src/socket/handlers/mcp.ts` that follow the pattern "validate payload → `ch.sendRequest` → translate CLI response → callback" SHALL be constructed via the shared `createRequestHandler` factory, not hand-written. The factory SHALL support at minimum:

- `schema` — Zod schema used to validate the incoming payload.
- `event` — CLI request event name to dispatch.
- `errorMessage` — prefix used when wrapping thrown exceptions.
- `mapParsed?` — transform the parsed payload before sending (optional).
- `mapSuccess?` — transform the CLI response before callback; when set, success path wraps the result in `ok(mapSuccess(response))` and failure path wraps in `err(result.error ?? errorMessage)`.

#### Scenario: Authentication handler uses the factory

- **WHEN** the `mcp:authenticate` handler receives a valid payload and the CLI returns `{ success: true, response: { authUrl } }`
- **THEN** the callback receives `ok({ authUrl })` with the same URL (or `undefined` when not present), identical to the pre-refactor behaviour

#### Scenario: Authentication failure path preserved

- **WHEN** the CLI returns `{ success: false, error }` for an auth-style MCP request
- **THEN** the callback receives `err(error)` (or `err('Authentication failed')` when no error message is present)

#### Scenario: Invalid payload continues to short-circuit

- **WHEN** the handler receives a payload that fails Zod validation
- **THEN** the callback receives `err('Invalid payload')` and `ch.sendRequest` is not called
