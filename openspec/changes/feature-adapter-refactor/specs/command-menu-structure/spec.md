## MODIFIED Requirements

### Requirement: Feature factories return Feature shape

既有 feature factories（`features/*/`）SHALL 回傳 `Feature` 或 `Feature[]`，不再直接回 `MenuItemFeature` / `SlashCommandFeature`。檔名 MUST 為 `.ts`（不含 JSX）。

遷移範圍（完整清單於 tasks.md）：
- 無 state：`clear`, `compact`, `resume`, `rewind`, `new-conversation`, `usage`, `view-help`, `switch-account`, `reload-plugins`, `mention-file`, `attach-file`, `manage-plugins`, `mcp-servers`, `mcp-status`, `general-config`, `open-settings`
- 有 state：`fast-mode`, `thinking`, `color-theme`, `density`, `effort`, `model`
- 複雜：`btw`（合併 slash + menu）
- Palette-only：`filters`, `raw-panel`

#### Scenario: Factory file has no React imports

- **WHEN** inspect 任一遷移後 factory 檔案的 import
- **THEN** 不含 `react` / `.tsx` 元件 / JSX fragment

#### Scenario: Existing integration tests unchanged

- **WHEN** 跑遷移前曾 PASS 的 CommandMenu / ComposeToolbar / Channel context 測試
- **THEN** 全數 PASS，無 expect 變動

### Requirement: CommandMenu consumes Feature[] via adapter

`CommandMenu.tsx` SHALL 從 `FeatureRegistry.getFeatures()` 取得 `Feature[]`，透過 `toMenuItem` 轉成 `MenuItemFeature[]`，再餵給既有 `buildMenuItems` 流程。既有渲染路徑不變。

#### Scenario: CommandMenu stories render identically

- **WHEN** 跑 `pnpm test-storybook:ci` 於 CommandMenu stories
- **THEN** 全數 PASS（視覺 byte-identical）

### Requirement: btw unifies slash + menu in one Feature

`features/btw/btw-feature.ts` SHALL 暴露單一 `createBtwFeature(deps)` 回傳 `Feature`（含 `slash` 欄位）。舊的 `createBtwLocalFeature` / `createBtwFeature`（兩個 factory）合併為一。

#### Scenario: Single factory covers both surfaces

- **WHEN** 呼叫 `createBtwFeature(deps)`
- **THEN** 回傳物件同時有 `execute`（menu click）與 `slash.invoke`（`/btw xxx` 輸入）

#### Scenario: SlashCommand adapter extracts correctly

- **WHEN** `toSlashCommand(createBtwFeature(deps))`
- **THEN** 回 `SlashCommandFeature`，`command === '/btw'`，`invoke` 與原 feature 的 `slash.invoke` 同參考
