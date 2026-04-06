## Context

Monorepo 使用 pnpm workspaces。client 用 Vite bundler，server 用 tsx/tsc 直接執行。

## Goals / Non-Goals

**Goals:**
- `@/*` alias 在 client 和 server 正常工作（IDE + 編譯 + 測試）
- 所有 vitest 統一 `^1.6.1`
- 所有 tsconfig target 統一 ES2022
- 所有測試通過

**Non-Goals:**
- summoner 不加 alias（0 處 deep import）
- 不改 shared（無 deep import，純 schema 定義）

## Decisions

### 1. Alias 命名: `@/*`

使用 `@/*` 映射到 `./src/*`。這是 React/Vite 社區最常見的慣例。

### 2. Client: tsconfig paths + vite resolve.alias

```json
// tsconfig.json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```
```ts
// vite.config.ts
resolve: { alias: { '@': resolve(__dirname, 'src') } }
```

Vitest 繼承 Vite config，自動支援 alias。

### 3. Server: tsconfig paths + vitest resolve.alias

Server 用 `tsx` 執行，`tsx` 尊重 tsconfig paths（透過 `tsconfig-paths`）。Vitest 需要在 `vitest.config.ts` 加 alias。

但注意 server 的 `moduleResolution: "NodeNext"` + `rewriteRelativeImportExtensions: true` — **tsconfig paths 在 NodeNext 下不生效**。需要用 `tsc-alias` 或改用 vitest 的 `resolve.alias` 只在測試時用。

**決定：server 不加 alias** — NodeNext moduleResolution 不支援 paths，強行加會導致 runtime 失敗。server 只有 8 處 deep import，不值得為此改 moduleResolution。

### 4. 只替換 3+ 層 relative imports

`../../` (2 層) 不替換 — 只替換 `../../../` (3+ 層)。

## Risks / Trade-offs

- Client alias 需要 vite + tsconfig 雙重配置，但這是標準做法
- Server 不加 alias，deep import 保持現狀（僅 8 處）
