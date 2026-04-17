## Context

`MenuItemFeature` 目前只支援 `label`、`section`、`order` 等純文字欄位，無法攜帶 trailing JSX。effort-level、toggle-thinking、fast-mode 因此只能 inline 在 `buildMenuItems` 裡，導致 `BuildMenuItemsParams` 需要傳入 9 個 model 狀態參數。

## Goals / Non-Goals

**Goals:**
- `MenuItemFeature` 支援 optional `trailing: React.ReactNode`
- 三個 inline items 抽成獨立 feature factory，行為完全不變
- `buildMenuItems` 參數數量大幅減少

**Non-Goals:**
- 不改變 UI 外觀或行為
- 不動 `FeatureRegistry` 或 `buildSection` 邏輯

## Decisions

**`trailing` 放在 `MenuItemFeature` 而非 `MenuItem`**
feature 是資料來源，MenuItem 是轉換結果。trailing 在 feature 層定義，`buildMenuItems` 直接 pass-through 到 MenuItem，不需要額外轉換邏輯。

**feature factory 接收 reactive state 作為參數**
三個 feature 的 label/trailing/onClick 都依賴 reactive state，factory 在 CommandMenu render 時呼叫，每次 render 拿到最新 closure，行為與 inline 相同。

**`supportsFastMode` 決定是否加入 `localFeatures`**
原本是 conditional spread `...(supportsFastMode ? [...] : [])`，改為 `createFastModeFeature` 只在 `supportsFastMode` 為 true 時才加入陣列。

## Risks / Trade-offs

- `trailing: React.ReactNode` 讓 `MenuItemFeature` 帶入 React 依賴 — 可接受，因為 feature layer 本就在 client package
- 無 migration 風險，純內部重構，public API 不變
