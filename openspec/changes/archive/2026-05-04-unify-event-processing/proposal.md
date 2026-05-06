## Why

CLI live stream 和 DB history replay 都傳遞相同的 `ClientMessage[]`，但走兩條獨立的處理路徑，導致同一批事件在 live 和 reload 後產出不同的 UI 訊息。

Live stream 透過 socket handlers（`onErrorMessage` 等）逐筆處理；history replay 透過 `buildMessagesFromHistory` 批次處理。兩者邏輯各自實作，日後必然 diverge。

## What Changes

提取 event→message 的轉換邏輯為共用純函式，讓 `buildMessagesFromHistory` 和 live stream handlers 走同一套 code path，對相同的 `ClientMessage[]` 產出相同的 `Message[]`。

## Capabilities

### New Capabilities

- `unify-event-processing`: 相同的 `ClientMessage[]` 序列，無論透過 live stream 或 history replay，產出完全相同的 `Message[]`。

## Impact

- `packages/client/src/utils/message.ts` — 提取共用轉換邏輯
- `packages/client/src/contexts/channel/handlers/system.ts` — 使用共用邏輯
