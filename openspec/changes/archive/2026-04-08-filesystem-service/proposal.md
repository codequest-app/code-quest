## Why

目前 server 的 file handler（`file:list`、`file:read`）和 explorer handler（`explorer:browse`）都直接使用 Node.js fs API（`globSync`、`readdirSync`、`readFileSync`）讀取 filesystem。這讓 server 層同時承擔了「通訊 relay」和「本地 filesystem 操作」兩個職責。

將 filesystem 操作移到 summoner 層有以下好處：
1. **職責清晰** — summoner 層 = 所有本地操作（CLI process + filesystem），server 層 = 純 relay/orchestration
2. **架構一致** — CLI process 的通訊已透過 summoner 管理，filesystem 操作也應由同一層負責
3. **為遠端部署鋪路** — 如果未來 server 是遠端的，summoner/local agent 跑在使用者機器上，filesystem access 自然隔離
4. **可測試性** — filesystem 操作集中在一個 service 裡，方便 mock 和測試

## What Changes

### 新增 FilesystemService（summoner 層）
- 在 summoner package 新增 `FilesystemService` class，提供 filesystem 操作 API：
  - `browseDirectories(path?, roots)` — 列出子目錄（filtered、sorted）
  - `listFiles(cwd, pattern)` — 列出檔案（glob + fuzzy search）
  - `readFile(cwd, filePath)` — 讀取檔案內容（含 path traversal 防護）
- 透過 Inversify DI 注入到 server

### 遷移現有 handler
- `explorer.ts` handler 改為呼叫 `FilesystemService.browseDirectories()`，不再直接 `readdirSync`
- `file.ts` handler 改為呼叫 `FilesystemService.listFiles()` 和 `FilesystemService.readFile()`，不再直接 `globSync`/`readFileSync`
- `explorer-utils.ts`（validateExplorerPath）搬進 `FilesystemService` 作為內部 utility

### 不改動
- Socket event 名稱和 payload 格式不變（client 端完全不受影響）
- 功能行為不變（只是實作層搬家）

## Capabilities

### New Capabilities
- `filesystem-service`: FilesystemService — summoner 層的 filesystem 操作封裝，提供目錄瀏覽、檔案列表、檔案讀取

### Modified Capabilities
（無 — socket event API 不變，只是底層實作搬到 summoner 層）

## Impact

### Summoner package
- **新增** `FilesystemService` class（browseDirectories、listFiles、readFile）
- **新增** path validation utility（從 server 搬入）
- **新增** DI binding（TYPES.FilesystemService）

### Server package
- **修改** `explorer.ts` — 改用注入的 FilesystemService
- **修改** `file.ts` — 改用注入的 FilesystemService
- **修改** `server.ts` — 將 FilesystemService 傳入 handler
- **刪除** `explorer-utils.ts`（搬到 summoner）
- **修改** `config.ts` — explorerRoots 仍在 server config，傳入 FilesystemService

### Client package
- 無改動
