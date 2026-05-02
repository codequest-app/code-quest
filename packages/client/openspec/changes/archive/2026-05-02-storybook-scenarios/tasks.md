# Storybook Two-Layer Architecture Tasks

## Phase 1: Scenarios Layer (完成)

### Batch 1 — Getting Started + Tool Use
- [x] Create `scenarios/` directory structure
- [x] Add scenario fixture factories to `story-fixtures.ts`
- [x] Create `scenarios/getting-started.stories.tsx` (EmptySession, SimpleQA)
- [x] Create `scenarios/tool-use.stories.tsx` (ReadAndGrep, EditWithDiff, BashExecution, MultiToolChain, Processing)
- [x] Move ChatPanel's scenario stories
- [x] All scenarios have play() functions

### Batch 2 — Permissions
- [x] Extend `ChannelControlProvider` with `initialPendingControls`
- [x] Extend `withStoryChannel` decorator with `pendingControls` option
- [x] Create `scenarios/permissions.stories.tsx` (ToolApproval, ToolDenial, PlanReview)

### Batch 3 — System Events + Advanced
- [x] Create `scenarios/system-events.stories.tsx` (ErrorRecovery, RateLimit, CompactBoundary, Interrupt, HookExecution)
- [x] Create `scenarios/advanced.stories.tsx` (ThinkingBlock, MultiToolChain, StreamlinedOutput, TaskStarted)

### Batch 4 — Session
- [x] Create `scenarios/session.stories.tsx` (CompletedSession, Processing, Disconnected)
- [x] Verify storybook builds without errors

## Phase 2: Components Layer Improvement (進行中)

### Batch 1 — Chat domain (進行中)
- [x] WorktreeBanner: add 2 variants (long name, short path)
- [x] HookCallbackCard: add 1 variant + play()
- [x] OptionButton: add 1 variant + play()
- [x] TruncatedContent: add 1 variant (medium content near threshold)
- [x] PlanCommentPopover: add 2 variants
- [x] ReviewUpsellBanner: add 2 variants (dismissed, gate off)
- [x] MessageList: add 1 variant (with tool results)
- [x] SessionHistoryPopover: add 1 variant
- [x] primitives: split into per-component stories
- [x] CopyButton: add 1 variant (inline standalone)

### Batch 2 — Settings + Project domain
- [x] ModelPickerPopover: add 1 variant
- [x] ManagePluginsDialog: add 2 variants
- [x] AuthDialog: add 1 variant
- [x] AddProjectDialog: add 1 variant
- [x] CreateWorktreeDialog: add 1 variant
- [x] ProjectContextMenu: add 1 variant

### Batch 3 — Workspace + UI + Files + Command Menu
- [x] TabContainer: add 2 variants
- [x] FileTree: add 1 variant
- [x] CommandMenu: add 2 variants
