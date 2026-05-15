## Why

`LocalFilesystemService`、`LocalGitService`、`LocalWatchService` 目前放在 `apps/summoner`，remote 版本 `RemoteFilesystemService`、`RemoteGitService` 放在 `apps/server`。兩端都需要用到這些 service，但現在分散在 app 層，造成：

- `broadcaster-datasource` 實作時無法直接引用，需要繞道
- Local / remote 兩個版本沒有放在同個地方，難以對照維護
- 未來新增 `RemoteWatchService` 不知道該放哪

將這三組 service 各自提取成獨立 package，local 和 remote 版本放在同一個 package 裡，server 和 summoner 都只是 consumer。

## What Changes

- 新增 `packages/filesystem`：`LocalFilesystemService`（從 summoner 移來）、`RemoteFilesystemService`（從 server 移來）
- 新增 `packages/git`：`LocalGitService` 及相關 git utilities（從 summoner 移來）、`RemoteGitService`（從 server 移來）
- 新增 `packages/watch`：`WatchService` interface（從 summoner 移來）、`LocalWatchService`（從 summoner 移來）、`RemoteWatchService`（新增）
- `apps/summoner` 和 `apps/server` 改為 import 這些 packages

## Capabilities

### New Capabilities
- `filesystem-package`: LocalFilesystemService + RemoteFilesystemService 統一在 `@code-quest/filesystem`
- `git-package`: LocalGitService + RemoteGitService 統一在 `@code-quest/git`
- `watch-package`: WatchService interface + LocalWatchService + RemoteWatchService 統一在 `@code-quest/watch`

### Modified Capabilities

## Impact

- `apps/summoner/src/filesystem/` → 移至 `packages/filesystem/src/`
- `apps/summoner/src/git/` → 移至 `packages/git/src/`
- `apps/summoner/src/fs-watch/` → 移至 `packages/watch/src/`
- `apps/server/src/remote/filesystem-service.ts` → 移至 `packages/filesystem/src/remote.ts`
- `apps/server/src/remote/git-service.ts` → 移至 `packages/git/src/remote.ts`
- `apps/server/src/remote/` 新增 `watch-service.ts`（RemoteWatchService）→ 移至 `packages/watch/src/remote.ts`
- pnpm workspace 新增三個 package，各自有 `package.json`、`tsconfig.json`
