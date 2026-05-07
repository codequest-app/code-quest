---
name: engineering-quality
description: Project lint, format, and git hooks setup using Biome and Lefthook. Use when modifying biome.json, lefthook config, or troubleshooting pre-commit/pre-push hooks.
---

# Engineering Quality

## 用途

專案的 lint、format、git hooks、DI 等品質基礎建設的設定和使用指南。

## 何時使用

- 新增或修改 biome / lefthook 設定
- 設定 DI（dependency injection）模式
- 處理 pre-commit / pre-push hook 問題
- 新增或修改 zod runtime schema validation

---

## Biome（Lint + Format）

### 設定檔

`/biome.json`（root level，server + client 共用）：

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "warn" }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "always" }
  }
}
```

### 常用命令

```bash
# 檢查（lint + format）
pnpm biome check .

# 自動修正
pnpm biome check --write .

# 只檢查特定檔案
pnpm biome check apps/server/src/chat/parsers/

# CI 模式（不修正，只報錯）
pnpm biome ci .
```

---

## Lefthook（Git Hooks）

### 設定檔

`/lefthook.yml`：

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,json}"
      run: pnpm biome check --write {staged_files}
      stage_fixed: true
    typecheck-server:
      glob: "apps/server/**/*.ts"
      run: pnpm --filter server exec tsc --noEmit
    typecheck-client:
      glob: "apps/web/**/*.{ts,tsx}"
      run: pnpm --filter client exec tsc --noEmit

pre-push:
  parallel: true
  commands:
    test-server:
      run: pnpm --filter server exec vitest run
    test-client:
      run: pnpm --filter client exec vitest run
```

### 管理命令

```bash
# 安裝 hooks
pnpm lefthook install

# 跳過 hooks（緊急情況）
git commit --no-verify -m "emergency fix"

# 手動執行 pre-commit
pnpm lefthook run pre-commit
```

---

## DI 模式（Inversify 7）

專案使用 **Inversify 7** 做 server-side dependency injection。詳細 patterns 請參考 `/inversify-di` skill。

### 核心原則

1. **Interface first** — 依賴型別用 interface，不用 concrete class
2. **Symbol tokens** — 所有 binding token 定義在 `types.symbols.ts`
3. **Lazy factory resolution** — `toDynamicValue` 內的依賴在 factory 被呼叫時才 resolve
4. **Test via rebindSync** — 測試中用 `createTestContainer` + `rebindSync` 替換依賴
5. **Composition root** — 只在 `container.ts` 和 entry point 呼叫 `container.get()`

---

## Zod Runtime Validation

### 用途

- 驗證 CLI 輸出格式是否符合預期
- 驗證 WebSocket 事件格式
- 開發時 early warning，production 可關閉

### Schema 位置

```
apps/server/src/chat/schemas/
├── claude.ts    # Claude CLI 原始輸出
├── gemini.ts    # Gemini CLI 原始輸出
├── events.ts    # 統一的 ChatStreamEvent
└── index.ts     # re-export
```

### 使用方式

```typescript
import { ClaudeStreamLine } from '../schemas/claude';

// 嚴格驗證（開發/測試時）
const parsed = ClaudeStreamLine.parse(json);

// 寬鬆驗證（production）
const result = ClaudeStreamLine.safeParse(json);
if (!result.success) {
  logger.warn('Unexpected CLI format', result.error);
}
```

---

## 從 ESLint 遷移到 Biome

### 步驟

1. 安裝 biome：`pnpm add -D @biomejs/biome --workspace-root`
2. 建立 `/biome.json`
3. 執行 `pnpm biome check --write .` 修正所有檔案
4. 刪除 `.eslintrc.cjs`（server + client）
5. 移除 eslint 相關 devDependencies
6. 更新 `package.json` scripts

### 注意事項

- Biome 和 ESLint 規則不完全對應，遷移後需要 review diff
- Biome 的 import 排序規則與 ESLint 不同
- `noExplicitAny` 設為 `warn` 而非 `error`，因為專案中大量使用 `any`

---

## 相關

- 計畫文件：`docs/plans/fixture-driven-testing.md`
- Fixture-Driven TDD：`/fixture-driven-tdd`
- Parser 開發：`/parser-development`
