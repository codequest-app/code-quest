## Why

Three domain hooks live as standalone files alongside their domain Providers:

```
contexts/GitContext.tsx       ← state + actions
hooks/useGitStatus.ts         ← (orphan, calls rpc directly)
hooks/useExplorerBrowse.ts    ← (orphan, no Provider exists for fs)
hooks/useOpenspecList.ts      ← (orphan, no Provider exists for openspec)
```

Issues:
1. **Inconsistent**: Git has Provider but its full-status hook bypasses it.
2. **No Fs / Openspec Provider** — hooks float with no domain home.
3. **Direct `rpc()` calls in hooks** — bypasses Provider's actions layer; if RPC contract changes, two places to update.

## What Changes

Two-step refactor (commit-able mid-way):

### Step 1 — Pure file relocation (behavior unchanged)
- Create `contexts/git/` folder. Move `GitContext.tsx` in. Move `useGitStatus.ts` into `contexts/git/`.
- Create `contexts/fs/` folder. New `FsContext.tsx` with empty Provider + `useFsActions` hook (mounted globally in WorkspaceLayout). Move `useExplorerBrowse.ts` into `contexts/fs/` and rename → `useFsBrowse.ts`.
- Create `contexts/openspec/` folder. New `OpenspecContext.tsx` with Provider + `useOpenspecActions`. Move `useOpenspecList.ts` into `contexts/openspec/`.
- Add `index.ts` barrel exports for each domain folder.
- Update all consumer imports.
- **Behavior:** zero changes. Tests pass without modification beyond import paths.

### Step 2 — Hooks use Provider actions (rpc consolidation)
- Add full-status action to GitContext: `statusFull(cwd) → rpc(EVENTS.git.status)` (existing `status` is the summary variant).
- `useGitStatus` switches from direct `rpc(EVENTS.git.status)` → `useGitActions().statusFull(cwd)`.
- `FsContext` exposes `browse / read / search` actions; `useFsBrowse` uses them.
- `OpenspecContext` exposes `list / read` actions; `useOpenspecList` uses them.
- React state (data / loading / error) + subscription useEffects stay in the hooks (Provider is for action namespace, not for cache).

## Impact

**Modified — client (folder restructure):**
- `contexts/GitContext.tsx` → `contexts/git/GitContext.tsx`
- `hooks/useGitStatus.ts` → `contexts/git/useGitStatus.ts`
- `hooks/useExplorerBrowse.ts` → `contexts/fs/useFsBrowse.ts`
- `hooks/useOpenspecList.ts` → `contexts/openspec/useOpenspecList.ts`
- New: `contexts/fs/FsContext.tsx`, `contexts/openspec/OpenspecContext.tsx`, plus 3 `index.ts` barrels.

**Modified — client consumers (import path renames):**
- ~15 files that import from `'../hooks/useGitStatus'`, `'../contexts/GitContext'`, `'../hooks/useExplorerBrowse'`, `'../hooks/useOpenspecList'` etc.

**Modified — Provider tree:**
- `App.tsx` mounts `<FsProvider>` near the top (above ProjectProvider so AddProjectDialog can use it).
- Per-project `<OpenspecProvider>` mounted (or also global — see design Q below).

**Tests:** import-path renames only; assertions unchanged.

**Risk:** low.
- Step 1 is mechanical; tsc + tests guard.
- Step 2 introduces new GitActions method (`statusFull`); existing `status` (summary) untouched.
- React Compiler handles useMemo for action objects (Provider value).

## Design questions to resolve before Step 2

- **OpenspecProvider scope**: per-project (matches its consumer pattern) or global?
- **FsActions in tests**: how does `renderWithChannel` / `renderWithWorkspace` expose FsProvider? Should be wrapped in their decorators so all client tests get it for free.

## Deferred (do NOT bundle)

1. **`useFsWatch` cwd-dedup hook** — multiple components emitting `fs:watch` for same cwd should dedup at the Provider layer. Today FilesPane + GitPane each emit independently. Useful but architectural; separate change.
2. **`openspec-write-ops`** — unchanged from prior reminders.
3. **`broadcaster-dedup-channel-vs-socket`** — unchanged.
