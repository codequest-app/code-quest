## 1. 建 renderableGroups generator + childrenIndex

- [x] 1.1 `renderableGroups(messages)` — generator，一次遍歷 yield `RenderGroup`
- [x] 1.2 `buildChildrenIndex(messages)` — `Map<parentToolUseId, Message[]>`
- [x] 1.3 測試：renderableGroups 單元測試（8 tests）
- [x] 1.4 測試：childrenIndex 單元測試

## 2. NodeContent 改接 Message

- [x] 2.1 NodeContent props 從 `node: MessageNode` 改為 `message: Message`
- [x] 2.2 NodeContent 接受 `childrenIndex` prop + `onStopTask`，自己 render children
- [x] 2.3 ChatMessage wrapper 同步更新
- [x] 2.4 測試：全部 green

## 3. 切換 MessageList

- [x] 3.1 MessageList 改用 `renderableGroups` + `childrenIndex`
- [x] 3.2 RenderGroup type 改為 `messages: Message[]` / `message: Message`
- [x] 3.3 getGroupKey 測試更新
- [x] 3.4 測試：全部 green

## 4. 切換 CollapsibleTimeline + SubagentChildren

- [x] 4.1 childrenIndex 從 MessageList 透過 CollapsibleTimeline 傳到 NodeContent
- [x] 4.2 SubagentChildren 改接 `messages: Message[]`
- [x] 4.3 NodeContent 用 getMessageToolId + getMessageModel 從 Message 讀
- [x] 4.4 測試：2058 tests green

## 5. 刪除舊結構

- [x] 5.1 CollapsibleTimeline 改接 `messages: Message[]`
- [x] 5.2 `tool-utils` 的 `splitTimelineRuns` / `buildGroupChips` 改接 `Message[]`
- [x] 5.3 刪除 `message-tree.ts`（buildMessageTree、MessageNode、nestChild、groupForTimeline、filterTree）
- [x] 5.4 清理 import + 刪除舊 tests
- [x] 5.5 測試：2050 tests green

## 6. 精準 re-render

- [x] 6.1 NodeContent 加 `React.memo`
- [x] 6.2 per-toolId selectors（task/result 不讀 full Map）
- [x] 6.3 `ToolUseBlockWithStore` — assistant_turn blocks 有自己的 per-toolId selectors
- [x] 6.4 `renderMessageBody` 消除，改為 `renderContent`（不傳 Maps）
