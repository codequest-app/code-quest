## Why

全站 web 元件中存在大量 hardcoded arbitrary value（`bg-white/5`、`text-red-500`、`shadow-lg`、`z-50` 等），這些值繞過了 `@theme` design token 體系，導致主題切換（深色/淺色）、字級縮放（`data-font` axis）無法一致套用，且視覺一致性難以維護。

## What Changes

- 將 `bg-white/5` / `hover:bg-white/5` 等 hardcoded white tint 統一改為既有 token（`bg-surface-hover`）或新增 `--color-hover-tint` token
- 將 `shadow-lg` 改為 `shadow-floating`（已有 token）
- 將 `z-50`、`z-10` 改為 `z-modal`、`z-raised`（已有 token）
- 將 `bg-black/50`、`bg-black/70` 改為 `bg-overlay`（已有 token）
- 將 `text-red-500`、`text-red-400`、`bg-red-500` 改為 `text-danger`、`bg-danger`（已有 token）
- 將 badge 上的 `text-white`、`text-black` 改為 `text-selected-text` 或 `text-bg`（已有 token）
- 將 `RawEventFilterBar` 中 `rgba(var(...), N)` arbitrary wrapper 改為 Tailwind opacity modifier

每個元件修改前，以 Storybook 截圖或元件 render test 建立 baseline；修改後對比確認無視覺差異，並回報無法自動驗證的案例。

## Capabilities

### New Capabilities
- `design-token-hover-tint`: 統一 hover 半透明 tint 的 design token（`--color-hover-tint`），避免全站散落的 `bg-white/5`

### Modified Capabilities

## Impact

- `apps/web/src/App.css`：新增 `--color-hover-tint` token
- `apps/web/src/components/` 下約 25 個 TSX 檔案：className 替換
- 無 API、schema、邏輯變更，純視覺層調整
