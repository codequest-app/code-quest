## Why

`chat-handler.test.ts` 是 1371 行、78 tests 的 monolith，涵蓋 session、message、settings、control、MCP、plan、auth 等多個 domain。同時已有 `chat-handler-session.test.ts`、`chat-handler-settings.test.ts`、`chat-handler-control.test.ts`、`chat-handler-misc.test.ts` 等拆分後的檔案，但原始 `chat-handler.test.ts` 的 tests 沒有移除，造成大量重複：

- Session 相關：chat-handler.test.ts ~40 tests vs chat-handler-session.test.ts ~19 tests（重複覆蓋 create/join/fork/resume）
- Settings 相關：chat-handler.test.ts ~8 tests vs chat-handler-settings.test.ts ~15 tests（重複覆蓋 model/permission/effort）
- Control 相關：chat-handler.test.ts ~16 tests vs chat-handler-control.test.ts 已有（重複覆蓋 permission/cancel）

## What Changes

- 將 `chat-handler.test.ts` 中已在其他檔案有對應測試的 cases **移除**
- 將 `chat-handler.test.ts` 中**未被其他檔案覆蓋**的 tests 搬到對應的 handler test 檔案
- 清空或刪除 `chat-handler.test.ts`
- 確認搬移後零 test 重複、零 coverage 下降

## Capabilities

### New Capabilities

無新功能。純 test 重構。

### Modified Capabilities

無。只改 test 檔案位置，不改產品程式碼。

## Impact

- `apps/server/src/__tests__/chat-handler.test.ts` — 刪除或清空
- `apps/server/src/__tests__/chat-handler-session.test.ts` — 可能新增未覆蓋的 session tests
- `apps/server/src/__tests__/chat-handler-settings.test.ts` — 可能新增未覆蓋的 settings tests
- `apps/server/src/__tests__/chat-handler-control.test.ts` — 可能新增未覆蓋的 control tests
- `apps/server/src/__tests__/chat-handler-misc.test.ts` — 可能新增未覆蓋的 misc tests
- 可能新建：`chat-handler-message.test.ts`（message/streaming pipeline tests）
- 可能新建：`chat-handler-plan.test.ts`（plan comment tests）
- 356 server tests baseline，搬移後數量應相同
