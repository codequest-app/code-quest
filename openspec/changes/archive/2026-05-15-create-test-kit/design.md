## Context

目前 `apps/summoner/src/test/` 裡的 fakes 透過 `@code-quest/summoner/test` subpath export 被 server 和 web 測試 import。這造成 server/web 測試依賴 summoner app，違反 package boundary。

`packages/test-kit` 讓這些共用 fakes 有正確的歸宿，依賴關係變為：

```
test-kit → schemas          (fakes 的 interface 依賴)
server/test → test-kit      (FakeSummoner, FakeClaude, segment builders)
web/test → test-kit         (FakeSummoner, segment builders)
summoner/test → test-kit    (summoner 自己的測試也用它)
```

## Goals / Non-Goals

**Goals:**
- `packages/test-kit` 包含所有跨 app 共用的 fakes 和 segment builders
- fakes 不依賴 summoner 的 production code（`mimeForPath` 從 `@code-quest/schemas` import，schemas 從 `@code-quest/schemas` import）
- 移動後所有現有測試不改 expect，繼續通過

**Non-Goals:**
- 不移動只有單一 app 使用的 fakes（openspec、plugin-cli、diff-file）
- 不重構 fakes 的 API（只搬不改）
- 不移動 server DI 相關測試工具（`fake-server.ts`、`create-test-container.ts`）
- 不移動 web React 相關測試工具（`render-with-channel.tsx`）

## Decisions

**D1: test-kit 只依賴 `@code-quest/schemas`，不依賴任何 app**

`mimeForPath` 在 `split-shared-package` 後進入 `@code-quest/schemas`（content-types 性質），`FakeProcessProvider` 需要的 Zod schemas 也在 `@code-quest/schemas`，所以 test-kit 的 production dependency 只需要 `@code-quest/schemas`。

**D2: 直接刪除 summoner 的 `src/test/index.ts`，所有 consumer 改 import `@code-quest/test-kit`**

不保留 re-export 橋接，避免舊路徑持續被使用。所有 `from '@code-quest/summoner/test'` 一次性改為 `from '@code-quest/test-kit'`。

**D3: `fake-openspec-service.ts`、`fake-plugin-cli-service.ts`、`fake-diff-file-service.ts` 留在 summoner**

三個 fakes 只有 summoner 自己的測試使用，沒有跨 app 需求，搬移只增加 test-kit 複雜度而無收益。

## Risks / Trade-offs

- [summoner 自己 devDependency test-kit] summoner 的測試也需要用 test-kit 裡的 fakes，但 test-kit 的實作來自 summoner — 需要確認 bun workspace 可以處理這個 circular-ish 關係（test-only dependency，不是 runtime）
- [mimeForPath 位置] `mimeForPath` 進 `@code-quest/node-utils`（Node.js file path utility），`test-kit` 需依賴 `@code-quest/node-utils` 以及 `@code-quest/schemas`

## Migration Plan

1. 建立 `packages/test-kit` package 骨架
2. 將 fakes 從 summoner 複製到 test-kit（先複製再刪除，確保不斷 build）
3. 修正 test-kit 內部 import（`@code-quest/shared` → `@code-quest/schemas`，summoner 內部路徑 → schemas）
4. 更新 summoner `src/test/index.ts` 改為 re-export from `@code-quest/test-kit`
5. 更新 server、web 的 import 路徑
6. 刪除 summoner 原始 fake 檔案
7. 跑全套測試
