## 1. Server — FilesystemService 可注入

- [x] 1.1 在 `server/src/types.ts` 新增 `TYPES.FilesystemService`
- [x] 1.2 在 `server/src/container.ts` 綁定 `LocalFilesystemService` 到 `TYPES.FilesystemService`
- [x] 1.3 修改 `server.ts`：從 container 取 `FilesystemService` 而非直接 `new LocalFilesystemService()`
- [x] 1.4 修改 `create-test-container.ts`：加 `filesystemService` override，有提供就 rebind
- [x] 1.5 跑全套 server 測試確認行為不變

## 2. FakeFilesystemService

- [x] 2.1 在 `summoner/src/test/` 建立 `FakeFilesystemService`，實作 `FilesystemService` interface（in-memory）
- [x] 2.2 實作 setup API：`setRoots()`、`addDirectory()`、`addFile()`、`reset()`
- [x] 2.3 實作 `browseDirectories()`：無 path → 回傳 roots；有 path → 查 dirs map
- [x] 2.4 實作 `listFiles()`：查 dirs + files，簡單 pattern match
- [x] 2.5 實作 `readFile()`：查 files map，不存在回傳 error
- [x] 2.6 為 FakeFilesystemService 撰寫測試

## 3. FakeSummoner

- [x] 3.1 在 `summoner/src/test/` 建立 `FakeSummoner` class：持有 `FakeFilesystemService`、建立 container、register server
- [x] 3.2 實作 `.filesystem` property — 回傳共享的 FakeFilesystemService
- [x] 3.3 實作 `.claude()` factory — 建立 socket、connect 到 server、回傳 FakeClaude
- [x] 3.4 從 `summoner/src/test/index.ts` export `FakeSummoner` 和 `createFakeSummoner`

## 4. FakeClaude 重構

- [x] 4.1 修改 `server/test/fake-claude.ts`：constructor 改為接收 socket + container（不再自己 new）
- [x] 4.3 將 FakeIO 邏輯（fakeIO.on('connection'), fakeIO.emit）搬到 FakeSummoner
- [x] 4.4 `createFakeClaude()` 無參數版本改為 `createFakeSummoner().claude()`
- [x] 4.5 跑全套 server 測試確認行為不變

## 5. FakeClaude 自動記錄 events + 遷移 tests

- [x] 5.1 FakeClaude 新增 `collect(event)` method（暫時方案）
- [x] 5.2 FakeClaude 自動記錄所有 socket events：hook fake socket 的 event delivery，內部存 `Array<{ event, payload }>`
- [x] 5.3 FakeClaude 新增 `events(eventName?)` 查詢方法：有 name → 回傳該 event 的 payloads；無 name → 回傳全部（含 event name）
- [x] 5.4 移除 `collect()` 和 `on()` — 改用 `events()` 取代
- [x] 5.5 遷移 `channel-bind-runner.test.ts`：`claude.socket.on` → `claude.events()`
- [x] 5.6 遷移 `channel-manager.test.ts`
- [x] 5.7 遷移 `auth.test.ts`
- [x] 5.8 遷移 `speech.test.ts`
- [x] 5.9 遷移 `settings.test.ts`
- [x] 5.10 遷移 `mcp.test.ts`
- [x] 5.11 遷移 `session-fork.test.ts`
- [x] 5.12 遷移 `message.test.ts`：+ `summoner.claude()` 取代 `socket2`
- [x] 5.13 遷移 `session-command.test.ts`：+ `summoner.claude()` 取代 `socketB`
- [x] 5.14 遷移 `permission.test.ts`：+ `summoner.claude()` 取代 `socketB`
- [x] 5.15 遷移 `session-connect.test.ts`：+ `summoner.claude()` + `disconnect()`
- [x] 5.16 FakeClaude socket 暫保 public（待 FakeSummonerFactory 重構後改 private）
- [x] 5.17 全套 server + client 測試通過

## 6. FakeSummonerFactory 重構（socket private 的正確做法）

- [x] 6.1 重新命名：FakeSummoner → FakeSummonerFactory（共享 server + filesystem）
- [x] 6.2 新建 FakeSummoner class（per-window：socket + lazy claude getter）
- [x] 6.3 FakeSummonerFactory.create() → 回傳 FakeSummoner
- [x] 6.4 FakeSummoner.claude lazy getter
- [x] 6.5 不需要 render — summoner 不管 React，test 用 summoner.socket
- [x] 6.6 FakeSummoner.events() / .send() / .disconnect() / .on() / .connected
- [ ] 6.7 FakeClaude socket 改為 private（待 client 遷移 renderWithWorkspace 後）
- [x] 6.8 遷移 server tests（message, session-command, permission, session-connect）
- [ ] 6.9 遷移 client tests（useExplorerBrowse 已用新 API，其他待遷移）
- [x] 6.10 全套 server 433 + client 722 測試通過

## 7. 驗證

