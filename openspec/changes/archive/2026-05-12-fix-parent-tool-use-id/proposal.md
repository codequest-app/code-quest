## Why

Subagent 內部的 user message（有 `parentToolUseId`）在 history replay 時沒有被正確歸類到子層，導致它們出現在頂層 timeline，顯示為純文字 prompt，而非在 Agent block 的子層 timeline 裡。

## What Changes

- `applyUserContent` 加入 `parentToolUseId` 參數，建立 message 時帶入此欄位
- `onMessageUser` handler 將 `p.parentToolUseId` 傳入 `applyUserContent`
- 補充測試：有 `parentToolUseId` 的 user message 應進入 `childrenIndex` 而非頂層

## Capabilities

### New Capabilities

- `subagent-user-message-routing`: subagent 內部 user message 正確歸屬到父層 Agent tool_use 的子層 timeline

### Modified Capabilities

（無 spec 層級的行為變更）

## Impact

- `apps/web/src/contexts/channel/handlers/message.ts`
- `apps/web/src/utils/renderable-groups.ts`（邏輯不變，但現在有正確輸入才能測到）
- `apps/web/src/contexts/channel/handlers/__tests__/`（新增測試）
