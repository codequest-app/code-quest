## Context

`preferences-axes-refactor` 已定義：
- `<html data-theme data-font data-density>` 由 `App.tsx` `useEffect` 從 `usePreferencesStore` 同步
- `App.css` 以 `:root[data-theme="dark"]` / `:root[data-font="sm|md|lg"]` 覆寫 CSS vars
- `data-density` 已 set 但對應 CSS 無實作（等於 no-op）

本 change 填實兩條軸：light palette、compact density。

## Goals / Non-Goals

**Goals**
- `data-theme="light"` 產生一套對比足夠（WCAG AA）的 light palette
- `data-density="compact"` 讓整體 UI 密度明顯縮小（~12.5%），不需改元件
- dark + comfortable 組合視覺**零變動**（dump diff 為空）
- Playwright 截圖快照四組合（dark/light × comfortable/compact）供未來回歸

**Non-Goals**
- 不新增 system theme（follow OS）自動切換 — 留給後續 change
- 不做設計師審核過的 palette v2 — 先上 v1 收反饋
- 不動個別元件的 class（不做「`p-4` → `p-compact`」的遷移）
- 不處理 MessageList/MarkdownContent 內的 prose 色票細節 — 以 `@tailwindcss/typography` 自帶的 light prose 變體為主

## Decisions

### D1. Light palette 取向 = VS Code Light+

| Token | Dark | Light |
|---|---|---|
| `--color-bg` | #1e1e1e | #ffffff |
| `--color-surface` | #252526 | #f3f3f3 |
| `--color-surface-hover` | #2a2d2e | #e8e8e8 |
| `--color-border` | #3e3e42 | #d4d4d4 |
| `--color-text` | #cccccc | #1f1f1f |
| `--color-text-muted` | #9d9d9d | #616161 |
| `--color-text-bright` | #e8e8e8 | #000000 |
| `--color-accent` | #d97757 | #c6613f |
| `--color-success` | #81b88b | #107c10 |
| `--color-warning` | #e1c08d | #b58900 |
| `--color-danger` | #f48771 | #c72e0f |
| `--color-code` | #252526 | #f3f3f3 |
| `--color-code-block` | #1e1e1e | #fafafa |
| `--color-input-bg` | #3c3c3c | #ffffff |
| `--color-success-bg` | #1a1f1a | #e6f2e6 |
| `--color-warning-bg` | #201f1a | #fff8dc |
| `--color-danger-bg` | #201a1a | #fde7e7 |
| `--color-selected` | #094771 | #cce5ff |
| `--color-toggle` | #0e639c | #005a9e |
| `--color-button` | #0078d4 | #005a9e |

- 原因：VS Code Light+ 是 VS Code 使用者熟悉的 light 配色；我們整個 UI 就是 VS Code Dark+ 風格
- 替代：用純 Tailwind `gray-*` — 過於中性、失去品牌感

### D2. Compact density via Tailwind `--spacing` base override

Tailwind v4 的 `p-4` 展開為 `padding: calc(var(--spacing) * 4)`。預設 `--spacing: 0.25rem`。

```css
:root[data-density="compact"] {
  --spacing: 0.21875rem; /* 0.25 × 0.875 */
}
```

一行蓋全部 spacing utilities，零元件改動。

- 縮放比例：0.875（保留易讀性、避免過密）
- 替代：
  - 自訂 `--padding-*` tokens + 全面重構元件 class → 工作量太大
  - 用 CSS `zoom` / `transform: scale` → 會影響 font + 破壞絕對定位
- 注意：這只縮 spacing，不縮 font-size / icon-size / border。若要 icon 也縮，需額外 tokens，本 change 不做

### D3. Storybook `withThemePreset` decorator

```ts
withThemePreset({ theme: 'light', density: 'compact' })
```

於 story render 前寫入 `<html>` data-attr，render 後還原。讓每個 story 可以額外輸出 `LightCompact` 變體，不需全 app 切換。

- 替代：用 Storybook globals + toolbar — 更全域但複雜；延後實作

### D4. Playwright dump-theme-variants script

```
tools/dump-theme-variants.mjs
  → snapshots/theme-variants/
      dark-comfortable.json
      dark-compact.json
      light-comfortable.json
      light-compact.json
      dark-comfortable.png (preview)
      ...
```

- `dark-comfortable.json` MUST 與 `preferences-axes-refactor` 的 `css-vars-baseline.json` 完全一致（保證回歸防護網）
- 截圖存 repo 當視覺 baseline；CI 未來可接 image diff

## Risks / Trade-offs

- **Light palette 對比未審核** → v1 標示「待 UX 審核」；critical 違反 WCAG AA 時手動調整
- **Compact 在資訊密集畫面（MessageList、FileTree）可能太擠** → Storybook 覆蓋這兩個元件的 stories，視覺檢查
- **`--spacing` 覆寫可能影響第三方元件（Radix / headless-tree）** → 這些元件自有 spacing 計算，Tailwind `--spacing` 不影響；若有例外個案再處理
- **混用時 prose / typography 沒跟上** → `@tailwindcss/typography` 的 dark: prefix 依賴 dark class；本專案沒用 dark class，prose 在 light 下可能文字顏色偏低對比 → 補 `@utility` override 或接受 v1 debt

## Migration Plan

1. 先擴 `ColorTheme` 型別 + test → 確保型別正確
2. 加 `:root[data-theme="light"]` block → 手動在 browser DevTools 切看
3. 加 `:root[data-density="compact"]` → 同上
4. 寫 `dump-theme-variants.mjs` → 產生四組合 baseline
5. 驗證 dark + comfortable 組合 dump 與上一 change baseline 一致
6. 補 `withThemePreset` + 兩個 sample stories
7. 跑完整 verification suite

Rollback：單一 change，revert commit 即可；既有 `colorTheme='dark'` 使用者無感。

## Open Questions

- 之後要不要做 `system` theme（跟隨 OS prefers-color-scheme）？本 change 不做，留欄位但不綁
- compact 縮放係數 0.875 是直覺值，需不需做 UX 實測？先上、收反饋後調
