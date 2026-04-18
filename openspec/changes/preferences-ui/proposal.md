## Why

`preferences-axes-refactor` 與 `light-theme-and-density` 已把多軸偏好的底層建好（store + CSS vars + persist），但**沒有 UI 入口**。目前使用者只能透過 DevTools console 切換，形同沒做。本 change 補上兩層入口：快速切換（Cmd+K）與整合面板（Settings Dialog）。

## What Changes

**Phase A — CommandMenu features（快速切換）**
- 新增 `features/color-theme/color-theme-feature.tsx`：跟 fast-mode / thinking 同 `MenuItemFeature` 形，提供「Switch theme」入口
- 新增 `features/density/density-feature.tsx`：同樣結構，提供「Toggle density」入口
- 在 `CommandMenu.tsx` 註冊兩個新 feature（放 `General` section）
- 兩者皆讀 `usePreferencesStore`，trailing 顯示當前值，`execute()` 切換到下一個值

**Phase B — SettingsDialog（整合面板）**
- 新增 `components/SettingsDialog.tsx`：Radix Dialog，列出 theme（radio: dark/light）、density（radio: comfortable/compact）、fontSize（radio: sm/md/lg）
- 在 `ActivityBar` 底部加 ⚙ gear icon，onClick 開 dialog
- 在 `features/` 加 `open-settings-feature.tsx` 讓 Cmd+K 也能打開 dialog
- 切換 live preview（直接寫 store，無確認按鈕；dialog 關閉時維持當前選擇）

## Capabilities

### New Capabilities

- `preferences-ui`: 使用者介面 — 包含 CommandMenu quick toggles 與 SettingsDialog 整合面板，以及 ActivityBar gear 入口

### Modified Capabilities

- `command-menu-structure`: General section 新增 color-theme / density / open-settings 三個 menu items

## Impact

- 新增：
  - `packages/client/src/features/color-theme/color-theme-feature.tsx` + test + story
  - `packages/client/src/features/density/density-feature.tsx` + test + story
  - `packages/client/src/features/open-settings/open-settings-feature.tsx` + test
  - `packages/client/src/components/SettingsDialog.tsx` + story + interaction test
- 修改：
  - `packages/client/src/components/CommandMenu.tsx`（註冊 3 個新 feature）
  - `packages/client/src/components/ActivityBar.tsx`（加 gear icon 按鈕）
- 不改 store / CSS（底層沿用）
- 風險：SettingsDialog 內 live preview 可能讓使用者覺得「還沒確認」就變了 → 以清晰視覺（radio 立即高亮）讓意圖明確；標明「變更自動儲存」