- [x] 7.1 用新 API 寫一個 multi-window integration test
- [x] 7.2 用新 API 寫一個 filesystem integration test
- [x] 7.3 跑全套測試確認向後相容

## 8. FakeServer 分離 + API 精簡

目標 API：
```typescript
// 單視窗（不需 server internals）
const summoner = createFakeSummoner();
const claude = summoner.claude();
summoner.filesystem().setRoots(['/app']);

// 單視窗（需要 server internals）
const server = createFakeServer();
const summoner = createFakeSummoner(server);
server.container.get(TYPES.SessionStore); // server internals

// 多視窗
const server = createFakeServer();
const windowA = createFakeSummoner(server);
const windowB = createFakeSummoner(server);
```

消除：`createFakeClaude()`、`FakeSummonerFactory`、FakeClaude self-setup、getter、container on FakeClaude/FakeSummoner

### 8.1 新建 FakeServer ✅

- [x] 8.1.1 新建 `FakeServer` class
- [x] 8.1.2 `FakeServer.connect()` 回傳 `{ socket, provider, filesystem }`
- [x] 8.1.3 `createFakeServer()` factory function
- [x] 8.1.4 FakeServer 測試

### 8.2 FakeSummoner/FakeClaude getter → method ✅

- [x] 8.2.1 `claude` getter → `claude()` method
- [x] 8.2.2 `send()` 內部改呼叫 `this.claude().send()`
- [x] 8.2.3 更新 server + client tests
- [x] 8.2.4 全套測試通過

### 8.3 消除 createFakeClaude ✅

- [x] 8.3.1 所有 `createFakeClaude()` → `createFakeSummoner().claude()`
- [x] 8.3.2 刪除 `createFakeClaude()` + client FakeClaude
- [x] 8.3.3 FakeClaude self-setup branch 移除
- [x] 8.3.4 全套測試通過

### 8.4 消除 FakeSummonerFactory ✅

- [x] 8.4.1 多視窗 tests 遷移到 `createFakeServer()` + `createFakeSummoner(server)`
- [x] 8.4.2 刪除 `FakeSummonerFactory` + `createFakeSummonerFactory()`
- [x] 8.4.3 client 清理（刪 client FakeClaude、簡化 fake-summoner re-export）
- [x] 8.4.4 全套測試通過

### 8.5 移除 container 依賴 — FakeClaude/FakeSummoner 搬到 summoner

- [x] 8.5.1 rename `summoner/test/fake-claude.ts` → `summoner/test/segments.ts`
- [x] 8.5.2 FakeServer 改為接收外部 container：`createFakeServer(container?)`
- [x] 8.5.3 `createFakeSummoner()` 無參數時自建 container + server
- [x] 8.5.4 FakeServer.connect() 回傳 `{ socket, provider, filesystem }`
- [x] 8.5.5 FakeSummoner constructor 改為 `(socket, provider, filesystem)` — 移除 container
- [x] 8.5.6 FakeClaude constructor 改為 `{ socket, provider }` — 移除 container
- [x] 8.5.7 server tests：`claude.container.get(...)` → `container.get(...)`（52 處）
- [x] 8.5.8 搬 FakeClaude + FakeSummoner 到 summoner/test
- [x] 8.5.9 server fake-summoner.ts 只保留 FakeServer + factory functions
- [x] 8.5.10 createTestContainer() 預設用 FakeFilesystemService
- [x] 8.5.11 全套 summoner 303 + server 434 + client 720 + 1 todo 通過

### 8.6 Rename + 搬測試 + ServerConnector interface

- [x] 8.6.1 Rename `server/test/fake-summoner.ts` → `server/test/fake-server.ts`
- [x] 8.6.2 summoner 定義 `ServerConnector` interface
- [x] 8.6.3 summoner `createFakeSummoner(server: ServerConnector)`
- [x] 8.6.4 server `createFakeSummoner(server?)` wrapper
- [x] 8.6.5 FakeSummoner 整合測試留 server（需要 initialize → server handlers）
- [x] 8.6.6 Rename `server/__tests__/fake-summoner.test.ts` → `fake-server.test.ts`
- [x] 8.6.7 全套測試通過

### 8.7 最終清理

- [x] 8.7.1 FakeClaude socket 改為 private
- [x] 8.7.2 client `fake-summoner.ts` 保留（TypedSocket override，19 處使用）
- [x] 8.7.3 client `make-fake-socket.ts` 已刪（無使用者）
- [x] 8.7.4 全套 summoner 303 + server 434 + client 720 + 1 todo 通過

### 8.8 FakeSummoner constructor 接受 ServerConnector

- [ ] 8.8.1 summoner FakeSummoner constructor 改為 `(server: ServerConnector)`
- [ ] 8.8.2 `createFakeSummoner` 簡化為 `new FakeSummoner(server)`
- [ ] 8.8.3 server `createFakeSummoner` 同步更新
- [ ] 8.8.4 client `createFakeSummoner` 同步更新
- [ ] 8.8.5 全套測試通過
