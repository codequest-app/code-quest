## Why

`Expandable` 目前預設收合（`defaultOpen=false`），無論訊息是 live 還是 history。這導致：
- Live 模式（正在接收回覆）：使用者需要手動展開才能看到內容，體驗差
- History 模式：只有最後一則應該展開，其餘收合以節省空間；但目前全部收合，最後一則也需手動展開

## What Changes

- `Expandable` 新增 `defaultOpen` prop（預設 `false`）
- `NodeContent` text type 傳入 `defaultOpen={isLastTurn ?? false}`
- `AssistantTurnContent` text block 傳入 `defaultOpen={isLastTurn ?? false}`
- `StreamlinedTextContent` 接收並傳入 `defaultOpen` prop
- streaming 中使用者手動展開/收合的狀態**自然保留**（`block.id` 穩定，React 不 remount，`useState` 不重置）

## Capabilities

### New Capabilities

- `expandable-default-open`: Expandable 根據 live/history 決定預設展開狀態，最後一則或 live 訊息預設展開，history 舊訊息預設收合

### Modified Capabilities

（無 spec-level 行為變更）

## Impact

- `apps/web/src/components/chat/renderers/Expandable.tsx` — 新增 `defaultOpen` prop
- `apps/web/src/components/chat/conversation/NodeContent.tsx` — text type 傳 `defaultOpen={isLastTurn}`
- `apps/web/src/components/chat/renderers/content/AssistantTurnContent.tsx` — text block 傳 `defaultOpen={isLastTurn}`
- `apps/web/src/components/chat/tool-use/message-blocks/SystemBlocks.tsx` — `StreamlinedTextContent` 接收 `defaultOpen`
