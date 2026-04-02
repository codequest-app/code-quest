## 規則

- Server 399 test + Client 615 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect
- TDD：FakeClaude + real JSON + testing-library，先寫測試再寫 code
- Client 不直接 import config — workspaceFolder 透過 ChannelProvider prop 傳入
- 現在 workspaceFolder 寫死（config），未來 File Manager 動態設定

## 1. sessionState 拆分

目前 sessionState 混了 CLI config、workspace info、UI state、metadata。
拆成職責清楚的結構。

### 1.1 盤點 sessionState 所有欄位的讀寫者

- [ ] 1.1a 列出每個欄位在 server/client 的讀寫位置
- [ ] 1.1b 確認分類：CLI config / workspace / UI state / metadata

### 1.2 Channel 獨立 workspaceFolder 屬性

cwd 從 sessionState 搬出，成為 Channel 的獨立屬性。
session:init 的 cwd 設到 channel.workspaceFolder（不再存 sessionState）。

- [ ] 1.2a Channel 新增 `workspaceFolder: string` 屬性
- [ ] 1.2b session:init handleInternalEvent — cwd 設到 channel.workspaceFolder
- [ ] 1.2c sessionState schema 移除 cwd
- [ ] 1.2d 所有讀 sessionState.cwd 的地方改讀 channel.workspaceFolder
- [ ] 1.2e test assert 等價遷移：sessionState.cwd → workspaceFolder（settings.test, terminal.test, channel.test）
- [ ] 1.2f 399 + 615 test pass

### 1.3 UI state 從 sessionState 分離

titleGenerated、pendingTitlePrompt、title 是 UI 關心的，不是 CLI session config。

- [ ] 1.3a 評估是否搬到獨立的 uiState 或保留在 sessionState（如果只有 server 用可保留）
- [ ] 1.3b 如果搬：Channel 新增 uiState，更新讀寫者
- [ ] 1.3c 399 + 615 test pass

### 1.4 sessionState 改名評估

移除 cwd 和 UI state 後，sessionState 只剩 CLI config（model, permissionMode, effort, thinkingLevel, tools, mcpServers）+ parentId。
評估是否改名為 `cliConfig` 或 `sessionConfig`。

- [ ] 1.4a 評估改名影響
- [ ] 1.4b 如果改名：更新所有引用
- [ ] 1.4c 399 + 615 test pass

## 2. Client ChannelProvider 加 workspaceFolder

- [ ] 2.1 config.ts 新增 `workspaceFolder`（`import.meta.env.VITE_WORKSPACE_FOLDER ?? '../'`）
- [ ] 2.2 ChannelProvider 加 `workspaceFolder` prop
- [ ] 2.3 新增 WorkspaceFolderContext + `useWorkspaceFolder()` hook（小 context，獨立於 ChannelMessages）
- [ ] 2.4 WorkspaceLayout 傳 `workspaceFolder={config.workspaceFolder}` 給 ChannelProvider
- [ ] 2.5 615 test pass

## 3. Client git events 帶 cwd

GitProvider 從 useWorkspaceFolder() 取值，送請求時帶 cwd。

- [ ] 3.1 GitProvider 用 useWorkspaceFolder()
- [ ] 3.2 git:status, git:checkout, git:log, git:diff 帶 `cwd`
- [ ] 3.3 615 test pass

## 4. Shared schema 更新

- [ ] 4.1 git schema 加 `cwd: z.string().optional()`
- [ ] 4.2 399 + 615 test pass

## 5. Server git handler 用 payload 的 cwd

- [ ] 5.1 git.ts 所有 handler — 從 payload 取 cwd，fallback process.cwd()
- [ ] 5.2 exec-git.ts checkoutBranch 加 cwd 參數
- [ ] 5.3 399 + 615 test pass

## 6. Server file handler

- [ ] 6.1 file:read — 已用 ch.sessionState.cwd → 改用 ch.workspaceFolder
- [ ] 6.2 file:list — 從 payload 取 cwd（前端帶 workspaceFolder），fallback process.cwd()
- [ ] 6.3 399 + 615 test pass

## 7. Server 其他 process.cwd() 確認

- [ ] 7.1 terminal.ts — fallback 保留 process.cwd()（合理）
- [ ] 7.2 connect.ts — session persist cwd 改用 channel.workspaceFolder
- [ ] 7.3 claude/plugin.ts — cache key 保留 process.cwd()（per-server）
- [ ] 7.4 channel-manager.ts broadcastSessionState — ss.cwd 改用 channel.workspaceFolder
- [ ] 7.5 399 + 615 test pass

## 8. 清理

- [ ] 8.1 確認 sessionState 不再有 cwd
- [ ] 8.2 確認 workspaceFolder 一致使用
- [ ] 8.3 biome check + typecheck + 399 server + 615 client test pass
