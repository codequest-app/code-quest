## 1. 建立 package 骨架

- [x] 1.1 建立 `packages/schemas`：`package.json`（name: `@code-quest/schemas`）、`tsconfig.json`、`src/index.ts`
- [x] 1.2 建立 `packages/transport`：`package.json`（name: `@code-quest/transport`，依賴 `@code-quest/schemas`）、`tsconfig.json`、`src/index.ts`
- [x] 1.3 建立 `packages/node-utils`：`package.json`（name: `@code-quest/node-utils`，依賴 `@code-quest/schemas`）、`tsconfig.json`、`src/index.ts`
- [x] 1.4 在根 `package.json` workspaces 加入三個新 package（pnpm-workspace.yaml 已包含 `packages/*`，無需修改）

## 2. 搬移 schemas package 內容

- [x] 2.1 將 `packages/shared/src/schemas/` 移入 `packages/schemas/src/schemas/`
- [x] 2.2 將 `packages/shared/src/services/` 移入 `packages/schemas/src/services/`
- [x] 2.3 將 `packages/shared/src/socket-events.ts`、`content-types.ts` 移入 `packages/schemas/src/`
- [x] 2.4 將 transport interface 檔案（`types.ts`、`transport.ts`、`agent-transport.ts`）移入 `packages/schemas/src/transport/`（envelope.ts、rpc-channel.ts 為實作，移至 transport）
- [x] 2.5 將 `packages/shared/src/remote/` 全部移入 `packages/schemas/src/remote/`
- [x] 2.6 按性質分散 glue 檔案（`topic-emitter.ts`、`validators/`、`errors.ts`、`utils/`、`logger.ts` interface 部分）至 schemas；`parseLogConfig` 至 node-utils
- [x] 2.7 更新 `packages/schemas/src/index.ts` named exports

## 3. 搬移 transport package 內容

- [x] 3.1 將 `packages/shared/src/transport/` 實作檔（ws-client、resumable-socket、pipeline 等）移入 `packages/transport/src/`
- [x] 3.2 修正 transport 內部 import（原本 `from '@code-quest/shared'` 改為 `from '@code-quest/schemas'`）
- [x] 3.3 更新 `packages/transport/src/index.ts` named exports

## 4. 搬移 node-utils package 內容

- [x] 4.1 將 `packages/shared/src/logger.ts`、`node.ts` 移入 `packages/node-utils/src/`；將 `apps/summoner/src/filesystem/mime-types.ts` 複製至 `packages/node-utils/src/`，修正 import（`CONTENT_TYPE` 改為 `@code-quest/schemas`）
- [x] 4.2 更新 `packages/node-utils/src/index.ts` named exports

## 5. 更新 consumer 依賴宣告

- [x] 5.1 更新 `apps/web/package.json`：移除 `@code-quest/shared`，加入 `@code-quest/schemas`、`@code-quest/transport`
- [x] 5.2 更新 `apps/server/package.json`：移除 `@code-quest/shared`，加入三個新 package
- [x] 5.3 更新 `apps/summoner/package.json`：移除 `@code-quest/shared`，加入三個新 package
- [x] 5.4 test-kit 尚未建立；shared package 本身無其他 consumer

## 6. 批次更新 import 路徑

- [x] 6.1 將 `apps/web` 中 `from '@code-quest/shared'` 替換為對應新 package
- [x] 6.2 將 `apps/server` 中 `from '@code-quest/shared'` 替換為對應新 package
- [x] 6.3 將 `apps/summoner` 中 `from '@code-quest/shared'` 替換為對應新 package
- [x] 6.4 將 `packages/` 內部互相引用的 `@code-quest/shared` 替換

## 7. 驗證與清除

- [x] 7.1 跑 TypeScript build，修正所有 type error
- [x] 7.2 跑全套測試，確認通過（web 2129、server 754、summoner 599）
- [x] 7.3 移除 `packages/shared` 目錄
- [x] 7.4 從根 `package.json` workspaces 移除 `packages/shared`（由 pnpm-workspace.yaml `packages/*` glob 管理，刪目錄即生效）
