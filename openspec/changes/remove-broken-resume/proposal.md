# Proposal: remove-broken-resume

## Why

The current `/resume` flow is broken end-to-end:

- Server `command.handleResume` only re-broadcasts `session:resume` — it never spawns a CLI with `--resume`, never reuses an existing channel, never touches the session store.
- Client `ProjectContext.handleResume` reacts to that broadcast by **rewriting the channelId of the last entry** in the in-memory sessions array, which corrupts the project sidebar.
- Net effect: clicking "Resume conversation" produces a UI flicker and zero CLI activity.

Cleaning this dead path out first lets the follow-up changes (`project-menu-resume`, `chatpanel-resume-via-picker`) build a real resume flow without dragging the broken code along as a confounder.

## What Changes

Shared (`packages/shared/src/`):

- `schemas/session.ts`: delete `sessionResumePayloadSchema` + `SessionResumePayload` type.
- `socket-events.ts`: delete the two `'session:resume'` event entries (C2S `ClientToServerEvents` line 337 and S2C `ServerToClientEvents` line 406).

Server (`packages/server/src/socket/handlers/session/`):

- `command.ts`: delete `handleResume` (lines 31–38) and the `emitter.on('session:resume', handleResume)` registration (line 112).
- Drop the `sessionResumePayloadSchema` import.

Client:

- `contexts/SessionContext.tsx`: delete `resumeSession` field from `SessionContextValue` interface (line 44) and from the actions object (lines 120–122).
- `contexts/ProjectContext.tsx`: delete `handleResume` (lines 96–104), the `socket.on('session:resume', onResume)` subscription, and the matching `socket.off`. Drop `sessionResumePayloadSchema` import.
- `components/command-menu-items.tsx`: delete the `Resume conversation` menu entry (around line 124) and the `onResumeConversation` callback typing on its params (line 47). The hook prop is hidden but kept in `CommandMenu` props for reintroduction in change 3.
- `components/ChatPanel.tsx`: delete `openResumeOverlay`, `handleResumeSelect`, `showResumeOverlay`/`resumeSessions`/`resumeLoading` state, the `<SessionDropdown>` JSX block, and the `onResumeConversation={openResumeOverlay}` wiring on `ChatInputArea`.
- Tests: delete any test that asserts on `socket.on('session:resume')`, `resumeSession()` action, or the resume command-menu entry.

## Capabilities

### Modified Capabilities

- `client` — REMOVED requirement: client SHALL NOT expose a `resumeSession` action nor render a "Resume conversation" command-menu item until reintroduced by `chatpanel-resume-via-picker`.
- `command-menu-structure` — REMOVED requirement: the menu SHALL NOT include a `resume-conversation` item until reintroduced.

## Impact

- Wire-breaking: the `session:resume` socket event is removed in both directions. Older clients/servers connected across versions will silently drop the event (no code reacts to it on either side after this change).
- No DB / persistence impact.
- Test count goes down; no new tests required.
- Follow-up: `project-menu-resume` immediately reintroduces a real resume path via `session:launch { resumeSessionId }`.
