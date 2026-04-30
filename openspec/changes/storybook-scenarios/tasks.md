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
- [ ] WorktreeBanner: add 2 variants (long name, short path)
- [ ] HookCallbackCard: add 1 variant + play()
- [ ] OptionButton: add 1 variant + play()
- [ ] TruncatedContent: add 1 variant (medium content near threshold)
- [ ] PlanCommentPopover: add 2 variants
- [ ] ReviewUpsellBanner: add 2 variants (dismissed, gate off)
- [ ] MessageNodeList: add 1 variant (with tool results)
- [ ] SessionHistoryPopover: add 1 variant
- [ ] primitives: split into per-component stories
- [ ] CopyButton: add 1 variant (inline standalone)

### Batch 2 — Settings + Project domain
- [ ] ModelPickerPopover: add 1 variant
- [ ] ManagePluginsDialog: add 2 variants
- [ ] AuthDialog: add 1 variant
- [ ] AddProjectDialog: add 1 variant
- [ ] CreateWorktreeDialog: add 1 variant
- [ ] ProjectContextMenu: add 1 variant

### Batch 3 — Workspace + UI + Files + Command Menu
- [ ] TabContainer: add 2 variants
- [ ] FileTree: add 1 variant
- [ ] CommandMenu: add 2 variants
