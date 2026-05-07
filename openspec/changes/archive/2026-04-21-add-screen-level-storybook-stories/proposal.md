## Why

The client package has ~100 component-level Storybook stories but almost no screen/page-level coverage. Storybook's official Component-Driven Development (CDD) guidance recommends building stories at every complexity layer — atomic → composite → screen — so that workflows, connected state, and layout regressions are documented and visually testable. Without screen stories we lose visual regression coverage for the primary user flows (empty project, active chat, pending permission, worktree mode) and cannot review layout changes in isolation from the live backend.

Existing decorators (`withStoryChannel`, `withStoryApp`) can inject channel messages and providers, but cannot seed projects/sessions/worktree state — those derive from `SessionContext`, which is socket-driven. The project convention (confirmed by the user: prop-based initial state was deliberately removed) is to seed state through the socket, not through provider props. The missing piece is a Storybook decorator that drives a `FakeSummoner`-backed socket to declaratively seed any workspace state.

## What Changes

- Introduce new Storybook decorator `withStoryWorkspaceFixtures({ sessions, capabilities, channels })` that drives a `FakeSummoner`-backed socket so workspace state (projects, sessions, messages, pending controls, worktree) can be seeded declaratively from story args — this is the infra that unblocks screen-level stories
- Add reusable fixture module `apps/web/src/test/story-fixtures.ts` holding shared mock messages, sessions, pending controls, projects
- Add 4 screen variants to `WorkspaceLayout.stories.tsx`: `EmptyProject`, `ActiveChat`, `WithPendingPermission`, `WithWorktree`
- Add 3 workflow variants to `ChatPanel.stories.tsx`: `LongConversation`, `ProcessingWithTool`, `WithDiff`
- Add new `App.stories.tsx` rendering the real `<App />` seeded via the new decorator

## Capabilities

### New Capabilities
- `storybook-screens`: Screen/page-level Storybook stories plus the `withStoryWorkspaceFixtures` decorator for socket-seeded workspace state

### Modified Capabilities
<!-- none -->

## Impact

- **Affected code**:
  - New: `apps/web/src/test/story-workspace-decorator.tsx` (new decorator)
  - New: `apps/web/src/test/story-fixtures.ts` (shared fixtures)
  - New: `apps/web/src/App.stories.tsx`
  - Modified: `apps/web/src/components/WorkspaceLayout.stories.tsx`, `ChatPanel.stories.tsx`
- **No runtime/production code changes**: all additions are under `test/` (co-located with existing `story-decorator.tsx`, `fake-summoner.ts`) or `.stories.tsx` files
- **No new dependencies**: reuses existing `FakeSummoner`, `createFakeSummoner`, existing app providers
- **Risk**: medium — decorator needs to seed socket events at the right lifecycle (pre-mount) so providers pick them up synchronously; mitigated by the existing `render-with-workspace` test harness as a reference implementation
