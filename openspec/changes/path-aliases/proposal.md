## Why

三個 DX 問題需要統一修正：
1. **Deep import paths** — client 32 處、server 8 處 `../../../` import，搬檔案時 break import
2. **Vitest 版本不一致** — shared 聲明 `^1.6.1`，其他 `^1.2.1`（實際都用 1.6.1）
3. **TypeScript target 不一致** — client ES2021，其他 ES2022

## What Changes

- 在 client 和 server 的 tsconfig.json 加 `paths` alias（`@/*` → `src/*`）
- Vite config 加對應的 `resolve.alias`
- 批量替換 `../../../` import 為 `@/` alias
- 統一所有 package.json 的 vitest 版本為 `^1.6.1`
- 統一 client tsconfig target 為 ES2022

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
（無）

## Impact

- `packages/client/tsconfig.json` + `vite.config.ts` — 加 path alias
- `packages/server/tsconfig.json` — 加 path alias
- `packages/client/src/` — ~32 檔案 import path 替換
- `packages/server/src/` — ~8 檔案 import path 替換
- `packages/*/package.json` — vitest 版本統一
- `packages/client/tsconfig.json` — target ES2021 → ES2022
