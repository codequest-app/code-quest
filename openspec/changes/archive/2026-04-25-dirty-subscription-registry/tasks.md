## Tasks

### 1. Relocate matchers to `dirty-matchers.ts`
- [ ] Create `packages/server/src/socket/dirty-matchers.ts` exporting `matchesFs`, `matchesGit`, `matchesOpenspec`, `IGNORE_RES`, `GIT_META_RE`.
- [ ] Remove these exports from `socket/handlers/fs.ts`, `socket/handlers/git.ts`, `socket/handlers/openspec.ts`.
- [ ] Remove the cross-handler `GIT_META_RE` import in `handlers/fs.ts`.
- [ ] Update `packages/server/src/container.ts` to import the three predicates from `socket/dirty-matchers.ts`.
- [ ] `pnpm -F server test` green.

### 2. Extract `subscribeDirtyForSocket`
- [ ] Create `packages/server/src/socket/dirty-subscriber.ts` exporting `subscribeDirtyForSocket(socket, cwd, dirty): Unsubscribe[]` that wires the three subscriptions and emits `files:dirty` / `git:dirty` / `openspec:dirty` with the existing payload shape.
- [ ] Replace the 9-line subscribe block in `socket/channel-manager.ts` with a single call; preserve the existing per-channelId Map bookkeeping.
- [ ] Replace the 9-line subscribe block in `socket/handlers/fs.ts` with a single call; preserve the existing per-cwd Map bookkeeping.
- [ ] `pnpm -F server test` green — fs-watch lifecycle and dirty-event routing tests pass unchanged.

### 3. Verification
- [ ] `npx openspec validate dirty-subscription-registry --strict`.
