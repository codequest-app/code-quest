## Context

CLI live stream 和 DB history replay 原本走兩條獨立路徑：
- **Live**: socket handlers（`onErrorMessage` 等）逐筆處理，透過 `router.register` + `wireStreamingHandlers`
- **History**: `buildMessagesFromHistory` 批次處理，邏輯各自實作

`f648fb40` 重構後，`onResult` 和 `onErrorMessage` 進入 `systemHandlerOn`，加上 `session:history` handler 直接 reduce 同一批 handlers，兩條路徑現在共用同一套轉換邏輯。

## Goals / Non-Goals

**Goals:**
- 相同的 `ClientMessage[]` 序列，live 和 history 產出相同的 `Message[]`
- `is_error=true` + result string → summoner emit `error:message`，live 和 history 都正確顯示 error banner
- `onResult` 在 `isError=true` 時不插入 result divider

**Non-Goals:**
- 多批次 history（StateBuffer）— 屬於 `session-history-improvements`
- Streaming delta（text/thinking streaming）— history 不需要，live 仍走 `wireStreamingHandlers`

## Decisions

### 用 handler map reduce 處理 history，而非獨立 buildMessagesFromHistory

History handler 直接 reduce `allHandlers`（`messageHandlerOn` + `systemHandlerOn` + `planHandlerOn` + `notificationHandlerOn`），不再維護獨立邏輯。

`message:assistant` 在 history 中用 `onMessageAssistant` 直接呼叫（而非 `wireStreamingHandlers`），因為 history 不需要 streaming refs 管理。

### sessionHandlerOn 排除在 history 之外

`sessionHandlerOn` 包含 `session:closed`、`session:states` 等 transient state，不應該被 history replay。

### 黑名單取代白名單（server side）

Server `HISTORY_EXCLUDE` denylist 取代原本的 `HISTORY_NAMES` allowlist。新事件類型預設包含在 history，只有 control events 和 transient state 明確排除。

## Risks / Trade-offs

- **Guard `if (prev.messages.length > 0) return prev`**：目前 history handler 有此 guard，防止 live events 先到時 history 覆蓋它。這是暫時方案，StateBuffer（Task #9）實作後可移除。

- **`error:message` 排除在 HISTORY_EXCLUDE 之外**：`error:message` 需要走 history，所以不能加入 denylist。summoner 的 `transformResult` 負責從 `is_error` result 產生 `error:message`，確保 live 和 history 的來源一致。
