## MODIFIED Requirements

### Requirement: CommandPalette is feature-driven

`CommandPalette.tsx` SHALL be an orchestrator that delegates message rendering to `<PaletteMessageList>` and action rendering to `<PaletteCommandList>`. Actions come from a `Feature[]` composed at render time from：
- `createFilterFeatures(...)` — registry 取得或 palette instance
- `createRawPanelFeature(...)` — palette instance
- `createColorThemeFeature(...)` — palette instance（read `usePreferencesStore`）
- `createDensityFeature(...)` — palette instance
- `createOpenSettingsFeature(...)` — palette instance

Inline `MessageResultList`、`ActionsTab` render path、`highlight` / `typeColor` / `typeLabel` helpers MUST 從 `CommandPalette.tsx` 移除（搬到 `utils/message-preview.ts`）。

#### Scenario: Actions tab renders palette command list

- **WHEN** 切到 actions tab
- **THEN** DOM 包含由 `<PaletteCommandList>` 渲染的 rows，涵蓋 filters + raw panel + theme + density + open preferences

#### Scenario: Messages tab renders palette message list

- **WHEN** 切到 messages tab
- **THEN** DOM 包含由 `<PaletteMessageList>` 渲染的訊息 rows

#### Scenario: Click "Switch theme" in palette toggles colorTheme

- **WHEN** 在 actions/all tab 點 "Switch theme" row
- **THEN** `usePreferencesStore.getState().colorTheme` 切換（dark ↔ light）

#### Scenario: Click "Open preferences" in palette opens SettingsDialog

- **WHEN** 點 "Open preferences" row
- **THEN** `openSettingsSignal.isOpen` 變 true

### Requirement: CommandMenu no longer registers palette-only features

`CommandMenu.tsx` SHALL remove `createColorThemeFeature` / `createDensityFeature` / `createOpenSettingsFeature` from its `localFeatures` list. The three imports MUST also be removed. The corresponding 3 click-through tests in `CommandMenu.test.tsx` MUST be removed (scenario now vacuously holds — feature not present).

#### Scenario: CommandMenu no longer shows Switch theme

- **WHEN** 開啟 `/` CommandMenu
- **THEN** DOM 不包含 "Switch theme" menu item

#### Scenario: CommandMenu no longer shows Toggle density

- **WHEN** 開啟 `/` CommandMenu
- **THEN** DOM 不包含 "Toggle density" menu item

#### Scenario: CommandMenu no longer shows Open preferences

- **WHEN** 開啟 `/` CommandMenu
- **THEN** DOM 不包含 "Open preferences" menu item

#### Scenario: CommandMenu retains other features

- **WHEN** 開啟 `/` CommandMenu
- **THEN** DOM 仍包含 clear / model / thinking / attach / manage plugins / mcp servers / mcp status / effort / fast mode / btw 等項目
