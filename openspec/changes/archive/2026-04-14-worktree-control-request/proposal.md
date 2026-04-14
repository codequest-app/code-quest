# worktree-control-request

## Why

The real Claude Code VSCode extension has a "Create Worktree" button in the session list header (`src/webview/core/main.js:148203`). Clicking shows an inline form (name input + validation), submitting sends `sendRequest({ type: 'create_worktree', name })` → extension host runs `git worktree add` + opens new VSCode window.

cc-office has the backend (`gitService.createWorktree`, `worktree:create` RPC) but:

- **No UI** triggers `worktree:create`.
- **Channel-bound** payload requires an active session in the repo — can't initiate from a project without a session.
- **No project grouping** — a session in `<repo>/.claude/worktrees/feat-x` becomes a separate "Project" because client groups by `cwd`; worktrees and their main repo are visually unrelated.

Original assumption (CLI `control_request create_worktree`) was wrong — it's a WebView→host request in the extension, not a CLI protocol message.

## What Changes

### 1. Project-right-click UX (new entry point)

- Add "Create Worktree…" to `packages/client/src/components/ProjectContextMenu.tsx`
- Click → inline form (modal or popover) with name input + extension-style validation:
  - Regex `/^[a-zA-Z0-9._-]+$/`
  - Max 64 chars
  - No `.` / `..` / contains `..` / ends with `.` / ends with `.lock`
- Submit → `useWorktree().create(cwd, name)` (the provider wraps the RPC; component stays UI-only)

### 2. Refactor `worktree:*` to cwd-based (drop channel binding)

Current `worktree:create` / `worktree:list` / `worktree:delete` are registered with `withChannel` wrapper but have **zero client callers** — dead code. Repurpose as cwd-based (not channel-bound) since worktree operations target a repo, not a session:

- `worktree:create`: `{ cwd, name }` → `RpcResult<{ channelId; worktreePath }>`
- `worktree:list`: `{ cwd }` → `RpcResult<{ worktrees: WorktreeInfo[] }>`
- `worktree:delete`: `{ cwd, name }` → `RpcResult<Record<string, never>>`

Drop `withChannel` wrappers; handlers read `payload.cwd` directly. Avoids creating a new `project:*` domain for a single RPC.

### 3. Server handler

Atomic — gets either success or rollback. No partial state.

- Parse payload via zod; extract `{ cwd, name }`.
- Resolve the **main repo root** via `gitService.getProjectRoot(cwd)` (NOT `getRepoRoot`) → err if null. See note below.
- Build worktree via `gitService.createWorktree(projectRoot, name)` → `worktreePath = <projectRoot>/.claude/worktrees/<name>`.
- Spawn fresh Claude channel with `cwd: worktreePath`.
- Broadcast `session:created` with `{ channelId, cwd: worktreePath }`.
- **Rollback on failure after step 2**: `gitService.deleteWorktree(projectRoot, name)`.

Matches the VSCode extension behavior: new worktree → fresh session. No history transfer.

**ADR: `git worktree add` not `claude --worktree`**: Claude CLI v2.1.86+ ships a convenience flag `claude --worktree <name>` that bundles git worktree creation + session spawn. cc-office does NOT use it; the server calls `git worktree add` directly via `gitService.createWorktree` (simple-git) and spawns Claude separately. Reasons: (1) separation of concerns — git layer owns worktree; Channel layer owns spawn. (2) provider neutrality — any future agent (Gemini, etc.) uses the same git worktree path. (3) atomic rollback — if spawn fails after worktree creation, server runs `git worktree remove`; cannot cleanly roll back `claude --worktree`'s bundled side effects. (4) matches VSCode extension which also uses raw `git worktree add -b` (`src/core/main.js:16634`).

**Note on `getProjectRoot` vs `getRepoRoot`**: `getRepoRoot(cwd)` uses `git rev-parse --show-toplevel`, which in a worktree returns the **worktree's own path** (e.g. `/foo/.claude/worktrees/feat-a`). Using it would create nested worktrees (`/foo/.claude/worktrees/feat-a/.claude/worktrees/feat-b`) when the caller initiates from an existing worktree. `getProjectRoot(cwd)` uses `git rev-parse --git-common-dir` which returns the **main repo's `.git` parent** (always `/foo`), so worktrees are always created flat under the main tree regardless of where the call originates.

### 3a. Out of scope: fork-to-worktree

Creating a new worktree that continues an existing conversation (fork + worktree in one step) is **explicitly excluded** from this change.

