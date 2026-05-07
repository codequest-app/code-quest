## 1. WorktreeService

- [x] 1.1 Create `apps/server/src/services/worktree-service.ts` with name validation (validateWorktreeName)
- [x] 1.2 Implement `createWorktree(repoRoot, name?)` — full git worktree creation logic (mkdir, prune, branch -D, worktree add)
- [x] 1.3 Implement `listWorktrees(repoRoot)` — parse `git worktree list --porcelain`
- [x] 1.4 Implement `deleteWorktree(repoRoot, name)` — `git worktree remove` + `git branch -D`
- [x] 1.5 Implement `detectWorktree(path)` — regex match `.claude/worktrees/<name>`
- [x] 1.6 Implement `getDefaultBranch(repoRoot)` — `git symbolic-ref refs/remotes/origin/HEAD`
- [x] 1.7 Write tests for all WorktreeService methods (TDD)

## 2. Shared schemas + socket events

- [x] 2.1 Add worktree schemas in `packages/shared/src/schemas/` (WorktreeInfo, CreateWorktreePayload, etc.)
- [x] 2.2 Add socket events to `packages/shared/src/socket-events.ts` (worktree:create, worktree:list, worktree:delete)
- [x] 2.3 Write schema tests

## 3. Server socket handlers

- [x] 3.1 Create `apps/server/src/socket/handlers/worktree.ts` — handle worktree:create, worktree:list, worktree:delete
- [x] 3.2 Register handlers in handler setup
- [x] 3.3 Write handler tests

## 4. Channel worktree binding

- [x] 4.1 Add worktree info to Channel state (optional `worktree: { name, path }`)
- [x] 4.2 Support worktree cwd in session launch (pass worktree path as cwd to CLI spawn)
- [x] 4.3 Include worktree info in session:init and state:update events
- [x] 4.4 Write tests for worktree-bound session launch

## 5. Client state

- [x] 5.1 Add worktree field to channel config state
- [x] 5.2 Handle worktree info from session:init / state:update
- [x] 5.3 Write context tests

## 6. Client UI

- [x] 6.1 Create WorktreeBanner component (shows when session is in worktree)
- [x] 6.2 Integrate banner into ChatPanel
- [x] 6.3 Add worktree option to session creation flow
- [x] 6.4 Write component tests + stories
