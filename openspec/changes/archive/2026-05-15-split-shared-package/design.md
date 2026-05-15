## Context

`packages/shared` 目前混雜四種性質不同的東西：
1. 純型別契約（Zod schemas、interface、socket event types）— 零 runtime 依賴
2. Isomorphic 網路實作（WsClient、resumable socket、pipeline）— browser + Node.js 都能跑
3. Node.js 專用工具（pino logger、node.ts）— 只能在 server/summoner 用
4. 通用 glue（topic-emitter、validators、errors、utils）

所有 consumer 統一從 `@code-quest/shared` import，導致 web bundle 可能夾帶 Node.js 專用程式碼，也讓開發者無法從 import 路徑判斷依賴性質。

## Goals / Non-Goals

**Goals:**
- 三個具名 package 各自職責清楚：schemas（契約）、transport（網路）、node-utils（Node.js）
- `packages/shared` 完全移除，不留 re-export 殼
- 所有現有測試通過，行為不變
- `packages/test-kit` 可依賴 `@code-quest/schemas` 而非已消失的 `@code-quest/shared`

**Non-Goals:**
- 不修改任何業務邏輯
- 不調整 `topic-emitter`、`validators`、`errors` 等的 API
- 不在本次拆出 `packages/test-kit`（另立 change）

## Decisions

**D1: 完全移除 `shared`，不留 re-export 殼**

選擇直接移除而非保留 `@code-quest/shared` 做 re-export 橋接，因為橋接會讓邊界模糊持續存在，新程式碼仍會 import `shared`。一次性 migration 工作量大但乾淨。

**D2: `glue` 程式碼按性質分散**

`topic-emitter`、`validators`、`errors`、`utils` 等剩餘檔案不獨立成第四個 package，而是按性質歸入三個 package：
- 純型別/無副作用 → `schemas`
- Runtime isomorphic → `transport`
- Node.js only → `node-utils`

替代方案：保留縮小版 `shared` 放這些 glue — 否決，因為會讓 `shared` 永遠消不掉。

**D3: `remote/` 全部進 `schemas`**

`remote/protocol.ts`、`protocol-schemas.ts`、`methods.ts` 全是純 type/interface，移入 `schemas/remote/`。

**D4: migration 順序 — 建 package → 搬程式碼 → 更新 consumer → 移除 shared**

先建三個 package 骨架並讓 build 通過，再逐步搬移程式碼，最後批次更新所有 consumer 的 import，確保每個步驟都可以獨立驗證。

## Risks / Trade-offs

- [大量 import 修改] → 用 sed/codemod 批次替換，搭配 TypeScript build 驗證
- [circular dependency] `transport` 依賴 `schemas`，`schemas` 不可反向依賴 `transport` — 建 package 時在 `tsconfig` 加 `references` 強制方向
- [test-kit 暫時 broken] `test-kit` 尚未建立，本次 migration 後 summoner 的 fakes 仍在 summoner 內 — 不影響本次目標，等 `create-test-kit` change 處理

## Migration Plan

1. 建 `packages/schemas`、`packages/transport`、`packages/node-utils` package 骨架（`package.json`、`tsconfig.json`、`src/index.ts`）
2. 將 `packages/shared/src/` 的檔案按分類移入對應 package，保持內部 import 路徑正確
3. 更新三個新 package 的 `src/index.ts` export
4. 更新 `apps/web`、`apps/server`、`apps/summoner` 的 `package.json` 依賴宣告
5. 批次替換所有 `from '@code-quest/shared'` 為對應的新 package import
6. 跑 TypeScript build + 測試，修正所有 type error
7. 移除 `packages/shared` 目錄與根 `package.json` 的 workspace entry
