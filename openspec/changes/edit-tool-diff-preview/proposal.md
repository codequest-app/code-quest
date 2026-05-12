## Why

Edit/MultiEdit tool 的卡片只顯示 result message（"The file ... has been updated successfully."），不顯示 input（old_string → new_string）。連續多次對同檔案 edit 時，使用者看到 4 張一模一樣的卡片，無法區分差異。

另外 result 文字太長時不會自動換行，超出卡片寬度。

## What Changes

- `FileToolBody` 改為接收 `input`，顯示 diff preview（old_string → new_string）
- 修正 result 文字自動換行

## Capabilities

### New Capabilities

- `edit-tool-diff-preview`: Edit/MultiEdit tool 卡片顯示 diff preview

### Modified Capabilities

## Impact

- `apps/web/src/components/chat/tool-use/message-blocks/ToolUseBlock.tsx` — FileToolBody 改版
