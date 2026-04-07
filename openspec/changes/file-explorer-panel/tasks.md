## 1. Client — Workspace Layout 重構（先做，零外部依賴）

- [x] 1.1 將現有 `WorkspaceLayout` 的 TabBar + per-tab ChatPanel 邏輯原封不動提取為 `EditorArea` component（純 rename + 搬出，不改任何邏輯）
- [x] 1.2 拆 TabContext → `TabStateContext`（tabs, activeTabId）+ `TabActionsContext`（createNewTab, removeTab, ...），export `useTabState()` + `useTabActions()`，保留 `useTab()` backward-compatible wrapper，跑既有測試全過
- [x] 1.3 EditorArea 改用 `useTabState()` + `useTabActions()` 取代 `useTab()`
- [x] 1.4 清除 `useTab()` wrapper，所有 consumer 改用 `useTabState()` / `useTabActions()`
- [x] 1.5 建立 `ActivityBar` component + 測試：接收 `items` 陣列（id, icon, title），render icon 列，active state indicator，點擊 toggle
- [x] 1.6 重構 `WorkspaceLayout` 為 layout shell：`ActivityBar + PanelGroup(sidebar + PanelResizeHandle + main(EditorArea))`，使用 `react-resizable-panels`，sidebar 先放 placeholder
- [x] 1.7 WorkspaceLayout integration test：三欄結構 render、sidebar toggle、resize handle 存在
- [x] 1.8 驗證現有功能不受影響：tab 切換、ChatPanel、RawEventPanel toggle、所有 hotkeys

## 2. Shared Schemas

- [x] 2.1 新增 `explorerBrowsePayloadSchema`（`{ path?: string }`）和 `explorerBrowseResponseSchema`（`{ directories: Array<{ name: string; path: string }> }`）到 shared package，並 export
- [x] 2.2 新增 `explorer:browse` 到 `ClientToServerEvents` type definition

## 3. Server — Config & Security

- [x] 3.1 在 `packages/server/src/config.ts` 新增 `explorerRoots` 設定：讀取 `FILE_EXPLORER_ROOTS` env var（逗號分隔），未設定時預設 `[os.homedir()]`
- [x] 3.2 建立 path validation utility function + 測試：接收 path + explorerRoots，回傳 resolved absolute path 或 null（path traversal / out of scope 回傳 null）

## 4. Server — Explorer Handler

- [x] 4.1 為 explorer handler 撰寫測試：roots 回傳、子目錄列表、path 安全驗證、權限錯誤處理、symlink 排除
- [x] 4.2 建立 `packages/server/src/socket/handlers/explorer.ts`，實作 `explorer:browse` handler（不使用 `withChannel`）
- [x] 4.3 handler 邏輯：無 path → 回傳 explorerRoots 列表；有 path → 讀取子目錄（`readdirSync` + `Dirent.isDirectory()`）
- [x] 4.4 過濾隱藏目錄（`.` 開頭）和忽略目錄（`node_modules`、`.git`、`dist`、`coverage`）
- [x] 4.5 使用 `lstatSync` 排除 symlink 目錄
- [x] 4.6 try-catch 處理權限錯誤，回傳 `{ directories: [] }`
- [x] 4.7 在 `server.ts` 的 `register()` 中註冊 `explorer.create(em)`（不需 channelManager）

## 5. Client — File Explorer Panel

- [ ] 5.1 安裝 `@headless-tree/core` + `@headless-tree/react`
- [ ] 5.2 建立 `useExplorerBrowse` hook + 測試：透過 socket emit `explorer:browse`，回傳 `{ browse: (path?) => Promise<Directory[]> }`
- [ ] 5.3 建立 `DirectoryTree` component + 測試：使用 `useTree` + `asyncDataLoaderFeature`，`getChildrenWithData` 對接 `useExplorerBrowse`，rendering 用 `tree.getItems()` flat list + indent by level
- [ ] 5.4 建立 `FileExplorerPanel` component + 測試：組合 DirectoryTree，initial root loading、expand/collapse
- [ ] 5.5 實作 double-click 目錄 → `createNewTab({ cwd })`（在 item `onDoubleClick` handler 中）
- [ ] 5.6 實作右鍵 context menu（簡單自建 absolute div）：顯示「Open in New Tab」，點擊後開新 tab，點外面關閉

## 6. Client — Recents

- [ ] 6.1 建立 `useRecentCwds` hook + 測試：讀寫 localStorage（key: `cc-office:recent-cwds`），最多 10 筆，按 lastUsed 降序、cap at 10、dedup
- [ ] 6.2 在 FileExplorerPanel 底部渲染 Recents section：列表 + double-click / 右鍵開新 tab
- [ ] 6.3 開新 tab 時呼叫 `addRecent(path)` 更新 recents

## 7. Environment & Documentation

- [ ] 7.1 在 `.env.example` 新增 `FILE_EXPLORER_ROOTS` 說明
- [ ] 7.2 在 `packages/client/src/config.ts` 確認無需新增 client env（所有設定都在 server 端）
