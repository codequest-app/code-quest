## Context

目前三組 service 的 local / remote 版本分散在兩個 app：

```
apps/summoner/src/filesystem/local.ts     → LocalFilesystemService
apps/summoner/src/git/local.ts            → LocalGitService
apps/summoner/src/git/commands.ts         → GitCommands (internal)
apps/summoner/src/git/worktree.ts         → GitWorktreeOps (internal)
apps/summoner/src/git/errors.ts           → GitErrors (internal)
apps/summoner/src/git/git-runner.ts       → GitRunner (internal)
apps/summoner/src/fs-watch/types.ts       → WatchService interface
apps/summoner/src/fs-watch/local.ts       → LocalWatchService

apps/server/src/remote/filesystem-service.ts → RemoteFilesystemService
apps/server/src/remote/git-service.ts        → RemoteGitService
(RemoteWatchService 不存在)
```

## Goals / Non-Goals

**Goals:**
- 三組 service 各自成為獨立 package，local / remote 放同一個 package
- `broadcaster-datasource` 實作時可直接 import `@code-quest/watch`
- summoner 和 server 只 import package，不含 service 實作

**Non-Goals:**
- 改變任何 service 的行為或介面
- 改變 `@code-quest/schemas` 裡的 interface 定義（FilesystemService、GitService 維持不動）
- 實作 RemoteWatchService 的完整功能（只建好骨架，實際 RPC 邏輯在 broadcaster-datasource change 完成）

## Decisions

### Package 命名與結構

```
packages/filesystem/
  package.json     (@code-quest/filesystem)
  tsconfig.json
  src/
    local.ts       → LocalFilesystemService（從 summoner 移來，含 mime-types.ts）
    remote.ts      → RemoteFilesystemService（從 server 移來）
    index.ts

packages/git/
  package.json     (@code-quest/git)
  tsconfig.json
  src/
    local.ts       → LocalGitService
    remote.ts      → RemoteGitService
    commands.ts    → GitCommands (internal)
    worktree.ts    → GitWorktreeOps (internal)
    errors.ts
    git-runner.ts
    index.ts

packages/watch/
  package.json     (@code-quest/watch)
  tsconfig.json
  src/
    types.ts       → WatchService interface、WatchEvent、WatchCallback、Unsubscribe
    local.ts       → LocalWatchService
    remote.ts      → RemoteWatchService（骨架，依賴 summoner RPC）
    index.ts
```

### WatchService interface 移出 summoner

`WatchService` interface 目前在 `summoner/src/fs-watch/types.ts`，但 server 的 DataSource 也需要用到。移到 `@code-quest/watch` 後兩端都可以 import。

### RemoteWatchService 只建骨架

```ts
export class RemoteWatchService implements WatchService {
  constructor(private readonly rpc: RemoteRpc) {}

  subscribe(cwd: string, cb: WatchCallback): Unsubscribe {
    // TODO: broadcaster-datasource change 實作
    throw new Error('Not implemented')
  }
}
```

完整實作在 broadcaster-datasource change 完成。

### RootGuard 保留在 summoner

`LocalRootGuard` 是 summoner 的 security boundary，不移動。`LocalFilesystemService` 的 constructor 仍接受 `RootGuard`，由 summoner 注入。

### logger 依賴處理

`LocalFilesystemService` 和 `LocalWatchService` 目前 import `../logger`（summoner 內部的 pino logger）。移至 package 後改為接受 `logger` 注入，或 import `@code-quest/node-utils` 的 logger（視 node-utils 有無 export）。

## Risks / Trade-offs

- **移動檔案造成 import 路徑全面更新**：summoner 和 server 內所有 import 路徑需要更新，但數量有限（grep 可找出全部）
- **pnpm workspace 新增三個 package**：需要各自設定 `package.json`、`tsconfig.json`，參考現有 packages 結構即可
- **RemoteWatchService 先放骨架**：broadcaster-datasource 實作前這個 class 不可用，但不影響現有功能（現有程式碼沒有用到它）
