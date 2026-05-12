# Channel State Zustand Migration

## What

將 `ChannelMessagesContext` 的 God context（MessagesStateContext + MessagesActionsContext）遷移至 zustand store。整條 message pipeline（store → filter → search → display）統一在一個 store 內用 selector 串接。

## Why

### 現有問題

1. **God context** — `MessagesStateContext` 混合 6+ domain（messages, tasks, status, stats, modifiedFiles, planComments, terminalSessions），任何一個變化觸發所有 25 個 consumer re-render
2. **Memo 衝突** — `ChatMessage` 用 `memo()` 阻擋不必要 re-render，但也阻擋了子元件透過 context 讀取其他 domain（如 tasks）
3. **Dual-write 殘留** — task-domain 被迫同時寫 `state.tasks` 和 `block.meta`，因為 ToolUseBlock 無法直接從 context 讀 tasks
4. **filter/search 分散** — message visibility 在獨立 context，search 在 component local state，無法統一 derive

### Zustand 解決

- 精確 selector：每個 component 只訂閱需要的 slice，不需要 memo
- 統一 pipeline：messages → filter → search → display 全是 selector
- Task domain 完整：ToolUseBlock 直接 `useChannelStore(s => s.tasks.get(toolId))`
- Handler 不變：`(state) => newState` 簽名完全相同

## Scope

- 新增 `useChannelStore`（zustand store）取代 `MessagesStateContext` + `MessagesActionsContext`
- Store 內含：messages, tasks, status, stats, statusText, modifiedFiles, planComments, terminalSessions, enabledTypes, searchQuery
- Pure mutators 進 store（clearMessages, addSystemMessage, etc.）
- Socket-dependent actions 保留精簡的 `ChannelRpcContext`
- 移除 `ChatMessage` memo（zustand selector 自帶效能保護）
- 移除 task dual-write（patchToolUseMeta 中 task 相關邏輯）
- 移除 `task-store.ts`（被 zustand selector 取代）

## Out of scope

- Config, Compose, Control contexts — 維持不動
- ChannelMetaContext, SocketRouterContext — infra 層不動
- Server-side 任何改動

## 約束

- **TDD 重構**：existing tests 的 expect 不變或等價
- **測試透過 protocol 發訊息**：用 FakeSummoner/FakeClaude emit segments 驗證
- **小步前進**：每步確保 all tests green 再繼續
