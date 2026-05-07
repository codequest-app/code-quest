## ADDED Requirements

### Requirement: Workspace fixture decorator
The client SHALL provide a Storybook decorator `withStoryWorkspaceFixtures` that drives a `FakeSummoner`-backed socket to seed workspace state declaratively from story args. This decorator is the single entry point for screen-level stories that need projects, sessions, channel messages, pending controls, or worktree state.

#### Scenario: Seeding sessions and projects
- **WHEN** a story uses `withStoryWorkspaceFixtures({ sessions: [...] })`
- **THEN** the rendered tree shows the derived projects (one per unique `projectRoot` among non-terminal sessions) and the seeded sessions appear in `useProjectState().sessions`

#### Scenario: Seeding channel messages for a specific channel
- **WHEN** a story seeds a session with channelId `c1` and provides `channels: { c1: { messages: [...] } }`
- **THEN** opening that channel in the story displays the seeded messages without further socket interaction

#### Scenario: Seeding pending controls
- **WHEN** a story provides `channels: { c1: { pendingControls: [...] } }`
- **THEN** the relevant pending permission / hook callback UI renders for that channel

#### Scenario: Seeding worktree capability
- **WHEN** a story provides `capabilities: { worktree: true }`
- **THEN** `useProjectState().capabilities.worktree` is `true` and worktree-dependent UI renders

#### Scenario: Pre-mount seeding
- **WHEN** a story using the decorator mounts
- **THEN** providers see the seeded state on first render (no post-mount flash from empty to seeded state)

### Requirement: Shared story fixtures module
The client SHALL expose `apps/web/src/test/story-fixtures.ts` centralizing reusable mock data builders (messages, sessions, pending controls, projects, diffs) for screen-level stories.

#### Scenario: Screen stories consume shared fixtures
- **WHEN** a screen-level story needs mock data
- **THEN** it imports builders from `test/story-fixtures` rather than redefining inline

#### Scenario: Fixtures are test-only
- **WHEN** the fixture module is referenced
- **THEN** it is only imported from `*.stories.tsx` or `*.test.tsx` files — never from runtime code

### Requirement: Workspace layout screen stories
The client SHALL provide Storybook stories for `WorkspaceLayout` covering the core workspace states.

#### Scenario: Empty project state
- **WHEN** no sessions are seeded
- **THEN** `WorkspaceLayout.stories.tsx` exports an `EmptyProject` story showing the onboarding empty state with the Add Project CTA

#### Scenario: Active chat session
- **WHEN** a session with non-empty message history is seeded
- **THEN** `WorkspaceLayout.stories.tsx` exports an `ActiveChat` story showing ActivityBar + sidebar + TabBar + ChatPanel with messages

#### Scenario: Worktree mode
- **WHEN** a worktree-enabled session is seeded
- **THEN** `WorkspaceLayout.stories.tsx` exports a `WithWorktree` story showing the WorktreeBanner and worktree chrome

### Requirement: Chat panel workflow stories
The client SHALL provide Storybook stories for `ChatPanel` covering representative conversation shapes.

#### Scenario: Long conversation
- **WHEN** a session has 20+ mixed-type messages
- **THEN** `ChatPanel.stories.tsx` exports a `LongConversation` story

#### Scenario: Processing with tool in flight
- **WHEN** status is `processing` and the latest message is a `tool_use` without result
- **THEN** `ChatPanel.stories.tsx` exports a `ProcessingWithTool` story

#### Scenario: Conversation with diff result
- **WHEN** a `tool_result` carries a unified-diff payload
- **THEN** `ChatPanel.stories.tsx` exports a `WithDiff` story rendering the DiffViewer inline

### Requirement: App shell composition story
The client SHALL provide a top-level `App.stories.tsx` that renders the App shell (Toaster + ErrorBoundary + WorkspaceLayout) seeded via `withStoryWorkspaceFixtures`. Since `App.tsx` creates its own real socket via `createSocket()`, the story composes the same JSX tree manually rather than rendering `<App />` directly — this fallback is documented in `design.md`.

#### Scenario: Default shell
- **WHEN** the story renders
- **THEN** it shows Toaster + ErrorBoundary wrapping a seeded WorkspaceLayout — no runtime refactor to `App.tsx` is required