Rationale:
- Requires copying Claude's per-CWD JSONL files (`~/.claude/projects/<encoded-cwd>/sessions/<sid>.jsonl`) using an undocumented path schema.
- Anthropic is actively reworking session storage — see [Issue #15776](https://github.com/anthropics/claude-code/issues/15776) (session state should persist across git worktrees) and open feature requests for cross-directory resume ([#14252](https://github.com/anthropics/claude-code/issues/14252), [#28745](https://github.com/anthropics/claude-code/issues/28745), [#5768](https://github.com/anthropics/claude-code/issues/5768)).
- Extension itself does **not** do this — `createWorktree` → `openFolder` always spawns a fresh session.
- Workaround exists for users who need both: fork the conversation first (existing `session:fork`, same cwd), then manage branch via terminal.

Revisit if/when Claude CLI exposes a stable cross-worktree resume API.

### 4. Project grouping via git common-dir

Problem: worktree session's `cwd` differs from main repo, so today it becomes a separate "Project".

Fix: **group by git common-dir (projectRoot), not cwd**.

- Add `gitService.getProjectRoot(cwd): Promise<string | null>` — runs `git rev-parse --git-common-dir`, returns parent dir (stripping trailing `/.git`). For both main working tree and worktrees, returns the same value.
- Server on channel create: call `getProjectRoot(cwd)` and store `projectRoot` on session metadata (new `SessionSummary.projectRoot`).
- Client `ProjectContext`: key sessions by `projectRoot` (fallback to `cwd` if no git repo).
- Worktree sessions auto-group under their main repo's Project entry.

### 5. TabBar worktree badge + divider

Worktree sessions now coexist with main working tree sessions under the same Project (via projectRoot grouping). TabBar must visually distinguish:

- **Worktree badge on tab label**: `Chat 3 · feat-x` — append `· <worktreeName>` when `session.worktree` is set.
- **Divider between groups**: render tabs ordered as `[main tabs] | [feat-x tabs] | [feat-y tabs]`. Subtle vertical divider (`border-left` 1px) between groups. Tabs within the same worktree stay flat / no collapse.
- Ordering within a group: preserve existing session lastModifiedTime sort.
- Tooltip on badge: shows full worktree path.

### 6. Client `WorktreeProvider` (React Context)

Worktree is a standalone logical domain; its logic must not be coupled to any specific UI location (ProjectContextMenu today, CommandMenu / TabBar / Settings tomorrow). Follow the cc-office pattern (SessionProvider, ProjectProvider, ChannelProvider, PluginProvider, TabProvider) — a dedicated Context that owns worktree state + actions.

```ts
// packages/client/src/contexts/WorktreeContext.tsx
interface WorktreeState {
  capabilities: { worktree: boolean };
  listing: Record<string /* cwd */, WorktreeInfo[]>;  // per-cwd cache
}

interface WorktreeActions {
  create(cwd: string, name: string):
    Promise<{ channelId: string; worktreePath: string }>;
  list(cwd: string): Promise<WorktreeInfo[]>;
  remove(cwd: string, name: string): Promise<void>;
}

export function useWorktree(): WorktreeState & WorktreeActions;
```

Mount `<WorktreeProvider>` once (near `<ProjectProvider>` in App root). Consumers:
- `ProjectContextMenu` — call `useWorktree().create`
- `CreateWorktreeDialog` — same + read `isCreating`/`createError` state
- Future: WorktreesListPanel, CommandMenu "Create Worktree" action, etc.

Benefit: adding a new UI entry point for worktree operations requires only JSX composition, no RPC/state duplication. Tests mock `useWorktree()` instead of the socket.

### 7. GitService capability flag (provider aspect)

- `GitService.capabilities: { worktree: boolean }` — declares whether this backend supports worktrees.
- `LocalGitService.capabilities = { worktree: true }` (simple-git has full support).
- Future backends (e.g. remote git, GitHub API) can declare `false` to hide the UI entry.
- Client reads via a new RPC `project:capabilities` or piggy-backs on app:init response.
- UI menu item hidden when `capabilities.worktree === false`.

## Impact

- **UX**: Users can create worktrees from any project (via right-click menu). New worktree launches a fresh session — matches VSCode extension behavior.
- **Grouping**: Worktree and main repo sessions visually unified under one Project entry in sidebar.
- **Provider**: clean capability flag path for future git backends.
- **Backward compat**: old sessions without `projectRoot` fall back to `cwd`-based grouping. `worktree:*` payload shape change is safe because no client currently calls them (verified via grep).
- **No breaking test changes**: all additions; existing behaviour preserved.
