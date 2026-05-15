## Why

Remote mode 下 server 的 `DirtyBroadcaster` 注入的是 `LocalWatchService`，watch 的是 server 本機的路徑，但實際檔案在 summoner 那台機器上。導致 remote mode 的 dirty broadcast（fs 變更通知、git 變更通知）從來不會觸發，功能是壞的。

`DirtyBroadcaster` 已經透過 constructor 注入 `WatchService`，架構上只需要在 remote mode 注入一個 `RemoteWatchService`，讓 summoner 負責實際的 watch 並透過 RPC 將事件推回 server。

## What Changes

- 新增 `RemoteWatchService`（server 端）：實作 `WatchService` 介面，subscribe/unsubscribe 透過 RPC 委派給 summoner
- 新增 summoner 端的 watch RPC handler：接收 server 的 subscribe/unsubscribe 指令，管理本機 `LocalWatchService`，有事件時推回 server
- `container.ts` 在 remote mode 下注入 `RemoteWatchService` 取代 `LocalWatchService`

## Capabilities

### New Capabilities
- `remote-watch-service`: server 在 remote mode 下透過 RPC 委派 watch 給 summoner，讓 dirty broadcast 在 remote mode 正常運作

### Modified Capabilities

## Impact

- `apps/server/src/remote/` — 新增 `RemoteWatchService`
- `apps/server/src/container.ts` — remote mode 注入 `RemoteWatchService`
- `apps/summoner/src/` — 新增 watch RPC handler
- `apps/summoner` ↔ `apps/server` RPC 協定新增 `watch:subscribe` / `watch:unsubscribe` / `watch:event`
