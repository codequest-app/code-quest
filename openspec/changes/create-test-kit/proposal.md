## Why

測試用的 fakes 和 segment builders 分散在 `apps/summoner/src/test/`，但 `apps/server` 和 `apps/web` 都需要 import 它們，造成 app 間的橫向依賴。`packages/test-kit` 提供一個正確的歸宿，讓 fakes 可以被任何 app import 而不違反 package boundary。

此 change 依賴 `split-shared-package` 完成後，`mimeForPath` 與 Zod schemas 才能從 `@code-quest/schemas` import，解除 fakes 對 summoner production code 的依賴。

## What Changes

- 新增 `packages/test-kit` package（`@code-quest/test-kit`）
- 將以下檔案從 `apps/summoner/src/test/` 移入 `packages/test-kit/src/`：
  - `fake-socket.ts` — EventEmitter-based socket fake
  - `fake-filesystem-service.ts` — FakeFilesystemService + FakeRootGuard + FileTree
  - `fake-git-service.ts` — FakeGitService
  - `fake-watch-service.ts` — FakeWatchService
  - `fake-process-provider.ts` — FakeProcessProvider
  - `fake-claude.ts` — FakeClaude（CLI session simulator）
  - `fake-summoner.ts` — FakeSummoner（orchestrates all fakes）
  - `segment-builders.ts` — `s.*()` segment builder API
  - `segments-node.ts`、`segments-browser.ts`、`index-browser.ts`
- 更新 `apps/summoner/src/test/index.ts` re-export from `@code-quest/test-kit`（或直接移除，由 consumer 改 import）
- 更新 `apps/server/src/test/fake-server.ts` import from `@code-quest/test-kit`
- 更新 `apps/web/src/test/fake-summoner.ts` import from `@code-quest/test-kit`

**留在原 app 的（不移動）：**
- `apps/server/src/test/` — `fake-server.ts`、`create-test-container.ts`（深度依賴 inversify DI）
- `apps/web/src/test/` — `render-with-channel.tsx`、`render-with-workspace.tsx`、`fake-socket-browser.ts`（React/browser 專用）
- `fake-openspec-service.ts`、`fake-plugin-cli-service.ts`、`fake-diff-file-service.ts` — 僅 summoner 內部使用，留在 summoner

## Capabilities

### New Capabilities

- `test-kit`: 可跨 app 共用的測試 fakes 與 segment builders package

### Modified Capabilities

(none)

## Impact

- 所有 `from '@code-quest/summoner/test'` 或 `apps/summoner/src/test/` 的 import 需更新為 `@code-quest/test-kit`
- `apps/summoner/package.json` 自身也需要 devDependency `@code-quest/test-kit`（避免循環，改為 workspace package）
- `packages/test-kit` 依賴 `@code-quest/schemas`（不依賴 `@code-quest/shared`）
- 須在 `split-shared-package` 完成後實作
