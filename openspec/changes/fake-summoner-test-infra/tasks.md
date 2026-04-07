## 1. Server — FilesystemService 可注入

- [x] 1.1 在 `server/src/types.ts` 新增 `TYPES.FilesystemService`
- [x] 1.2 在 `server/src/container.ts` 綁定 `LocalFilesystemService` 到 `TYPES.FilesystemService`
- [x] 1.3 修改 `server.ts`：從 container 取 `FilesystemService` 而非直接 `new LocalFilesystemService()`
- [x] 1.4 修改 `create-test-container.ts`：加 `filesystemService` override，有提供就 rebind
- [x] 1.5 跑全套 server 測試確認行為不變

## 2. FakeFilesystemService

- [ ] 2.1 在 `summoner/src/test/` 建立 `FakeFilesystemService`，實作 `FilesystemService` interface（in-memory）
- [ ] 2.2 實作 setup API：`setRoots()`、`addDirectory()`、`addFile()`、`reset()`
- [ ] 2.3 實作 `browseDirectories()`：無 path → 回傳 roots；有 path → 查 dirs map
- [ ] 2.4 實作 `listFiles()`：查 dirs + files，簡單 pattern match
- [ ] 2.5 實作 `readFile()`：查 files map，不存在回傳 error
- [ ] 2.6 為 FakeFilesystemService 撰寫測試

## 3. FakeSummoner

- [ ] 3.1 在 `summoner/src/test/` 建立 `FakeSummoner` class：持有 `FakeFilesystemService`、建立 container、register server
- [ ] 3.2 實作 `.filesystem` property — 回傳共享的 FakeFilesystemService
- [ ] 3.3 實作 `.claude()` factory — 建立 socket、connect 到 server、回傳 FakeClaude
- [ ] 3.4 從 `summoner/src/test/index.ts` export `FakeSummoner` 和 `createFakeSummoner`

## 4. FakeClaude 重構

- [ ] 4.1 修改 `server/test/fake-claude.ts`：constructor 改為接收 socket + container（不再自己 new）
- [ ] 4.2 FakeClaude 的 socket 和 provider 改為 private
- [ ] 4.3 將 FakeIO 邏輯（fakeIO.on('connection'), fakeIO.emit）搬到 FakeSummoner
- [ ] 4.4 `createFakeClaude()` 無參數版本改為 `createFakeSummoner().claude()`
- [ ] 4.5 跑全套 server 測試確認行為不變

## 5. Client FakeClaude 跟進

- [ ] 5.1 修改 `client/test/fake-claude.ts`：跟隨 server FakeClaude 的 constructor 改動
- [ ] 5.2 跑全套 client 測試確認行為不變

## 6. 驗證 multi-window 和 filesystem 測試

- [ ] 6.1 用新 API 寫一個 multi-window integration test：`summoner.claude()` 兩次、join、驗證事件同步
- [ ] 6.2 用新 API 寫一個 filesystem integration test：`summoner.filesystem.addDirectory()` + `claude.send('explorer:browse')` 驗證完整 pipeline
- [ ] 6.3 跑全套測試（server + client + summoner）確認向後相容
