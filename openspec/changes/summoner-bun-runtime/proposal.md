## Why

Summoner 目前使用 tsup (esbuild) 編譯、tsx 開發、node 執行。Bun 提供更快的啟動速度、內建 TypeScript 支援、更快的 bundler，可以簡化 toolchain 並提升開發體驗。已驗證 bun 1.3.13 跑 summoner 全部 546 tests 通過，所有依賴（simple-git, chokidar, pino, ws, glob, fuse.js）皆相容。

## What Changes

- 用 `bun build` 取代 `tsup` 產生 production bundle
- 用 `bun run` 取代 `tsx` 執行 dev mode
- 用 `bun run` 取代 `node` 執行 production runtime
- 移除 `tsup` 和 `tsx` 依賴
- 保留 vitest 作為測試框架（不遷移到 bun test）

## Capabilities

### New Capabilities
- `bun-build`: Summoner 使用 bun build 產生 production bundle，取代 tsup

### Modified Capabilities

## Impact

- `apps/summoner/package.json` — scripts 和 dependencies 變更
- `apps/summoner/tsup.config.ts` — 移除，改用 bun build 配置
- 部署流程需更新：runtime 從 `node dist/main.mjs` 改為 `bun run dist/main.js` 或直接 `bun run src/main.ts`
- CI 需安裝 bun
