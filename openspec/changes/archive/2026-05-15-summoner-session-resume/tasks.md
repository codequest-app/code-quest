## 1. 將 WsClient 移至 shared

- [ ] 1.1 將 `apps/web/src/socket/ws-client.ts` 移至 `packages/shared/src/transport/ws-client.ts`
- [ ] 1.2 從 `packages/shared/src/node.ts` export `WsClient`
- [ ] 1.3 更新 `apps/web/src/socket/client.ts` 改從 `@code-quest/shared/node` import `WsClient`
- [ ] 1.4 確認 web 端測試（`ws-client.test.ts`）路徑更新後仍通過

## 2. 刪除 createConnectionLoop，summoner 改用 WsClient

- [ ] 2.1 `apps/summoner/src/main.ts`：移除 `WsTransport` + `createConnectionLoop`，改為 `new WsClient(url)` + `setLifecycleListener({ onOpen: () => agent.attach(client), onClose })`
- [ ] 2.2 刪除 `packages/shared/src/transport/connection-loop.ts`
- [ ] 2.3 從 `packages/shared/src/node.ts` 移除 `createConnectionLoop` export

## 3. 移除 grace period 與 buffer 上限

- [ ] 3.1 `Agent.onDisconnect()`：移除 `graceTimer` 啟動邏輯
- [ ] 3.2 移除 `GRACE_PERIOD_MS` 常數與 timeout 觸發的 `this.dispose()` 呼叫
- [ ] 3.3 `Agent.emitOrBuffer()`：移除 `STDOUT_BUFFER_CAP` 上限檢查，buffer 無上限累積直到重連 flush
- [ ] 3.4 移除 `STDOUT_BUFFER_CAP` 常數

## 4. 移除靜默 catch

- [ ] 4.1 移除 `RemoteProcessProvider.fireSpawn()` 的 `.catch(warn)`
- [ ] 4.2 移除 `ProcessHandle.send()` 的 `.catch(warn)`
- [ ] 4.3 移除 `ProcessHandle.abort()` 的 `.catch(warn)`

## 5. 測試

- [ ] 5.1 `WsClient`（shared）單元測試：斷線期間 request 排隊、重連後 flush、RESUME_EVENT 先送
- [ ] 5.2 `WsClient`（shared）單元測試：outbox overflow reject 最舊
- [ ] 5.3 `WsClient`（shared）單元測試：`state:refresh_required` 觸發 warning log
- [ ] 5.4 `Agent` 單元測試：斷線後 process 繼續跑（不被殺）、重連後 buffer flush
- [ ] 5.5 integration test：summoner 斷線重連後 `process.spawn` 正確執行（利用現有 FakeSummonerServer）
