## Context

WsTransport 目前沒有斷線重連事件補發機制。browser 斷線後 reconnect，所有中間的 server→client 事件遺失，UI 狀態不同步。

main branch 有 `ResumableSocket` + `ResumableConnectionRegistry`，但從未接線。本 branch 已刪除。需要以 middleware 形式重新設計。

現有 middleware 架構（heartbeat、auth）操作 `RpcSocket` 層（`context.socket`），但 `ResumableSocket` 需要包裝 `TypedSocket`（由 `WsTransport.acceptConnection` 內的 `makeTypedSocket` 建立）。

## Goals / Non-Goals

**Goals:**
- Server 端 buffer 近期 outbound events，client reconnect 時 replay 遺漏
- 以 WsTransport middleware 形式實作，與 auth/heartbeat 同層
- TTL 自動清理斷線 session，避免 memory leak
- 不需要外部 DI 或 ChannelManager 配合

**Non-Goals:**
- Client 端 sessionKey 傳遞（獨立後續處理）
- Server→client 全量狀態同步（gap 時發 refresh 信號，client 自行處理）
- SocketIoTransport 支援（只做 WsTransport）

## Decisions

### 1. transformSocket hook

middleware 無法直接包裝 TypedSocket（在 middleware 之後才建立）。新增 `context.transformSocket` hook：

- middleware 在 `await next()` 前設定 `context.transformSocket = (typed) => wrappedSocket`
- `WsTransport.acceptConnection` 在 `makeTypedSocket` 後呼叫 hook
- 最小侵入：acceptConnection 只加 3 行

**替代方案考慮：**
- 在 RpcSocket 層攔截 send() 解析 JSON 提取 seq → 每次 send 多一次 JSON.parse，效能差
- 新增 TypedSocket-level middleware 概念 → 架構改動太大
- 在 SocketServer.attachTransport 外部組裝 → 不是 middleware，需要新 DI

### 2. TTL 清理（非外部通知）

斷線後啟動 timer，TTL 到期刪除。reconnect 時取消 timer。

- middleware 閉包持有 registry + timers，完全自治
- 不需要 ChannelManager 或其他外部元件通知 session 結束
- 預設 TTL 5 分鐘，可配置

**替代方案考慮：**
- 顯式 invalidate API → 需要外部配合，耦合高
- 無清理 → memory leak

### 3. ResumableSocket 放 shared 而非 server

ResumableSocket 是 transport 層概念，與 server 業務邏輯無關。放在 `packages/shared/src/transport/` 與其他 transport 元件一致。

## Risks / Trade-offs

- [Ring buffer 固定大小] 高頻 emit 可能超出 buffer，導致 gap → 預設 500 足夠一般場景；gap 時發 `state:refresh_required` 信號
- [TTL 過短] 長時間斷線後 session 已清除 → client 收到 gap 信號，觸發全量刷新
- [seq 雙軌] WsTransport 的 wire seq 和 ResumableSocket 的 buffer seq 必須同步（都從 0 開始、每次 emit +1）→ 由 ResumableSocket.emit 委託 inner.emit 確保
