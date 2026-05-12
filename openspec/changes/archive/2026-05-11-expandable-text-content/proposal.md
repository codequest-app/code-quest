## Why

`TruncatedContent` 的截斷邏輯目前散落在各個內容元件（`TextContent` 自己包住截斷），且 assistant text block 完全漏掉截斷，導致長回覆不可收合。元件命名也描述實作細節而非使用意圖。

## What Changes

- 將 `TruncatedContent` 改名為 `Expandable`，名稱改為描述行為（可展開）
- 從 `TextContent` 內部移除 `Expandable` 包裹，讓內容元件只負責 render
- 在 `NodeContent` / `AssistantTurnContent` 的 caller 層根據 message type 決定是否包 `Expandable`
- 補上 `AssistantTurnContent` text block 的 `Expandable` 包裹（目前缺漏）
- 補上 `StreamlinedTextContent`（fast mode）的 `Expandable` 包裹

## Capabilities

### New Capabilities

- `expandable-text-content`: 長文字訊息（user / assistant text block）自動截斷並提供展開按鈕，截斷邏輯統一由 caller 層組合，內容元件本身不感知截斷

### Modified Capabilities

（無 spec-level 行為變更）

## Impact

- `apps/web/src/components/chat/renderers/TruncatedContent.tsx` → 改名為 `Expandable.tsx`
- `apps/web/src/components/chat/renderers/content/TextContent.tsx` — 移除內部 `Expandable`
- `apps/web/src/components/chat/renderers/content/AssistantTurnContent.tsx` — text block 加上 `Expandable`
- `apps/web/src/components/chat/conversation/NodeContent.tsx` — text type 加上 `Expandable`
- `apps/web/src/components/chat/tool-use/message-blocks/SystemBlocks.tsx` — `StreamlinedTextContent` 加上 `Expandable`
- 所有 import `TruncatedContent` 的地方改為 `Expandable`
