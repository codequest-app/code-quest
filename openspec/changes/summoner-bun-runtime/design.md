## Context

Summoner 目前使用 tsup (esbuild) 編譯成 `dist/main.mjs`，tsx 跑開發模式，node 跑 production。Bun 1.3.13 已驗證全部 546 tests 通過，所有 Node.js API 和第三方依賴皆相容。

## Goals / Non-Goals

**Goals:**
- 用 `bun build` 取代 `tsup` 產生 production bundle
- 用 `bun run` 取代 `tsx` 和 `node` 作為 runtime
- 移除 `tsup` 和 `tsx` 依賴

**Non-Goals:**
- 不遷移 vitest 到 bun test（vitest 功能更完整）
- 不遷移 pnpm 到 bun install（monorepo workspace 管理保持 pnpm）
- 不遷移 server 或 web 到 bun（只做 summoner）

## Decisions

### 1. Build: `bun build` 取代 `tsup`

tsup.config.ts 目前配置：
```ts
entry: ['src/main.ts'],
format: ['esm'],
target: 'node22',
outDir: 'dist',
noExternal: [/@code-quest\/.*/],  // bundle workspace deps
```

對應 bun build 命令：
```bash
bun build src/main.ts --outdir dist --target bun --minify
```

`--target bun` 會自動 bundle 所有依賴（等同 `noExternal`）。不需要額外配置檔。

**取捨：** 失去 tsup.config.ts 的聲明式配置，但 bun build 的 CLI 參數夠簡單，不需要配置檔。

### 2. Dev: `bun run src/main.ts` 取代 `tsx`

Bun 內建 TypeScript 支援，不需要 tsx 轉譯。`--env-file=.env` 改用 bun 內建的 env file 支援。

### 3. Production: `bun run dist/main.js` 或直接 `bun run src/main.ts`

兩種選擇：
- **A: bundle 後跑 `bun run dist/main.js`** — 跟現在一樣有 build step，部署包小
- **B: 直接跑 `bun run src/main.ts`** — 不需要 build，bun 內建 TS transpile

選 A — 保持 build step，跟現有部署流程一致，且 bundle 後啟動更快。

### 4. 保留 vitest

Bun test 缺少 vitest 的部分功能（coverage provider、自定義 reporter）。測試跑在 bun runtime 上（`bun run vitest`）已經夠用。

## Risks / Trade-offs

- **[Risk] bun 版本升級可能破壞相容性** → 鎖定 bun 版本在 CI，定期測試新版
- **[Risk] workspace dependency bundling 行為差異** → 驗證 `@code-quest/shared` 和 `@code-quest/summoner` 的 bundle 結果
- **[Trade-off] 多一個 runtime 依賴（bun）** → 只在 summoner，不影響其他 packages
