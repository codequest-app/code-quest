## Why

render 層有三層中間轉換：`renderBody` → `toViewModel` → `ViewModelContent` switch → Component。ViewModel 型別是多餘的中間層 — component 的 props 本身就是 contract。`ChatMessage` 承擔了太多不屬於它的職責（user/assistant 分支、TruncatedContent、Copyable、store lookup）。

`buildMessageTree` 和 `ToolResultsContext` 分開傳遞 results，增加複雜度。

## What Changes

- 新增 `NodeContent` component — 一個 switch 從 `MessageNode` 分派到對應的 `XxxContent`
- `NodeContent` 接受 `node`、`task?`、`result?` 作為 props（parent lookup 後傳入）
- 各 `XxxContent` 接受 typed props（不是 message、不是 ViewModel）
- `buildMessageTree` 回傳 `{ roots, results }`，不需要 `ToolResultsContext`
- `CollapsibleTimeline` / `MessageList` 從 store 讀 tasks，lookup 後傳 prop 給 `NodeContent`
- 刪除 `toViewModel`、所有 ViewModel types、`ViewModelContent`、`renderBody`、`ChatMessage`、`ToolResultsContext`
- children 遞迴在 `NodeContent` 裡完成

## Capabilities

### New Capabilities
- `node-content`: 一個 switch component 取代 ViewModel 層 + ChatMessage + renderBody

### Modified Capabilities

## Impact

- `apps/web/src/components/chat/conversation/MessageContent.tsx` — 改為 `NodeContent` + switch
- `apps/web/src/components/chat/conversation/ChatMessage.tsx` — 刪除
- `apps/web/src/components/chat/viewmodel/` — 刪除整個目錄
- `apps/web/src/components/chat/conversation/ToolResultsContext.tsx` — 刪除
- `apps/web/src/components/chat/conversation/CollapsibleTimeline.tsx` — 改用 `NodeContent`
- `apps/web/src/components/chat/conversation/MessageList.tsx` — 改用 `buildMessageTree`
- `apps/web/src/components/chat/conversation/SubagentChildren.tsx` — 可能整合進 `NodeContent`
- TDD 重構：所有既有測試 expect 不變或等價
