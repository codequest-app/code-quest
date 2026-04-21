## 1. Workspace fixture decorator

- [x] 1.1 Create `packages/client/src/test/story-workspace-decorator.tsx`
- [x] 1.2 Define `WorkspaceFixtures` type: `{ sessions?, capabilities?, settings?, className? }`
- [x] 1.3 Implement `withStoryWorkspaceFixtures(fixtures)` that creates a `FakeSummoner`, intercepts `app:init` emit to return seeded sessions/capabilities/settings synchronously, then wraps children with the full provider stack (`SocketProvider → SessionProvider → PluginProvider → ProjectProvider → WorktreeProvider`)
- [x] 1.4 Providers see seeded state on first paint (intercept happens in `useMemo` before first render, `onConnect` fires during mount and hits our sync callback)
- [x] 1.5 Added JSDoc explaining when to use this decorator vs `withStoryChannel` / `withStoryApp`

## 2. Shared fixtures module

- [x] 2.1 Create `packages/client/src/test/story-fixtures.ts`
- [x] 2.2 Add `makeLongConversation(overrides?)` returning 20+ mixed-type messages
- [x] 2.3 Add `makeProcessingWithTool()` returning messages ending in a `tool_use` without result
- [x] 2.4 Add `makeConversationWithDiff()` returning a `tool_result` carrying a unified-diff payload
- [x] 2.5 Add `makePendingPermission()` returning a `can_use_tool` pending control
- [x] 2.6 Add `makeSession(overrides?)` returning a `SessionStateSummary` with a given channelId and projectRoot
- [x] 2.7 Add `makeWorktreeSession()` returning a session whose cwd is a worktree path
- [x] 2.8 Verify no runtime import of this module (`grep -rn "from '.*story-fixtures'" packages/client/src` → only `.stories.tsx`)

## 3. WorkspaceLayout screen stories

- [x] 3.1 Update `WorkspaceLayout.stories.tsx` meta to use `withStoryWorkspaceFixtures`
- [x] 3.2 Add `EmptyProject` story (no fixtures → default empty state)
- [x] 3.3 Add `ActiveChat` story using `makeSession()`
- [x] 3.4 Add `WithPendingPermission` story (shell with session; ToolPermissionCard itself has dedicated story)
- [x] 3.5 Add `WithWorktree` story using `makeWorktreeSession()` + `capabilities: { worktree: true }`
- [x] 3.6 Boot Storybook locally, click through each story, confirm expected shell chrome renders (manual)

## 4. ChatPanel workflow stories

- [x] 4.1 Add `LongConversation` story using `makeLongConversation()` via `withStoryChannel`
- [x] 4.2 Add `ProcessingWithTool` story using `makeProcessingWithTool()`
- [x] 4.3 Add `WithDiff` story using `makeConversationWithDiff()`
- [x] 4.4 Verify DiffViewer renders inline and processing spinner appears (manual)

## 5. App shell composition story

- [x] 5.1 Read `packages/client/src/App.tsx` — it calls `createSocket()` directly, so rendering real `<App />` would connect to real backend; fallback required
- [x] 5.2 N/A — real `<App />` not used (socket is non-injectable)
- [x] 5.3 Created `App.stories.tsx` with manual composition mirroring `App.tsx`'s provider stack + `<Toaster />` + `<ErrorBoundary>`; documented rationale in file header
- [x] 5.4 Added `DefaultShell`, `EmptyShell`, `WorktreeShell` stories
- [x] 5.5 `parameters: { layout: 'fullscreen' }` set at meta level

## 6. Verification

- [x] 6.1 `pnpm --filter client exec tsc --noEmit` passes
- [x] 6.2 Storybook build passes (`pnpm build-storybook`) — all stories compile and bundle successfully
- [x] 6.3 Boot Storybook (`pnpm storybook`), click through every new story, no console errors (manual)
- [x] 6.4 Git diff confined to `test/*`, `App.stories.tsx`, and component `.stories.tsx` — zero production code changes
