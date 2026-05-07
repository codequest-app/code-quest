## Why

F.html shows a bottom collapsible terminal panel: multi-tab, each tab has its own cwd, supports running shell commands inline. This is the missing escape hatch for everything cc-office's structured UI doesn't cover (running scripts, ad-hoc git commands, npm install logs).

This is the largest of the open changes — it touches server (PTY process), client (xterm.js), AND a new persistence concern (terminal state survives reloads or not?).

## What Changes

### Backend (summoner + server)
- New `TerminalService` (summoner-layer abstraction):
  - `spawn({ cwd, shell, cols, rows }) → terminalId` — spawns shell via `node-pty` (new dep).
  - `write(terminalId, data)` — feed stdin.
  - `resize(terminalId, cols, rows)`.
  - `kill(terminalId)`.
  - Emits `'data'` (bytes), `'exit'` events per terminal.
- `LocalTerminalService` (real `node-pty`) + `FakeTerminalService` (test).
- Server socket events:
  - `terminal:spawn / write / resize / kill` (RPC, scoped by socket connection).
  - Server broadcasts: `terminal:data { id, chunk }`, `terminal:exit { id, code }`.
- DI bind in `container.ts`; tests use Fake.

### Frontend
- New deps: `xterm` + `xterm-addon-fit`.
- `<TerminalPanel>` mounted at the bottom of `WorkspaceLayout`, collapsible by `<TopbarButton>` (toggle).
- Uses `<PanelGroup direction="vertical">`: top = main 3-column area, bottom = terminal panel.
- Multi-tab strip: per tab `{ id, cwd, name }`. Default cwd = active tab's cwd from `useActiveCwd`.
- Each tab renders an `<XTermWrapper>` reading from the matching `terminal:data` stream.
- Persistence: tab list in localStorage; terminals don't survive page reload (re-spawn on next mount).

Out of scope:
- Terminal recording / playback.
- SSH / remote terminals.
- Theme customization (use a single dark theme matching the app).
- Terminal-side autocomplete beyond what the shell provides.
- Sharing terminal output to chat as a tool result (future integration).

## Impact

**New:**
- `apps/summoner/src/terminal/types.ts`, `local.ts`, `test/fake-terminal-service.ts`.
- `apps/server/src/socket/handlers/terminal.ts` (already a stub may exist for OpenClaude — extend / replace).
- `apps/web/src/components/TerminalPanel.tsx`, `TerminalTab.tsx`, `XTermWrapper.tsx`.
- `apps/web/src/contexts/TerminalContext.tsx` for tab list.

**Modified:**
- `WorkspaceLayout.tsx` — vertical PanelGroup wrapping the existing horizontal one.
- `WorkspaceTopbar.tsx` — add toggle button.
- `container.ts` — bind TerminalService.

**New deps:**
- Server: `node-pty` (native module — must verify CI builds work; documented build deps).
- Client: `xterm` + `xterm-addon-fit`.

**Risk:** high.
- `node-pty` requires native build tooling; CI must install build-essential / Xcode tools (already true for sqlite). Document.
- Process leaks if the client disconnects mid-session — implement TTL + on-disconnect cleanup in TerminalService.
- Resize handling can desync; throttle resize calls.
- Security: spawned shell runs as the server user; document the trust model (this is a single-user dev tool, not multi-tenant).
