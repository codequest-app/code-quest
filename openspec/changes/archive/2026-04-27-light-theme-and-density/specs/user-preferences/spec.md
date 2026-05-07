## MODIFIED Requirements

### Requirement: Multi-axis preferences store

系統 SHALL 在 `usePreferencesStore` 暴露以下正交偏好軸線，並以 zustand `persist` middleware 儲存於 localStorage key `code-quest:preferences`：

| Axis | Type | Default |
|---|---|---|
| `colorTheme` | `'dark' \| 'light'` | `'dark'` |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `density` | `'comfortable' \| 'compact'` | `'comfortable'` |
| `layout` | `'a' \| 'b'` | `'a'` |
| `hiddenItems` | `string[]` | `[]` |

既有欄位 `isOnboardingDismissed` / `isReviewUpsellDismissed` MUST 保留。

#### Scenario: colorTheme accepts light

- **WHEN** 呼叫 `setColorTheme('light')`
- **THEN** store `colorTheme` 變為 `'light'`
- **AND** `<html data-theme="light">` 且 CSS computed `--color-bg` 為 `#ffffff`

#### Scenario: density compact shrinks spacing

- **WHEN** `data-density="compact"` 套用於 `<html>`
- **THEN** `getComputedStyle(html).getPropertyValue('--spacing').trim()` 為 `0.21875rem`
- **AND** 任何 `p-4` 元素的 computed `padding` 等比縮小（= 0.875 × comfortable 值）

#### Scenario: dark + comfortable identical to prior baseline

- **WHEN** `data-theme="dark" data-density="comfortable"`（或 data-density 未設）
- **THEN** `:root` 所有 `--color-*` 與 `--spacing` 值與 `tools/snapshots/css-vars-baseline.json`（preferences-axes-refactor 產出）完全一致

#### Scenario: Defaults match current visual

- **WHEN** 使用者首次開啟 app、localStorage 無偏好資料
- **THEN** store 回傳上表 Default 欄位的值
- **AND** 套用後畫面與 dark+comfortable 一致

#### Scenario: Persist migration preserves previous preferences

- **WHEN** localStorage 已存在 v2 格式偏好資料
- **THEN** rehydrate 後欄位值不變（不回頭覆蓋使用者已切過的 light/compact）

### Requirement: CSS variables driven by data-attributes

`apps/web/src/App.css` SHALL 以 `:root[data-theme="..."]` / `:root[data-font="..."]` / `:root[data-density="..."]` selector 定義 CSS 變數。`data-theme="light"` 必須提供對比度滿足 WCAG AA 的 palette（前景 / 背景對比 ≥ 4.5:1 for normal text）。`data-density="compact"` 必須覆寫 Tailwind `--spacing` base。

#### Scenario: Light palette contrast

- **WHEN** `data-theme="light"` 套用
- **AND** 計算 `--color-text` vs `--color-bg` 的 contrast ratio
- **THEN** 比值 ≥ 4.5

#### Scenario: Compact override affects Tailwind utilities

- **WHEN** `data-density="compact"` 套用
- **AND** 元素使用 Tailwind `p-4` class
- **THEN** computed padding = `4 × 0.21875rem` = `0.875rem`（即 14px）
