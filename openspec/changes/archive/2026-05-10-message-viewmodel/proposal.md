## Why

MessageList 的資料組裝散在三個地方：handler（patchMeta）、buildMessageTree（mergeToolResult）、component（useChannelStore + meta 解構）。Component 需要自己從 `message.meta` 和 store 挖資料組裝 props，導致 render 邏輯和資料邏輯耦合。換一種呈現方式就要改 component 內部邏輯。

## What Changes

- 新增 `toViewModel(node, ctx)` 函式，將 `MessageNode` + context（tasks Map）轉換為 discriminated union `ViewModel`
- 新增 `ViewModelRenderer` component，根據 `ViewModel.kind` 分派到對應的純呈現 component
- 漸進遷移 `renderBody` 中所有 message type 到 ViewModel 模式
- `ToolUseBlock` 不再依賴 `useChannelStore`，所有資料由 ViewModel 傳入
- 最終移除 `mergeToolResult`，tool_result 保留為獨立 message，ViewModel 轉換時用 toolId lookup 關聯
- children（subagent）遞迴套用同一個 `toViewModel`，ctx 傳遞不變

## Capabilities

### New Capabilities
- `message-viewmodel`: ViewModel 轉換層，將 MessageNode + context 轉為 typed ViewModel，component 只做純呈現

### Modified Capabilities

## Impact

- `apps/web/src/components/chat/` — 新增 `viewmodel/` 目錄放 toViewModel + ViewModelRenderer
- `apps/web/src/components/chat/conversation/MessageContent.tsx` — renderBody 漸進替換為 ViewModelRenderer
- `apps/web/src/components/chat/tool-use/message-blocks/ToolUseBlock.tsx` — 移除 useChannelStore 依賴，改為接受 ViewModel props
- `apps/web/src/utils/message-tree.ts` — 最終移除 mergeToolResult
- `apps/web/src/contexts/channel/handlers/` — 不改（handler 保持現狀）
- TDD 重構：所有既有測試的 expect 不變或等價
