## 1. Server — 抽 interface

- [x] 1.1 定義 `FilesystemService` interface：`browseDirectories(path?)`, `listFiles(cwd, pattern)`, `readFile(cwd, filePath)`，放在 server 的 services 目錄
- [x] 1.2 建立 `LocalFilesystemService` 實作 — 把 `explorer.ts` 的 `browseDirectories` + `explorer-utils.ts` 的 `validateExplorerPath` 搬進來作為 `browseDirectories()` 方法
- [x] 1.3 把 `file.ts` 的 `getAllFiles`、`extractDirectories`、`listRootEntries`、`listDirectory`、`fuzzySearch` 搬進 `LocalFilesystemService` 作為 `listFiles()` 方法
- [x] 1.4 把 `file.ts` 的 `handleRead` 的 fs 邏輯搬進 `LocalFilesystemService` 作為 `readFile()` 方法
- [x] 1.5 為 `LocalFilesystemService` 撰寫測試（可復用現有 explorer.test.ts 和 explorer-utils.test.ts 的 test cases）

## 2. Server — Handler 改用 interface

- [x] 2.1 修改 `explorer.ts`：`create(emitter, fs: FilesystemService)`，handler 呼叫 `fs.browseDirectories()`
- [x] 2.2 修改 `file.ts`：`create(channelManager, emitter, fs: FilesystemService)`，handler 呼叫 `fs.listFiles()` + `fs.readFile()`
- [x] 2.3 修改 `server.ts`：建立 `LocalFilesystemService` instance，傳入 handler 的 `create()`
- [x] 2.4 刪除 `explorer-utils.ts`（已搬入 service）、清理 `explorer.ts` 和 `file.ts` 中不再使用的 local functions
- [x] 2.5 跑既有測試確認行為不變（explorer.test.ts、file.test.ts、全套測試）

## 3. Summoner — 搬實作

- [x] 3.1 將 `FilesystemService` interface 搬到 summoner package export
- [x] 3.2 將 `LocalFilesystemService` 實作搬到 summoner package
- [x] 3.3 Server 改成 `import { LocalFilesystemService } from '@code-quest/summoner'`
- [x] 3.4 刪除 server 端的 service 檔案（已搬到 summoner）
- [x] 3.5 測試搬到 summoner package，server 端的 handler 測試保留
- [x] 3.6 跑全套測試確認行為不變

## 4. 清除 file:list 中的 terminal 混入

- [x] 4.1 移除 `file.ts` handler 中的 `listTerminals()` 和 `channelManager` 依賴，`file:list` 只回傳 filesystem results
- [x] 4.2 移除 `file.ts` 中的 `FileOrTerminalResult` type，改用 summoner 的 `FileResult`
- [x] 4.3 更新 `server.ts`：`file.create(em, fs)` 不再傳 `channelManager`
- [x] 4.4 移除 shared schema `fileSearchResultSchema` 中的 `'terminal'` type
- [x] 4.5 移除 `MentionDropdown.tsx` 中的 `terminal` type 分支和 `TerminalIcon` import
- [x] 4.6 移除 `MentionDropdown.test.tsx` 中的 terminal test case
- [x] 4.7 跑全套測試確認行為不變
