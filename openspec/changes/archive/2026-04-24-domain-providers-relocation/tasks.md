## Strategy

Two commits:
- Commit 1: Step 1 — pure file relocation, behavior unchanged, tests pass identically.
- Commit 2: Step 2 — hooks delegate to Provider actions for rpc.

Per "expect 不變或等價" — assertions preserved across both commits.

## Step 1 — File relocation

### 1. Git folder
- [ ] 1.1 Create `packages/client/src/contexts/git/` folder.
- [ ] 1.2 Move `contexts/GitContext.tsx` → `contexts/git/GitContext.tsx` (git mv).
- [ ] 1.3 Move `hooks/useGitStatus.ts` → `contexts/git/useGitStatus.ts` (git mv).
- [ ] 1.4 Add `contexts/git/index.ts` re-exporting GitProvider, useGitState, useGitActions, useGitStatus.

### 2. Fs folder
- [ ] 2.1 Create `packages/client/src/contexts/fs/` folder.
- [ ] 2.2 Move `hooks/useExplorerBrowse.ts` → `contexts/fs/useFsBrowse.ts` (git mv + rename).
- [ ] 2.3 Create `contexts/fs/FsContext.tsx` — minimal Provider that just wraps children for now (Step 2 adds actions).
- [ ] 2.4 Mount `<FsProvider>` in `App.tsx` (or `WorkspaceLayout`) above ProjectProvider.
- [ ] 2.5 Add `contexts/fs/index.ts` barrel.

### 3. Openspec folder
- [ ] 3.1 Create `packages/client/src/contexts/openspec/` folder.
- [ ] 3.2 Move `hooks/useOpenspecList.ts` → `contexts/openspec/useOpenspecList.ts`.
- [ ] 3.3 Create `contexts/openspec/OpenspecContext.tsx` — minimal Provider (Step 2 adds actions).
- [ ] 3.4 Mount `<OpenspecProvider>` (decision: per-project or global — start with global for simplicity).
- [ ] 3.5 Add `contexts/openspec/index.ts` barrel.

### 4. Update consumer imports
- [ ] 4.1 Find all imports of `contexts/GitContext` / `hooks/useGitStatus` / `hooks/useExplorerBrowse` / `hooks/useOpenspecList`. Replace with new paths.
- [ ] 4.2 Update test wrappers: `renderWithWorkspace` / `renderWithChannel` mount `<FsProvider>` and `<OpenspecProvider>` so tests don't break.

### 5. Verify Step 1
- [ ] 5.1 client + server tsc + vitest green; assertions unchanged.
- [ ] 5.2 Commit "refactor(domain): relocate hooks under their domain Provider folders".

## Step 2 — Hooks delegate to Provider actions

### 6. Git: add statusFull action
- [ ] 6.1 GitContext.actions: add `statusFull(cwd) → rpc(EVENTS.git.status)` (returns `GitStatusByCwdResult`).
- [ ] 6.2 `useGitStatus(cwd)` switches from direct rpc → `useGitActions().statusFull(cwd)`.
- [ ] 6.3 Existing `status` action (statusSummary) untouched.

### 7. Fs: add browse/read/search actions
- [ ] 7.1 FsContext.actions: `browse(path?) → rpc(EVENTS.fs.browse)`, `read(path) → rpc(EVENTS.fs.read)`, `search(cwd, pattern) → rpc(EVENTS.fs.search)`.
- [ ] 7.2 `useFsBrowse` switches from direct rpc → `useFsActions().browse`.
- [ ] 7.3 `FilePreviewModal` switches its `EVENTS.fs.read` rpc to `useFsActions().read` (or stays direct — small caller, judgment call).

### 8. Openspec: add list/read actions
- [ ] 8.1 OpenspecContext.actions: `list(cwd)`, `read(cwd, kind, name, artifact)`.
- [ ] 8.2 `useOpenspecList` uses `useOpenspecActions().list`.
- [ ] 8.3 `SpecModal` switches to `useOpenspecActions().read` (or stays direct).

### 9. Verify Step 2
- [ ] 9.1 client + server tsc + vitest green.
- [ ] 9.2 biome clean.
- [ ] 9.3 Commit "refactor(domain): hooks delegate rpc through Provider actions".
