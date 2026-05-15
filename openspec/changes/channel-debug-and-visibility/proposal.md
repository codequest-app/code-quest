## Why

Resume 後的 channel 在 web reload 時會消失：`ChannelManager.join()` lazy resume 路徑未設 `projectRoot`，導致 `handleInit` 回傳的 session 物件缺少必填欄位，Web 端 `initResponseSchema.safeParse()` 失敗後靜默丟棄整個 response，session 從 UI 消失但 CLI process 仍在執行。此外目前完全沒有辦法從外部觀察 server 內部的 channel 狀態，難以診斷此類問題。

## What Changes

- 新增 HTTP debug endpoint `GET /debug/channels`，回傳所有 channel 的即時狀態快照（channelId、sessionId、exited、isBound、isProcessing、cwd、projectRoot）
- 修正 `ChannelManager.join()` lazy resume 路徑：從 DB row 補上 `projectRoot`
- 修正 `handleInit`：`projectRoot` 改為 `ch.projectRoot ?? ch.cwd`，防止欄位缺失導致 parse 失敗

## Capabilities

### New Capabilities

- `channel-debug-endpoint`：HTTP GET `/debug/channels` 回傳 server 內所有 channel 的狀態快照，供開發診斷用

### Modified Capabilities

- `transport`：`ChannelManager.join()` 補設 `projectRoot`；`handleInit` 加 fallback，確保 `app:init` response 永遠通過 schema validation

## Impact

- `apps/server/src/socket/channel-manager.ts`：`join()` 從 DB 補 `projectRoot`
- `apps/server/src/socket/handlers/app.ts`：`handleInit` 的 `projectRoot` 加 `?? ch.cwd` fallback
- `apps/server/src/index.ts`（或 HTTP router）：新增 `/debug/channels` route
