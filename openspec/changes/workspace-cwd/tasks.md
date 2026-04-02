## 規則

- Server 400 test + Client 622 test 全部 pass
- TDD：FakeClaude + real JSON + testing-library
- Client 不直接 import config — workspaceFolder 透過 ChannelProvider prop 傳入

## 1. sessionState 拆分

- [x] 1.2 Channel 獨立 workspaceFolder 屬性（cwd 從 sessionState 搬出）
- [x] 1.3 UI state 從 sessionState 分離（titleGenerated/pendingTitlePrompt/title/parentId → Channel properties）
- [x] 1.4 sessionState → sessionConfig 改名（只剩 CLI config）

## 2. Client ChannelProvider 加 workspaceFolder

- [x] 2.1 config.ts 新增 workspaceFolder
- [x] 2.2 ChannelProvider 加 workspaceFolder prop
- [x] 2.3 WorkspaceFolderContext + useWorkspaceFolder() hook
- [x] 2.4 WorkspaceLayout 傳 workspaceFolder 給 ChannelProvider

## 3. Client git events 帶 cwd

- [x] 3.1 GitProvider 用 useWorkspaceFolder()
- [x] 3.2 git:status, git:checkout, git:log, git:diff 帶 cwd

## 4. Shared schema 更新

- [x] 4.1 git schema 加 cwd: z.string().optional()

## 5. Server git handler 用 payload 的 cwd

- [x] 5.1 git.ts 所有 handler 從 payload 取 cwd
- [x] 5.2 exec-git.ts checkoutBranch 加 cwd 參數

## 6. Server file handler

- [x] 6.1 file:read 改用 ch.workspaceFolder
- [x] 6.2 file:list 改用 ch.workspaceFolder

## 7. Server 其他 process.cwd() 確認

- [x] 7.1-7.5 terminal.ts, connect.ts, plugin.ts 確認 fallback 合理

## 驗證

- [x] 400 server + 622 client test pass
- [x] typecheck pass
