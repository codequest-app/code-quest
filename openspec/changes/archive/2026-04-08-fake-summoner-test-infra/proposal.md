## Why

目前 test infra 有幾個問題：

1. **FakeClaude 同時是 server 又是 client** — constructor 裡 new container、new provider、new socket，職責混在一起
2. **FilesystemService 不可替換** — `server.ts` 裡直接 `new LocalFilesystemService()`，test 無法注入 fake 版本，導致 `explorer:browse` 回傳真實 filesystem 結果
3. **Multi-window 測試不自然** — `claude.connect()` 回傳 raw socket，沒有完整的 test API（send、emit、received），要手動 collect events
4. **沒有對齊 summoner 的 domain 結構** — summoner 有 claude/、filesystem/ 等 domain，但 test infra 只有 `FakeProcessProvider` 一個東西

## What Changes

### 新增 FakeSummoner — summoner 層的 test double 容器

```typescript
const summoner = createFakeSummoner();

// 共享 service（property）
summoner.filesystem.setRoots(['/projects']);
summoner.filesystem.addDirectory('/projects', ['app', 'blog']);

// 建立 client（factory method）
const claudeA = summoner.claude();  // → FakeClaude（socket + CLI control）
const claudeB = summoner.claude();  // 第二個 window，同一個 server

// 未來
const gemini = summoner.gemini();
```

### 新增 FakeFilesystemService — in-memory filesystem

實作 `FilesystemService` interface，所有操作在 memory 中完成，不碰真實 disk。提供 setup API（`setRoots`、`addDirectory`、`addFile`）讓 test 佈置場景。

### 重構 FakeClaude — 從 FakeSummoner 生成

FakeClaude 不再自己 new container/provider。改由 `summoner.claude()` factory 生成，共享 summoner 的 server 和 services。Socket 變成 internal（不外露）。

### 讓 FilesystemService 可注入

`server.ts` 的 `LocalFilesystemService` 改為透過 DI container 或 `createTestContainer` override 注入，讓 test 可替換為 `FakeFilesystemService`。

### 向後相容

`createFakeClaude()` 無參數呼叫保留，內部自動建立 FakeSummoner。現有所有測試不需要修改。

## Capabilities

### New Capabilities
- `fake-summoner`: FakeSummoner test double — 包含 filesystem fake、claude factory、server 管理

### Modified Capabilities
（無 — 現有 socket event API 不變）

## Impact

### Summoner package (test/)
- **新增** `FakeSummoner` class
- **新增** `FakeFilesystemService` class
- **修改** `test/index.ts` — export 新增的 test doubles

### Server package
- **修改** `types.ts` — 新增 `TYPES.FilesystemService`
- **修改** `server.ts` — FilesystemService 從 container 取而非直接 new
- **修改** `container.ts` — 綁定 FilesystemService
- **修改** `create-test-container.ts` — 加 filesystemService override
- **修改** `test/fake-claude.ts` — constructor 改為從 FakeSummoner 取 provider 和 services

### Client package
- **修改** `test/fake-claude.ts` — 跟隨 server FakeClaude 的改動
- 現有測試不需修改
