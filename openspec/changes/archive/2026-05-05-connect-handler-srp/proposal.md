## Why

`packages/server/src/socket/handlers/session/connect.ts` 的多個函式混合了 orchestration 與 detail：

- `applyInitResponseAndBroadcast`：parse + persist（settingsStore）+ 多個 broadcast，命名只說 "apply + broadcast" 但同時做持久化
- `finalizeAndNotify`：7 個步驟全在一個函式，orchestration 與 detail 無法分辨
- `handleResume`：85 行，parse / 查詢 / spawn / ack / chain override / dead session 全混
- `onSessionInit`：3 個不同關切（broadcast state、DB upsert、project upsert）在同一 handler

## What Changes

- 拆出純函式：`parseInitResponse`、`cacheModels`、`ackAndBroadcastCreated`
- `handleResume` 拆出步驟函式：`resolveResumeCwd`、`spawnResumeChannel`
- `onSessionInit` 的 DB/project 操作移到各自的 service 監聽層
- 函式名稱如實反映行為（同時做 A+B 的，名字要說 A+B 或拆開）

## Impact

- `packages/server/src/socket/handlers/session/connect.ts`
- `packages/server/src/__tests__/session-connect.test.ts`（expect 不變）
