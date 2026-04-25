## 1. TopbarLiveSessions component (TDD)

- [x] 1.1 Red: `__tests__/TopbarLiveSessions.test.tsx`:
  - empty sessions → renders nothing visible
  - one busy session → pill with project/cwd label + busy dot
  - click pill → invokes `onActivate(channelId)`
  - 6 sessions → first 5 pills + `+1` overflow chip
- [x] 1.2 Green: implement `<TopbarLiveSessions>` (props: `sessions`, `onActivate`).
- [x] 1.3 Run tests — green.

## 2. Wire into WorkspaceTopbar / WorkspaceLayout

- [x] 2.1 Add `<TopbarLiveSessions>` slot in `WorkspaceTopbar` between scope switcher and the right action group.
- [x] 2.2 In `WorkspaceLayout`, supply `sessions` from `useSession()` + `onActivate(channelId)` that resolves the session's projectRoot and sets active project.
- [x] 2.3 Update `WorkspaceLayout.test.tsx` if needed (no existing assertion conflicts expected).

## 3. Verify

- [x] 3.1 client tsc + vitest — green.
- [x] 3.2 biome check on touched files.

## 4. Finalize

- [x] 4.1 Commit.
