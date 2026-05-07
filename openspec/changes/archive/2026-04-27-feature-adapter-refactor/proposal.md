## Why

現在 feature factory（fast-mode、thinking、model、clear、btw…共 20+ 個）同時扛兩件事：**能力定義**（什麼狀態、要 execute 什麼）與**UI 呈現**（trailing JSX、section 名、closeSilent）。導致：

- Factory 必須 import React / JSX，不能當純資料消費
- 要讓同個 feature 出現在新 UI（CommandPalette Actions tab、未來 keyboard shortcut 面板）就得改所有 factory
- Slash command 與 menu item 是兩個 interface，一個 feature 有兩種入口時要開兩個 factory（`btw`）
- 跨 UI 想要不同視覺（palette 用色票、menu 用文字）做不到

本 change 引入 **adapter 模式**：feature factory 回傳純資料 `Feature`，各 UI 的 `to*()` adapter 把 `Feature` shape 成該 UI 需要的形狀。

## What Changes

- 新增 `Feature` type（`lib/feature.ts`），包含：
  - 基本欄位：`id`, `label`, `category`, `order?`, `description?`, `disabled?`
  - `state?: FeatureState` 表達 UI 狀態（discriminated union：`toggle` / `tri-state` / `select`）
  - `execute(): void`
  - `slash?: { command, match?, invoke }` 選配 slash binding
- 新增 3 個 adapter：`toMenuItem(f)`、`toPaletteCommand(f)`、`toSlashCommand(f)`（後者可回 null）
- 新增 `trailing-renderers.tsx`：`state.kind → JSX` 對應表，兩個 adapter 共用
- 20+ 個 factory 遷移成 `Feature` 回傳型別；`.tsx` → `.ts`（無 JSX）
- `FeatureRegistry` 改存 `Feature[]`；既有 getter 內部 apply adapter
- **保留** `MenuItemFeature` / `SlashCommandFeature` 型別（為 backward compat），但來源改由 adapter 產生
- **不動 FakeSummoner-based 測試**（詳見約束）

## Capabilities

### New Capabilities

- `feature-adapter`: `Feature` type、`FeatureState` enum、三個 adapter、統一 trailing renderer

### Modified Capabilities

- `command-menu-structure`: CommandMenu 從 registry 拿 `Feature[]`、`map(toMenuItem)` → 餵既有 `buildMenuItems` 流程
- `user-preferences` / `preferences-ui` / `command-palette`: 相關 feature factory 遷移

## Impact

**新增**（~250 LOC）：
- `apps/web/src/lib/feature.ts`（擴型別）
- `apps/web/src/lib/adapters/to-menu-item.tsx`
- `apps/web/src/lib/adapters/to-palette-command.tsx`
- `apps/web/src/lib/adapters/to-slash-command.ts`
- `apps/web/src/lib/adapters/trailing-renderers.tsx`
- 上述每個檔對應 test

**修改**（~400 LOC）：
- 20+ 個 feature factory（`features/*/`，部分含 test 要同步調整）
- `FeatureRegistry`（`lib/feature-registry.ts`）
- CommandMenu wiring
- 可能需要：`CommandPalette.tsx` / `ComposeToolbar.tsx`（若 feature 註冊點有變）

**不動**：
- 既有元件（ChatPanel、MessageList、SettingsDialog…）
- 既有樣式 / App.css
- 既有 FakeSummoner-based 測試（見下）

## 約束：FakeSummoner-based 測試

專案 ~27 個測試使用 `FakeSummoner`（見 tasks.md pre-refactor audit），涵蓋 session/channel/config/socket 等跨整合路徑。本 change 原則：
- **這些測試必須保持 PASS**，不修改其 `expect` 也不改 scenario 語意
- 若遷移過程發現某個 FakeSummoner 測試會壞 → **暫停、回報、討論**；不自作主張改
- 若 pre-refactor audit 發現某 UI 行為無被 FakeSummoner 測試覆蓋 → **先補測試**，再重構

## 風險 / 緩解

- **批次遷移 factory 出錯的連鎖** → 每個 factory 獨立 commit 內小 red-green-refactor；每次驗 vitest + typecheck
- **Adapter trailing 視覺漂移** → storybook snapshot 比對，差異明顯才動
- **`closeSilent` 語意從 factory 消失**（搬到 adapter） → adapter 用 `state.kind === 'toggle'` 啟動；特殊個案用 `feature.ui?.closeSilent` 覆寫
- **Registry 兼容期新舊並存** → Phase 1 完成後 registry 內部全轉 Feature，對外 API 不變
