## Tasks

### 1. `useSyncTabsFromSessions` (TDD)
- [ ] Write `useSyncTabsFromSessions.test.tsx`: new session in props → opens a tab; removed session → closes its tab; active tab preserved when other tabs change; reordering does not churn.
- [ ] Implement the hook; remove the equivalent `useEffect` from `TabContext.tsx`.

### 2. `useNavigationIntents` (TDD)
- [ ] Write `useNavigationIntents.test.tsx`: `pendingActivateChannel` activates that tab + clears the intent; `pendingOpenWorktree` opens worktree tab + clears; null intents are no-ops.
- [ ] Implement the hook; remove the equivalent effects from `TabContext.tsx`.

### 3. Mount the hooks
- [ ] In the workspace shell (current `TabProvider` mount site), call both hooks once `TabProvider` is in scope.
- [ ] Verify no duplicate effect-firing; React Compiler-friendly (stable deps).

### 4. Verification
- [ ] `pnpm --filter client test` green — existing TabContext tests pass unchanged.
- [ ] `npx openspec validate tab-context-srp-split --strict`.
