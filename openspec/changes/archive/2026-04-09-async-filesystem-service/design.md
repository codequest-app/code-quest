## Context

FilesystemService interface 定義三個 sync 方法，由 LocalFilesystemService 實作，在 socket handler（explorer、file）中被呼叫。Sync fs 操作會阻塞 event loop，影響其他連線的回應時間。

## Goals / Non-Goals

**Goals:**
- 所有 FilesystemService 方法改為回傳 Promise
- LocalFilesystemService 使用 node:fs/promises 和 async glob
- 不改變外部行為（回傳值內容不變，只是包在 Promise 裡）

**Non-Goals:**
- 不做 streaming / pagination（另案處理）
- 不做 filesystem watcher（不在範圍內）

## Decisions

### 1. 使用 node:fs/promises 而非 callback API

node:fs/promises 提供 Promise-based API，程式碼更簡潔。`readdir`、`readFile` 直接對應 sync 版本。

### 2. glob 用 async 版本

`glob` package 已提供 async `glob()` 函式（相對於 `globSync`），直接替換。

### 3. FakeFilesystemService 用 resolved Promise 包同步邏輯

Fake 實作內部邏輯仍是同步（操作 in-memory Map），但方法簽名改為 async 回傳 `Promise.resolve(result)`。這樣 fake 和 real 共用同一 interface。

## Risks / Trade-offs

- [風險] handler 忘記 await → 回傳 Promise object 而非結果 → 靠 TypeScript 型別檢查和既有測試防護
- [風險] readdir 的 Dirent `isSymbolicLink()` 在 async 版行為相同 → 無額外風險
