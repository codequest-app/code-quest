## Context

The client has a rich component-level Storybook (~100 stories) plus decorators `withStoryChannel` / `withStoryApp` / `withThemePreset`. These cover leaf components but cannot seed workspace-level state (projects, sessions, worktree) because those derive from `SessionContext`, which subscribes to socket events (`app:init`, `session:states`, `session:created`). The project deliberately does NOT accept `initialProjects` / `initialSessions` props on providers — that pattern was previously removed. The accepted pattern is seeding via FakeSummoner.

Existing test harness `render-with-workspace.tsx` demonstrates FakeSummoner-driven seeding, but only through UI flow (clicking Add Project → FileTree → Open). Storybook needs declarative seeding from story args.

## Goals / Non-Goals

**Goals:**
- A single decorator that takes declarative workspace fixtures and seeds the socket so providers pick them up pre-render
- Reusable fixture builders so stories stay small
- Cover WorkspaceLayout, ChatPanel workflows, and full App shell
- Zero production code changes — all additions are under `test/` or `.stories.tsx`

**Non-Goals:**
- Visual regression tooling (Chromatic / Loki) — follow-up change
- Interactive stories that simulate the full click-through (Add project → launch session) — the decorator seeds terminal state, not the flow
- Seeding terminal / filesystem mocks beyond what `FakeSummoner.filesystem()` already exposes

## Decisions

### Decision: FakeSummoner-backed decorator, not provider props
**Chosen**: new `withStoryWorkspaceFixtures(opts)` decorator creating a `FakeSummoner` and wiring its socket to app providers.
**Alternative considered**: add `initialProjects` / `initialSessions` props to `ProjectProvider` / `SessionProvider`.
**Rationale**: the project owner removed prop-based initial state deliberately because tests started using it as a shortcut and drifted from real socket behavior. Keeping the socket as the single source of truth means stories exercise the real data path.

### Decision: Declarative fixture shape, not imperative seeding
**Chosen**: `withStoryWorkspaceFixtures({ sessions, capabilities, channels })` where `channels` is keyed by `channelId` and each value is `{ messages, pendingControls, config, worktree }`.
**Alternative considered**: expose the `FakeSummoner` via render prop so each story calls `summoner.emit(...)` manually.
**Rationale**: declarative shape keeps stories readable and the decorator internalises the event-emission order (app:init → session:states → channel:join responses). Imperative exposure would leak socket internals into every story.

### Decision: Seed synchronously before first render via a stub socket
**Chosen**: build a FakeSummoner, pre-arm it with `app:init` / `session:states` responses, then mount providers. `useLayoutEffect` at the top of the decorator emits `connect` and initial state before children paint.
**Alternative considered**: use `useEffect` (post-mount) to emit. Accept brief flash of empty state.
**Rationale**: `useLayoutEffect` runs before browser paint, matching `withThemePreset`'s established pattern. No flicker.

### Decision: Reuse existing providers, not re-implement
**Chosen**: decorator wraps `SocketProvider → SessionProvider → PluginProvider → ProjectProvider → WorktreeProvider → TabProvider` (same stack as `renderWithWorkspace`).
**Alternative considered**: a flatter story-only provider.
**Rationale**: reusing real providers keeps stories honest — bugs in providers surface in stories. Only the socket is fake.

### Decision: `App.stories.tsx` renders real `<App />`
**Chosen**: with the decorator working, `<App />` becomes renderable in Storybook because it just needs a fake socket.
**Alternative considered**: manually compose `ActivityBar + Sidebar + TabBar + WorkspaceLayout` in the story.
**Rationale**: if the decorator does its job, the real `<App />` should just work. Manual composition is a fallback only if `<App />` pulls something unmockable (router, service worker). Try real first.

### Decision: Fixture module exports builders, not constants
**Chosen**: `makeLongConversation(overrides?)` etc.
**Alternative considered**: frozen constants.
**Rationale**: consistent with existing patterns (see MessageList.stories, PaletteMessageList.stories, etc.) and avoids cross-story mutation footguns.

## Risks / Trade-offs

- **Risk**: `useLayoutEffect` timing with provider subscription might still miss the first tick because `useEffect` subscribes async → **Mitigation**: instead of emitting in the decorator, pre-arm FakeSummoner's internal state so when `SessionContext` emits `app:init` request, FakeSummoner responds synchronously with seeded sessions. Reference `FakeSummoner.prepareInit()` pattern from existing tests.

- **Risk**: `App.tsx` might import modules that fail under Storybook (e.g., direct `window.electron` access) → **Mitigation**: if so, document in `App.stories.tsx` why we fall back to manual composition, and file a follow-up to make `App.tsx` more portable.

- **Risk**: Decorator becomes a kitchen-sink that every story uses → **Mitigation**: fixture shape is opt-in; stories that only need channel messages should keep using `withStoryChannel`. Document in story-decorator.tsx JSDoc.

- **Trade-off**: More infra than a simple Storybook cleanup. Worth it because this decorator unlocks *future* screen stories (Settings shell, Auth flow, multi-tab scenarios) without each story reinventing seeding.

## Open Questions

- Does `App.tsx` import anything that requires MSW or service-worker mocking? (Answered during task 4.1 by reading it.)
- Should the decorator also expose `summoner` via Storybook parameters so play functions can drive additional events (e.g., simulating `session:created` mid-story)? Defer unless a concrete story needs it.
