## Why

`preferences-axes-refactor` + `light-theme-and-density` 建好了 `<html data-theme="dark|light">` token 機制，但視覺驗證只靠 Playwright 對 `<html>` 層級的 CSS vars 做 dump-diff，忽略了兩個漏洞：

1. **內聯 `style={{ background: '#...' }}`** 完全繞過 token 系統。實測切到 light theme 時，CommandPalette / PaletteMessageList 仍是深色，因為它們的背景、邊框、active row 高亮全部是寫死 hex（`#1c1e22`、`#181a1e`、`#d97757`、`rgba(217,119,87,0.07)` 等）。
2. **floating layer（dialog / palette / overlay）不在 `<html>` 層級的 CSS vars dump 範圍**，所以既有 baseline snapshot 天然漏掉。

本 change 做三件事：把這些寫死 hex 接進 token、補齊目前 token 集合缺少的語意、升級驗證機制讓未來再犯同樣錯誤會被抓到。

## What Changes

### Design token 擴充（App.css）
新增以下 token，dark/light 各自定義：
- `--color-overlay`（modal backdrop 半透明層）
- `--color-floating-bg-from` / `--color-floating-bg-to`（浮動 dialog 漸層上下兩端）
- `--color-floating-border`（浮動層邊框）
- `--color-floating-shadow`（浮動層陰影）
- `--color-row-active-bg`（active row tint）
- `--color-row-active-border`（active row left-border accent）
- `--color-accent-glow`（accent soft inner glow 陰影）

### Token 套用
把寫死 hex 換成 token，範圍：
- `components/CommandPalette.tsx`（約 15 個寫死顏色點）
- `components/palette/PaletteMessageList.tsx`（約 8 個）
- 其他 grep 掃到的 `style={{ background: '#...' }}` / `border: '... #...'` 模式

### Tailwind utility 類別（App.css `@theme`）
讓 Tailwind v4 的 `bg-floating-from` / `border-floating` 等類別可用，盡量讓 consumer 用 utility class 而不是 inline style。

### 驗證升級
- `tools/dump-theme-variants.mjs` 擴充：**開啟 floating surface 後** 也 snapshot（CommandPalette 打開、SettingsDialog 打開）。四組合（theme × density）都產生對應的「floating」截圖
- 新增 `tools/lint-hardcoded-colors.mjs`：grep 全部 `.tsx`，找 inline style 裡的 `#[0-9a-f]{3,8}` 和 `rgb(...)` / `rgba(...)`，列出哪些還沒 token 化。CI-friendly exit code。
- Storybook：為 CommandPalette / PaletteMessageList / SettingsDialog / AlertBanner / FeatureRow 補上 `Light` variant（之前只有 CommandPalette 有 LightComfortable 但沒真驗證）
- test-storybook play function：assert floating dialog 的 computed `background-color` 在 dark vs light 下不相等

## Capabilities

### Modified Capabilities

- `user-preferences`: Token set extends to cover floating UI surfaces. All inline hardcoded colors in palette/dialog/overlay code SHALL reference tokens.

## Impact

- `apps/web/src/App.css`：新增 ~7 個 token × 2 theme = ~14 行；Tailwind `@theme` 類別擴充
- `apps/web/src/components/CommandPalette.tsx`：~15 處 inline style 改用 token/utility
- `apps/web/src/components/palette/PaletteMessageList.tsx`：~8 處
- `tools/dump-theme-variants.mjs`：加 `--with-floating` mode
- `tools/lint-hardcoded-colors.mjs`：新增
- Storybook：~5 個 Light variant stories
- 風險：light palette 顏色未經設計師審核 → 同 `light-theme-and-density` 已接受的風險，視覺有明顯差異即可；細節留 follow-up
