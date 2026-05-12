## Why

`chat/tool-use/message-blocks/` 這個子目錄命名意義不明確，且混放了兩類性質不同的東西：
1. **跨層 UI 原語**（`primitives.tsx`、`CopyButton.tsx`、`message-type-icons.tsx`）— 被 `ThinkingBlock`、`Copyable`、`SubagentChildren` 等 tool-use 無關的元件引用
2. **tool-use 專屬 render 元件**（`ToolUseBlock`、`SystemBlocks`、`HookBlocks` 等）— 只在 tool-use 內部使用

這造成跨層的 import 路徑混亂，也讓 `chat/tool-use/` 的結構不直觀。

## What Changes

- **`primitives.tsx`** → 移到 `chat/renderers/primitives.tsx`（CollapsibleBlock、RotatableChevron 等跨層原語）
- **`CopyButton.tsx`** → 移到 `chat/renderers/CopyButton.tsx`（Copyable.tsx 已在 renderers 層）
- **`message-type-icons.tsx`** → 移到 `chat/tool-use/message-type-icons.tsx`（只在 tool-use 內部用，但不需要 message-blocks 子層）
- **其餘 tool-use 專屬檔案** → 移到 `chat/tool-use/`（拿掉 `message-blocks/` 這一層）
  - `ToolUseBlock.tsx`, `ToolResultBlock.tsx`, `ToolBlock.tsx`
  - `SystemBlocks.tsx`, `HookBlocks.tsx`
  - `ContentRenderer.tsx`, `TaskBadge.tsx`, `ToolUseHeader.tsx`, `AlertBanner.tsx`
  - `index.ts`
- 更新所有 import 路徑
- 刪除空的 `message-blocks/` 目錄

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

（無 spec-level 行為變更，純目錄重組）

## Impact

- `apps/web/src/components/chat/tool-use/message-blocks/` — 整個目錄消失
- `apps/web/src/components/chat/renderers/` — 新增 `primitives.tsx`、`CopyButton.tsx`
- `apps/web/src/components/chat/tool-use/` — 新增所有原 message-blocks 內的 tool-use 專屬檔案
- 所有 import `message-blocks/` 的地方更新路徑
