## ADDED Requirements

### Requirement: CommandMenu quick toggles for theme and density

CommandMenu SHALL 提供 `Switch theme` 與 `Toggle density` 兩個 menu items（`General` section）。

`Switch theme` 每次執行從 `'dark' → 'light' → 'dark'` 循環切；`Toggle density` 同理循環 `'comfortable' ↔ 'compact'`。trailing 區塊顯示當前值。

#### Scenario: Cmd+K switch theme

- **WHEN** 使用者打開 CommandMenu 並執行 `Switch theme` 項目
- **THEN** `usePreferencesStore` 的 `colorTheme` 被設為原值的另一個（dark ↔ light）
- **AND** `<html data-theme>` 於下一個 render 同步更新
- **AND** CommandMenu 依 `closeSilent` 不關閉（使用者可連續切）

#### Scenario: Current value shown in trailing

- **WHEN** menu item render
- **THEN** trailing 區塊顯示當前 axis 值（例如 "dark" / "light"）

### Requirement: ActivityBar settings entry

`ActivityBar` SHALL 在底部顯示 ⚙ gear icon 按鈕（`mt-auto` 貼底）。點擊後開啟 `SettingsDialog`。

#### Scenario: Click opens dialog

- **WHEN** 使用者點 ActivityBar 底部 gear icon
- **THEN** `SettingsDialog` open 狀態變 true

### Requirement: SettingsDialog integrates all preference axes

`SettingsDialog` SHALL 提供 theme、fontSize、density 三個 radio group，顯示當前選擇、radio click 立即呼叫對應 setter（live-save），不需 Apply/Cancel。

Dialog 頂部 SHALL 顯示短說明：「Changes apply instantly and are saved automatically.」

#### Scenario: Radio selection updates store

- **WHEN** 使用者在 SettingsDialog 點 `fontSize=lg` radio
- **THEN** `usePreferencesStore.fontSize` 立即變為 `'lg'`
- **AND** `<html data-font="lg">` 同步更新
- **AND** dialog 保持開啟

#### Scenario: Esc / Close dismisses dialog

- **WHEN** dialog 開啟時使用者按 Esc 或點 `Close` 按鈕
- **THEN** dialog 關閉
- **AND** 所有剛才的選擇仍保留（已經 live-save 過）

### Requirement: open-settings CommandMenu feature

CommandMenu SHALL 提供 `Settings...` 或 `Open preferences` menu item（`General` section），執行後打開 `SettingsDialog`。

#### Scenario: Cmd+K open settings

- **WHEN** 使用者從 CommandMenu 執行 `Open preferences`
- **THEN** `SettingsDialog` 開啟
- **AND** CommandMenu 關閉（`closeSilent: false`）
