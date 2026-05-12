## Why

`buildMessageTree` 每次 messages 變化都 O(n) 重建整棵 tree（`MessageNode[]`），產生新的 reference，導致 React 無法精準判斷哪些 component 需要 re-render。資料層（messages）和 view 層（tree nesting）混在一起 — `nestChild` 在資料遍歷時做了 view 的事。

tool_result 到達時應該只更新一個 ToolUseBlock，但現在整棵 tree 重建，所有 component 都可能 re-render。

## What Changes

- 移除 `buildMessageTree` 和 `MessageNode` — 不再建 tree
- messages 保持 flat array，component 層自己決定 nesting
- 用 generator pipeline 一次遍歷 messages，yield renderable groups（取代 buildMessageTree + groupForTimeline 兩步）
- 建 `childrenIndex: Map<parentToolUseId, Message[]>` 供 parent component 找 children
- `tasks` 和 `results` 已在 store — state 更新精準，只觸發對應 component re-render
- 搭配 `React.memo` 確保 virtualizer 中的 component 不重複 render

## Capabilities

### New Capabilities
- `flat-message-rendering`: 資料 flat、state 精準更新、component 層處理 nesting

### Modified Capabilities

## Impact

- `apps/web/src/utils/message-tree.ts` — 移除 `buildMessageTree`、`MessageNode`、`nestChild`；保留 `groupForTimeline`（或改為 generator）、`filterTree`（改為 flat filter）
- `apps/web/src/components/chat/conversation/MessageList.tsx` — 改用 generator pipeline 或 flat grouping
- `apps/web/src/components/chat/conversation/NodeContent.tsx` — 接 `Message` 而非 `MessageNode`，children 從 index 找
- `apps/web/src/components/chat/conversation/CollapsibleTimeline.tsx` — 接 `Message[]` 而非 `MessageNode[]`
- `apps/web/src/components/chat/conversation/SubagentChildren.tsx` — 從 `childrenIndex` 取 children
- TDD 重構：所有既有測試 expect 不變或等價
