## Context

Server 的 channel 狀態完全存活在 `ChannelManager` 的記憶體 Map 中，外部無法觀察。目前已知兩個 bug 都源自 `projectRoot` 處理不一致：

1. `ChannelManager.join()`（lazy resume）不設 `projectRoot`，channel 的 `_projectRoot` 保持 `null`
2. `handleInit` 用條件 spread `...(ch.projectRoot ? { projectRoot } : {})`，當值為 `null` 時欄位消失
3. Web 端 `initResponseSchema.safeParse()` 因 `sessionStateSummarySchema` 的 `projectRoot` 為必填而失敗，靜默 return，sessions state 不更新

Server 已有 Express + `GET /health`，debug endpoint 直接掛上去即可，無需新依賴。

## Goals / Non-Goals

**Goals:**
- `GET /debug/channels` 回傳所有 channel 的即時快照，可用 curl 或瀏覽器診斷
- 修正 `join()` lazy resume 補 `projectRoot`
- 修正 `handleInit` 加 `?? ch.cwd` fallback，確保 app:init response 永遠通過 schema validation

**Non-Goals:**
- 不做認證（dev-only endpoint，production 可靠環境變數 guard 控制）
- 不做 Web UI debug panel（curl 夠用）
- 不改 `sessionStateSummarySchema`（schema 正確，是 server 資料有問題）

## Decisions

**Debug endpoint 放在 `bin/server.ts`，不放 SocketServer**

`SocketServer` 是 socket handler 的組裝點，不應承載 HTTP route 邏輯。`bin/server.ts` 已有 `app.get('/health', ...)` 的先例，`container` 在此可取得 `ChannelManager`，直接掛最省事。

**`join()` 從 `SessionLookup` interface 補 `resolveCwd` → 改用 `sessionStore.getByChannelId`**

`SessionLookup` interface 目前只暴露 `resolveSessionId` 和 `resolveCwd`，不夠拿 `projectRoot`。選項：
- 擴展 `SessionLookup` 加 `resolveProjectRoot(channelId)`
- 直接讓 `ChannelManager` 依賴 `SessionStore`

`ChannelManager` 已透過 `sessions: SessionLookup` 依賴，`SessionLookup` 是 interface，在 `SessionLookup` 加 `resolveProjectRoot` 最小侵入，不改依賴結構。

**`handleInit` fallback 用 `ch.projectRoot ?? ch.cwd`**

`cwd` 永遠有值（Channel constructor 保證），是最合理的 fallback，語意上 cwd 就是沒有 git root 時的 projectRoot。

## Risks / Trade-offs

- [Debug endpoint 無認證] → 只在 `NODE_ENV !== 'production'` 時掛載，或由 `config.debug` flag 控制；預設 production 不掛
- [SessionLookup 擴展破壞既有 mock] → 確認測試用的 fake 實作後一併更新

## Migration Plan

無 schema 變更，無 DB migration。部署後立即生效。
