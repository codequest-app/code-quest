## 1. 建立 Channel Store

- [x] 1.1 zustand 已在 dependencies
- [x] 1.2 `stores/channels-store.ts` — useChannelsStore（global `Map<channelId, ChannelState>`）
- [x] 1.3 `stores/ChannelStoreContext.tsx` — useChannelStore(selector) hook（per-channel convenience）
- [x] 1.4 測試：channels-store.test.ts（7 tests）

## 2. Provider 接入 store

- [x] 2.1 ChannelMessagesProvider 的 setChannelState 寫入 useChannelsStore
- [x] 2.2 channelState 從 useChannelsStore selector 讀取（取代 useState）
- [x] 2.3 確認所有既有 tests green（2042 passed）

## 3. Consumer 遷移

- [x] 3.1 MessageList — useChannelStore selectors（messages, status, statusText, taskProgressText）
- [x] 3.2 ChatView — useChannelStore(s => s.messages)
- [x] 3.3 RewindDialog — useChannelStore(s => s.messages)
- [x] 3.4 ComposeInput — useChannelStore(isProcessing, historyMessages)
- [x] 3.5 ChatInputArea — useChannelStore(s => s.modifiedFiles)
- [x] 3.6 ComposeToolbar — useChannelStore(isProcessing, isCancelling, stats, isContextCompressed)
- [x] 3.7 PlanReviewBanner — useChannelStore(s => s.planComments)
- [x] 3.8 ToolUseBlock — useChannelStore(s => s.tasks.get(toolId))

## 4. 移除 per-channel store + messageRegistryStore

- [x] 4.1 CommandPalette 改從 useChannelsStore 讀取
- [x] 4.2 移除 useMessageRegistryStore（deleted）
- [x] 4.3 移除 ChannelMessagesProvider 中 registry sync 邏輯
- [x] 4.4 移除 per-channel createChannelStore（deleted channel-store.ts）
- [x] 4.5 移除 ChannelStoreContext.Provider wrapper
- [x] 4.6 useChannelStore 改為從 ChannelMetaContext + useChannelsStore 讀取

## 5. 移除 Task dual-write

- [x] 5.1 system.ts — task handlers 不再 patchToolUseMeta
- [x] 5.2 patchToolUseMeta 函式已刪除
- [x] 5.3 mergeToolResult 不再 patch block.meta.taskStatus
- [x] 5.4 tool_result auto-complete 移到 message handler（寫 state.tasks）
- [x] 5.5 ToolUseBlock / TaskBadge 從 store selector 讀取 task

## 6. 清理

- [x] 6.1 移除 task-store.ts（useTask + useRunningTaskProgress 已無 consumer）
- [x] 6.2 移除 MessagesStateContext 中 taskStore 欄位
- [x] 6.3 移除 useTask / useTaskProgressText exports
- [x] 6.4 enabledTypes 留在 usePreferencesStore（global preference，非 per-channel）
      MessageVisibilityContext 保留（group toggle UI helper）

## 7. 未來可選（不 block，漸進清理）

剩餘 useChannelMessages consumers 只讀 actions（abort, sendMessage, searchFiles 等）。
移除 MessagesStateContext 需要把 actions 改為獨立 context 或 store method，涉及
interface 變更和所有 test setup。功能上不影響 — store 已是 source of truth。

- [ ] 7.1 把 actions 抽成獨立的 ChannelActionsContext（不含 state）
- [ ] 7.2 移除 MessagesStateContext + legacy state value 組裝
- [ ] 7.3 useChannelMessages 改為只回傳 actions（或移除）
