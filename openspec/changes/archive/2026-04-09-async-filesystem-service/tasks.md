## 1. Interface & Types

- [x] 1.1 修改 `FilesystemService` interface — 三個方法回傳改為 `Promise<>`
- [x] 1.2 更新 `summoner/src/index.ts` export（如有需要）

## 2. LocalFilesystemService 實作

- [x] 2.1 `browseDirectories` 改用 `readdir` from `node:fs/promises`
- [x] 2.2 `listFiles` 改用 async `glob`（取代 `globSync`）
- [x] 2.3 `readFile` 改用 `readFile` from `node:fs/promises`

## 3. FakeFilesystemService

- [x] 3.1 方法簽名改 async，回傳 `Promise.resolve(result)`

## 4. Handler 呼叫端

- [x] 4.1 `explorer.ts` handler 加 `async` + `await`
- [x] 4.2 `file.ts` handler 加 `async` + `await`

## 5. 測試

- [x] 5.1 `local-filesystem-service.test.ts`（summoner）— 測試改 async/await
- [x] 5.2 `fake-filesystem-service.test.ts`（summoner）— 測試改 async/await
- [x] 5.3 `explorer.test.ts`（server）— 確認 async handler 正確回應
- [x] 5.4 `file.test.ts`（server）— 確認 async handler 正確回應
- [x] 5.5 `explorer-utils.test.ts`（server）— 如有直接呼叫需改 async
