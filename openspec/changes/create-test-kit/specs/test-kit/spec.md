## Overview

`@code-quest/test-kit` 提供跨 app 共用的測試 fakes 和 segment builders。只在測試環境使用，不進任何 production bundle。依賴 `@code-quest/schemas`，不依賴任何 app package。

## Requirements

### Requirement: Contains Shared Fakes

以下 fakes 從 `apps/summoner/src/test/` 移入：
- `FakeSocket` — EventEmitter-based socket fake
- `FakeFilesystemService` + `FakeRootGuard` + `FileTree` type
- `FakeGitService`
- `FakeWatchService`
- `FakeProcessProvider`
- `FakeClaude` — CLI session simulator，管理 segment 序列
- `FakeSummoner` — 組合所有 fakes 的 top-level orchestrator
- segment builders（`s.*()` API）：`segments-node.ts`、`segments-browser.ts`、`segment-builders.ts`

### Requirement: No App Dependencies

`packages/test-kit` 的 production dependencies 只允許 `@code-quest/schemas`（以及 Node.js built-ins）。不可依賴 `apps/summoner`、`apps/server`、`apps/web` 的任何模組。

### Requirement: Fakes Not Depend on Summoner Production Code

`FakeFilesystemService` 使用的 `mimeForPath` 必須從 `@code-quest/node-utils` import（在 `split-shared-package` 完成後）。`FakeProcessProvider` 使用的 Zod schemas 必須從 `@code-quest/schemas` import。

### Requirement: Summoner Test Index Removed

`apps/summoner/src/test/index.ts` 直接刪除，所有 consumer 的 `from '@code-quest/summoner/test'` 改為 `from '@code-quest/test-kit'`。不保留 re-export 橋接。

### Requirement: All Existing Tests Pass Without Expect Changes

移動後所有測試的 expect assertions 保持不變，行為不變。
