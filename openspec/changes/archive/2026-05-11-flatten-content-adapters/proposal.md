## Why

`renderers/content/` 只是一個 adapter 層，四個檔案都只有一個 caller（`NodeContent`），沒有獨立存在的理由，增加了不必要的 indirection。

## What Changes

- 刪除 `renderers/content/ThinkingContent.tsx`：logic inline 進 `NodeContent` 的 `renderContent`
- 刪除 `renderers/content/ToolUseContent.tsx`：`ToolUseContent` 和 `ToolUseBlockWithStore` 移到 `tool-use/ToolUseBlock.tsx`
- 刪除 `renderers/content/TextContent.tsx`：inline 進 `NodeContent`
- 刪除 `renderers/content/AssistantTurnContent.tsx`：移到 `conversation/AssistantTurnContent.tsx`
- 刪除 `renderers/content/` 資料夾
- 更新所有 import

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
（無，純 refactor，無 API 或行為變更）

## Impact

- `src/components/chat/renderers/content/` — 整個刪除
- `src/components/chat/conversation/NodeContent.tsx` — inline ThinkingContent、TextContent
- `src/components/chat/tool-use/ToolUseBlock.tsx` — 新增 ToolUseContent、ToolUseBlockWithStore export
- `src/components/chat/conversation/AssistantTurnContent.tsx` — 從 renderers/content 移過來
