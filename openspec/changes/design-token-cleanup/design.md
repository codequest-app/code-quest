## Context

Web 前端使用 Tailwind v4 + `@theme` CSS variables 作為 design token 體系。App.css 定義了完整的顏色、z-index、shadow token，但過去開發時大量元件直接使用 arbitrary value（`bg-white/5`、`shadow-lg`、`z-50`），繞過 token 系統。本 change 純粹是視覺層整理，不涉及邏輯或 API 異動。

## Goals / Non-Goals

**Goals:**
- 所有 className 中的 arbitrary color、z-index、shadow 改用既有或新增的 `@theme` token
- 新增 `--color-hover-tint` token 統一全站 hover tint
- 每個元件修改前建立 baseline，修改後比對，並回報無法對齊的案例

**Non-Goals:**
- 不更動任何邏輯、資料流、API
- 不重構元件結構
- 不修改 Storybook stories（只用於建立 baseline）

## Decisions

### 如何建立 Baseline

每個元件修改前，執行以下步驟之一（依元件是否有 Story）：

1. **有 Storybook Story** → 執行 `pnpm storybook:build` 並對每個 Story 截圖，作為 before 圖。
2. **無 Story 但有 render test** → 執行 `pnpm test` 取得 snapshot，作為 before baseline。
3. **兩者皆無** → 在 tasks.md 中標注「無法自動驗證，需人工目視比對」，並記錄元件名稱與對應的手動驗證方式。

### 如何比對

修改後執行 `pnpm test` 確認：
- 所有 snapshot test 通過（或 diff 只有預期的 class name 差異）
- TypeScript 型別無錯誤（`pnpm typecheck`）
- Biome lint 無違規

目視比對方案：在 dev server 上開啟對應頁面，確認元件 hover、active、dark/light 主題下視覺一致。

### Token 對應表

| 舊寫法 | 新寫法 | 說明 |
|--------|--------|------|
| `bg-white/5`, `hover:bg-white/5` | `bg-surface-hover`, `hover:bg-surface-hover` | 已有 token |
| `shadow-lg` | `shadow-floating` | 已有 token |
| `z-50` | `z-modal` | 已有 token |
| `z-10` | `z-raised` | 已有 token |
| `bg-black/50`, `bg-black/70` | `bg-overlay` | 已有 token |
| `bg-black/10` | `bg-input-overlay` | 已有 token |
| `text-red-500`, `text-red-400` | `text-danger` | 已有 token |
| `bg-red-500` | `bg-danger` | 已有 token |
| `text-white` (badge) | `text-selected-text` | 已有 token |
| `text-black` (badge) | `text-bg` | 已有 token |
| `text-muted-foreground` | `text-text-muted` | 本專案 token |
| `bg-bg-secondary` | `bg-surface` | 已有 token |
| `rgba(var(--color-accent-rgb), 0.6)` in `[...]` | `text-accent/60` | opacity modifier |

### 新增 Token

`--color-hover-tint` 加入 `App.css` 的 `@theme` block，值等於 `rgba(var(--color-hover-tint-rgb), 0.05)`，使 `bg-hover-tint` 可直接使用。但因為 `bg-white/5` 多數已有 `surface-hover` 對應，先確認 `surface-hover` 是否語意吻合，若吻合則不需新 token。

## Risks / Trade-offs

- [Risk] `surface-hover` token 值與 `white/5` 在深色主題下可能不完全一致 → Mitigation：每個元件修改後人工目視 dark/light 兩種主題確認
- [Risk] badge 上 `text-white` 改為 `text-selected-text` 若 token 值在某些主題下非白色，會改變視覺 → Mitigation：修改前先查 `--color-selected-text` 實際值，確認語意正確
- [Risk] `--mode-accent` arbitrary wrapper（ChatInputArea、ComposeToolbar）需確認 Tailwind v4 是否能用 `border-mode-accent`，若不行則保留 arbitrary → Mitigation：實作時先嘗試，若失敗標注為「無法對齊」並回報
