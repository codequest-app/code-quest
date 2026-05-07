# Proposal: project-menu-resume

## Why

Step 1 (`remove-broken-resume`) deleted the no-op `session:resume` path. Users now have zero way to resume a dead session. We need a real resume flow that (a) starts the CLI with `--resume <sessionId>`, (b) reuses an already-alive channel for the same sessionId instead of double-spawning (CLI corrupts JSONL on concurrent writes), (c) surfaces a project-scoped picker so users can resume from the sidebar rather than typing slash commands. This change delivers the server-side plumbing + a right-click "Resume session…" menu on `ProjectCard`.

## What Changes

Shared (`packages/shared/src/schemas/session.ts`):

- Add new `sessionResumePayloadSchema = z.object({ sessionId: z.string() })`.
- Add new `sessionResumeResponseSchema = z.object({ channelId: z.string().optional(), error: z.string().optional() })`.
- Extend `sessionListPayloadSchema`: add `excludeLive?: boolean` (default `false`).
- `session:launch` payload is UNCHANGED (no `resumeSessionId` overload).

Server:

- `apps/server/src/socket/channel-manager.ts`: add public `aliveChannels(): Channel[]` and `findAliveBySessionId(sessionId): Channel | undefined` (keep existing `getAliveChannels`/`getFirstAlive`).
- `apps/server/src/socket/handlers/session/connect.ts`: add new `handleResume` sibling to `handleLaunch` (both manage channel lifecycle entry, single file).
  - Reuse path: if `findAliveBySessionId(sessionId)` hits, callback `{ channelId: existing.channelId }` — NO spawn.
  - Spawn path: `channelManager.create(newChannelId, { launchOptions: { resumeSessionId: sessionId, ... } })`. Runner receives `--resume <sessionId>`. `onSessionInit` upserts row keyed by sessionId with the new channelId.
  - Dead path: on `"No conversation found"`, `sessionStore.updateStatus(sessionId, 'dead')` + error callback.
  - Server MUST NOT spawn a second concurrent CLI for the same sessionId.
- `handleLaunch` is UNCHANGED — still handles fresh launches only.
- `apps/server/src/socket/handlers/session/query.ts` (`handleList`): when `excludeLive === true`, compute `aliveSessionIds = channelManager.aliveChannels().map(c => c.sessionId).filter(Boolean)` and pass them through to the store as `excludeSessionIds`.
- `apps/server/src/persistence/session-store.ts`: `SessionStore.list` opts gain `excludeSessionIds?: string[]`. `DrizzleSessionStore` appends `notInArray(sessions.id, excludeSessionIds)` to WHERE only when non-empty (guards `NOT IN ()` hazard). `CompositeSessionStore` passes through.
- Wire the new `session:resume` event through the socket handler registration.

Client (new files):

- `apps/web/src/contexts/ResumeContext.tsx`: `ResumeProvider` + `useResume()` hook. v1 contract: `{ resume: (sessionId: string) => Promise<{ channelId: string }> }`. Internally emits `session:resume { sessionId }`, validates callback via `sessionResumeResponseSchema`.
- `apps/web/src/components/ResumePicker.tsx`: shared picker. Props `{ cwd?: string; onResume: (channelId) => void; onCancel: () => void }`. Calls `listSessions({ cwd, limit: 50, excludeLive: true })` + `useResume().resume(id)`.
- `apps/web/src/components/ProjectContextMenu.tsx`: lightweight fixed-position menu with single "Resume session…" item (NOT Radix ContextMenu); closes on outside click + Escape.
- `apps/web/src/components/ResumeSessionsDialog.tsx`: Radix Dialog wrapping `<ResumePicker cwd={project.cwd} onResume={handleResume} onCancel={close} />`.

Client (modified):

- `apps/web/src/contexts/SessionContext.tsx`: `listSessions` signature accepts `{ cwd?, excludeLive? }`.
- `apps/web/src/components/ProjectCard.tsx`: add `onContextMenu` handler + render `ProjectContextMenu` + `ResumeSessionsDialog`. Accept `cwd` prop.
- Mount `ResumeProvider` inside `SocketProvider` tree (App root).

## Capabilities

### Modified Capabilities

- `protocol` — new `session:resume` event (C2S RPC with ack callback); `session:list` gains optional `excludeLive`; `ChannelManager` exposes alive-channel lookup helpers; `SessionStore.list` accepts `excludeSessionIds`.
- `client` — `SessionContext.listSessions` accepts `cwd` + `excludeLive`.

### Added Capabilities

- `client-resume-context` — `ResumeProvider` + `useResume()` RPC contract over `session:resume`.
- `client-resume-picker` — shared `ResumePicker` component.
- `client-project-context-menu` — right-click "Resume session…" on `ProjectCard`.

## Impact

- Wire: additive only (new event, new optional field). `session:launch` is not overloaded.
- Persistence: no schema change; `sessionStore.list` gains an optional opt; `sessionStore.updateStatus` used on dead path.
- Tests: new RED→GREEN slices per TDD discipline; no existing `expect(...)` lines modified.
- Out of scope: `fork.ts` / `teleport.ts` channelId↔sessionId bridge fix, ChatPanel `/resume` reintroduction (Step 3), cwd canonicalization, structured dead-session error codes.

## Verified Facts (CLI 2.1.104)

- `claude --resume <sid>` reports the SAME sessionId in `system:init`.
- Multi-turn stream-json after resume keeps the same sessionId.
- DB row (keyed by sessionId) is stable across resume; only the `channelId` column rotates to the new wrapper.
