## 1. Classifier utility (TDD)

- [x] 1.1 Create `apps/web/src/utils/tool-group-rules.ts` exporting `READ_ONLY_TOOLS: ReadonlySet<string>` containing the tools that qualify for grouping. Seed from extension whitelist: `Read`, `Grep`, `Glob`, `WebSearch`, `WebFetch`, `TodoRead`, `TodoWrite`, `NotebookRead`, `ToolSearch` (confirm against `apps/web/src/utils/tool-registry.ts`)
- [x] 1.2 Export `isReadOnlyToolNode(node: MessageNode): boolean` — returns true iff `node.message.type === 'tool_use'` and `node.message.content` ∈ READ_ONLY_TOOLS. Unit test.
- [x] 1.3 Export `splitTimelineRuns(nodes: MessageNode[]): TimelineRun[]` where `TimelineRun = { kind: 'grouped'; nodes: MessageNode[] } | { kind: 'solo'; node: MessageNode }`. Rules:
  - Accumulate consecutive `isReadOnlyToolNode` into a grouped run
  - Any non-read-only node (text, thinking, tool_use for write tools, streamlined_*) flushes the group and emits as `solo`
  - A grouped run is only emitted when it contains **≥ 2** nodes; a single read-only tool emits as `solo`
- [x] 1.4 Unit tests for `splitTimelineRuns` covering: all Reads (grouped), mixed Read+Bash (Bash flushes, Bash solo), single Read (solo), Read-text-Read (two solos, text between), empty input

## 2. Replace CollapsibleTimeline with group-aware render (TDD)

- [x] 2.1 Write component test: `CollapsibleTimeline` fed with 3 consecutive `Read` tool_use nodes renders a single "Explored" header + count badge `3` and is **collapsed by default**
- [x] 2.2 Write component test: click the header expands to reveal all 3 individual tool blocks
- [x] 2.3 Write component test: `CollapsibleTimeline` fed with `[Read, Bash, Read, Read]` renders: (a) first `Read` solo, (b) `Bash` solo, (c) "Explored 2" grouping the last two Reads
- [x] 2.4 Write component test: single `Read` stays solo (no "Explored" header)
- [x] 2.5 Refactor `CollapsibleTimeline` to call `splitTimelineRuns` internally; render grouped runs via a sub-component `ExploredGroup` (collapsed by default) and solo runs via the existing per-node render path. Drop the old global `toolCount >= 5` auto-collapse (the new grouping replaces it)
- [x] 2.6 Update the existing `animate-fade-in` + timeline dot/line layout inside `ExploredGroup` so expanded view still looks right

## 3. Migration safety

- [x] 3.1 Ensure `data-collapsed-ids` semantics still work for `scrollToMessage` (MessageList relies on it to expand before scrolling) — the new grouped header must expose the same attribute
- [x] 3.2 Verify `SubagentChildren` still render under their parent tool_use whether inside a group or solo
- [x] 3.3 Check storybook `MessageList.stories.tsx` — update fixtures if existing stories assumed the 5-tool auto-collapse behaviour

## 4. Regression + polish

- [x] 4.1 Run `pnpm -C apps/web test` — all green
- [x] 4.2 Run `biome check` on touched files
- [x] 4.3 Manually verify in dev: sequence of 3+ Reads collapses, sequence of 3 Bash stays expanded, mixed sequences split correctly, scroll-to-message still expands the group first

## 5. Ship

- [x] 5.1 Commit with spec reference in message
- [x] 5.2 Push + PR (or direct to main per project convention)
