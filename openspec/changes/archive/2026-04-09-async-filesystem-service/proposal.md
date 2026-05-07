## Why

FilesystemService 的三個方法都用 sync API（readdirSync、readFileSync、globSync），在 socket handler 中呼叫會 block Node.js event loop。`listFiles` 的 `globSync` 掃整個 cwd 時延遲最明顯。改為 async 可避免阻塞其他連線的事件處理。

## What Changes

- **BREAKING**: `FilesystemService` interface 三個方法回傳值從同步改為 `Promise<>`
- `LocalFilesystemService` 改用 `readdir`、`readFile`、`glob`（async 版本）
- `FakeFilesystemService` 同步改 async（回傳 Promise）
- Socket handler 呼叫端（explorer、file）加 `await`

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `filesystem-service`: 方法簽名從 sync 改為 async（`Promise<>` return type）

## Impact

- `apps/summoner/src/filesystem/types.ts` — interface 改 async
- `apps/summoner/src/filesystem/local.ts` — 實作改 async API
- `apps/summoner/src/test/fake-filesystem-service.ts` — fake 改 async
- `apps/server/src/socket/handlers/explorer.ts` — await
- `apps/server/src/socket/handlers/file.ts` — await
- 所有相關測試需配合 async 調整
