## ADDED Requirements

### Requirement: Multi-axis preferences store

系統 SHALL 在 `usePreferencesStore` 暴露以下正交偏好軸線，並以 zustand `persist` middleware 儲存於 localStorage key `code-quest:preferences`：

| Axis | Type | Default | Phase |
|---|---|---|---|
| `colorTheme` | `'dark'` | `'dark'` | 1（預留 `'light'`） |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | 1 |
| `density` | `'comfortable' \| 'compact'` | `'comfortable'` | 2（預留） |
| `layout` | `'a' \| 'b'` | `'a'` | 2（預留） |
| `hiddenItems` | `string[]` | `[]` | 2（預留） |

既有欄位 `isOnboardingDismissed` / `isReviewUpsellDismissed` MUST 保留。

#### Scenario: Defaults match current visual

- **WHEN** 使用者首次開啟 app、localStorage 無偏好資料
- **THEN** store 回傳上表 Default 欄位的值
- **AND** 套用後畫面的 CSS computed `--color-*` 變數與字體大小必須與 `main` 分支 hardcoded 值完全相同

#### Scenario: Persist migration for existing users

- **WHEN** localStorage 已存在只有 `isOnboardingDismissed` / `isReviewUpsellDismissed` 的舊資料
- **THEN** zustand persist `migrate` hook 補入所有新軸線的預設值
- **AND** 不覆蓋既有的 onboarding / review 欄位

#### Scenario: Individual axis setters

- **WHEN** 呼叫 `setColorTheme('dark')` / `setFontSize('lg')` 等 setter
- **THEN** store 對應欄位更新並寫入 localStorage

### Requirement: Preset apply helper

Store SHALL 提供 `applyPreset(name)` 一次更新多個軸線。Preset 本身不單獨儲存（切完即視為使用者自訂）。

#### Scenario: Apply preset batches updates

- **WHEN** 呼叫 `applyPreset('vscode-dark')`
- **THEN** 所有對應軸線一次 `set`，只觸發一次 listener

### Requirement: Apply preferences to document root

`App.tsx` SHALL 於掛載時與偏好變更時，把 `colorTheme` / `fontSize` / `density` 寫入 `document.documentElement.dataset`（對應 `data-theme` / `data-font` / `data-density`）。

#### Scenario: Initial mount syncs attributes

- **WHEN** app 掛載
- **THEN** `<html>` 具備 `data-theme="dark" data-font="md" data-density="comfortable"`（或使用者已儲存值）

#### Scenario: Store change updates attributes

- **WHEN** 呼叫 `setColorTheme` 改變值
- **THEN** `<html data-theme>` 同步更新，不觸發 React tree re-render

### Requirement: CSS variables driven by data-attributes

`packages/client/src/App.css` SHALL 以 `:root[data-theme="..."]` / `:root[data-font="..."]` selector 定義 CSS 變數，取代現行 `@theme` 寫死方式。`data-theme="dark"` 與 `data-font="md"` 的變數值 MUST 與變更前 `@theme` 區塊內容完全一致。

#### Scenario: Dump diff baseline

- **WHEN** 在 `main` 分支執行 `tools/dump-css-vars.ts` 輸出 `baseline.json`
- **AND** 在本分支執行相同腳本輸出 `current.json`
- **THEN** `diff baseline.json current.json` 結果為空
