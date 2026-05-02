# Tasks: cleanup-dead-code

**TDD discipline**: tests + fixtures + tsc are the oracle. Drop first, verify green, commit. If a drop surfaces a real regression, investigate — don't mask with re-add.

## 1. Pass 1 — trivially dead

- [x] 1.1 `packages/summoner/src/claude/index.ts` — dead barrel (only re-exports to legacy path). Verify via `grep -r "from '@code-quest/summoner/claude'"` across monorepo. Delete.
- [x] 1.2 `packages/server/drizzle-mysql.config.ts` — verify whether it's referenced by any drizzle-kit config / CI step. If referenced, keep; if not, delete.
- [x] 1.3 `packages/server/drizzle-sqlite.config.ts` — same as 1.2.
- [x] 1.4 `packages/client/src/components/icons/MentionIcons.tsx: TerminalIcon` — remove export if confirmed unused.
- [x] 1.5 `packages/client/src/components/message-blocks/index.ts: CollapsibleBlock` — remove export.
- [x] 1.6 `packages/client/src/components/message-blocks/shared.tsx: JSON_VIEWER_CLASS` — remove.
- [x] 1.7 `packages/client/src/contexts/channel/ChannelIdContext.tsx: ChannelIdContext` — stop exporting, use only via `useChannelId` hook.
- [x] 1.8 `packages/client/src/contexts/channel/index.ts: ChannelIdProvider, useChannelMessagesActions` — verify no consumers, drop re-exports.
- [x] 1.9 `packages/client/src/socket/rpc.ts: RpcError, channelRpc, call` — these were added during unify-rpc-ack as future-use helpers. If no current consumer, remove. `call<E>()` is the ack-unwrap helper designed for RpcResult; evaluate whether any component SHOULD use it (vs raw `rpc()`). If remove, re-add when a concrete consumer shows up.
- [x] 1.10 `packages/client/src/test/helpers.tsx: emitSegment` — dead test helper.
- [x] 1.11 `packages/summoner/src/__tests__/claude/helpers.ts: parseMessage` — dead after PR2 ClientMessage refactor.
- [x] 1.12 `packages/summoner/src/filesystem/types.ts: readFileResultSchema` — added during Section 2.3 of consolidate-zod-shared but never consumed; the `ReadFileResult` type alias is used. Drop the schema.
- [x] 1.13 Run full test suite + tsc — green.

## 2. Pass 2 — types cleanup

- [x] 2.1 Context value types (SessionContextValue, ChannelComposeContextValue, ChannelControlValue, ChannelMessagesValue, MessagesActionsValue, PluginContextValue, TabStateValue, TabActionsValue): stop exporting. These are internal provider-implementation details. `use*` hooks provide the public API.
- [x] 2.2 `packages/client/src/types/ui.ts: ToolResult` — transitional leftover; verify no consumer, drop.
- [x] 2.3 `packages/server/src/config.ts: RawStoreDriver` — if only config-internal, unexport.
- [x] 2.4 `packages/server/src/test/create-test-container.ts: TestContainerOverrides` — test harness; if no external consumer, unexport.
- [x] 2.5 `packages/summoner/src/runner.ts: ProcessRunnerOptions` — unexport if internal.
- [x] 2.6 `packages/summoner/src/test/fake-claude.ts: InitializeOptions` — note: the SAME name is a shared schema type. This is a test-harness-only variant (has `launch` field). Rename to avoid shadowing or drop if unused.
- [x] 2.7 `packages/client/src/utils/group-for-timeline.ts: RenderGroup` — verify and unexport.
- [x] 2.8 `packages/client/src/utils/model-utils.ts: ModelDisplayInfo` — verify and unexport.
- [x] 2.9 `packages/client/src/utils/slash-query.ts: SlashToken` — verify and unexport.
- [x] 2.10 Component Props types (CommandMenuProps, HeaderBarProps, etc.) — **KEEP exported**. Component props ARE the component's public API; exporting them supports testing and external composition. Do NOT touch.
- [x] 2.11 Test-harness option types (RenderWithChannelOptions, RenderWithChannelResult, RenderWithWorkspaceOptions, StoryChannelOptions): unexport if only internal.
- [x] 2.12 `packages/client/src/contexts/TabContext.tsx: TabMeta` — if only internal, unexport; if test uses it, keep.
- [x] 2.13 `packages/client/src/components/TimelineItem.tsx: TimelineStatus` — verify and drop.
- [x] 2.14 Run tsc + tests — green.

## 3. Pass 3 — dependencies

- [x] 3.1 Client `@hookform/resolvers, react-hook-form`: `grep -rE "from '(@hookform|react-hook-form)'"` — if unused at runtime, remove.
- [x] 3.2 Client `@radix-ui/react-popover, @tanstack/react-query, ky, react-resizable-panels`: verify and remove if unused.
- [x] 3.3 Client `@xterm/addon-serialize, @xterm/addon-web-links`: terminal features may depend on them via string import — verify before removing.
- [x] 3.4 Server `drizzle-zod, fuse.js, glob, node-pty, simple-git`: verify — some may be used via dynamic imports or by build tooling.
- [x] 3.5 DevDeps (msw, better-sqlite3 in client, @types/*): verify and remove.
- [x] 3.6 Run full install `pnpm install` after each removal; run tests.

## 4. Validation

- [x] 4.1 `npx knip --no-progress --reporter compact` — unused files count ≤ 1 (drizzle configs may legitimately stay if they're build-time); unused exports count ≤ 10 (prop types excluded from target).
- [x] 4.2 `pnpm -r tsc --noEmit` clean.
- [x] 4.3 Full test suite: shared 41, summoner 305, server 464, client 773 green.
- [x] 4.4 `openspec validate cleanup-dead-code` passes.
