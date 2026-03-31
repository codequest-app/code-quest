## Context

Server 的 `broadcastSessionState` 已經用 `io.emit('session:states', ...)` 廣播 `state: 'busy' | 'idle' | 'exited'` 給所有 client。Client 的 `ChannelConfigContext` 已經監聽 `session:states` 更新 model/permissionMode/effort。但 `channelState.status`（控制 spinner 和 stop 按鈕）由 `ChannelMessagesContext` 管理，它不監聽 `session:states`。

## Goals / Non-Goals

**Goals:**
- B 視窗收到 `session:states { state: 'busy' }` → spinner 出現、send 按鈕變 stop
- B 視窗收到 `session:states { state: 'idle' }` → spinner 消失、stop 變回 send
- 不影響 A 視窗自己的 status 更新流程（A 用 local `'processing'` state）

**Non-Goals:**
- 同步具體的 streaming content（已由 channel socket events 處理）
- 同步 control request banners（已由 `chat:cancel_request` 處理）

## Decisions

### 在 ChannelMessagesContext 監聽 session:states
`channelState.status` 由 ChannelMessagesContext 管理。在該 context 的 socket listener 中加入 `session:states` handler，僅更新 status：
- `state === 'busy'` → status `'busy'`
- `state === 'idle'` → status `'idle'`
- `state === 'exited'` → status `'disconnected'`

不動 ChannelConfigContext（它只負責 config，不管 status）。

### 避免覆蓋本地 processing/cancelling 狀態
A 視窗自己 send message 後 status 是 `'processing'`（local），之後 server broadcast `'busy'`。不應該讓 broadcast 覆蓋自己的 `'processing'` — 所以只在 status 不是 `'processing'` 或 `'cancelling'` 時才更新。

## Risks / Trade-offs

- [Race condition] A 發 message，status 設 processing，然後收到自己的 broadcast busy — 不應覆蓋。解法：只在 status 為 idle/busy/disconnected 時接受 broadcast 更新。
