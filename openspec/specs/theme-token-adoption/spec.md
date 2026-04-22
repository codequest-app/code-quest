# theme-token-adoption Specification

## Purpose
TBD - created by archiving change theme-token-adoption. Update Purpose after archive.
## Requirements
### Requirement: No runtime color is hardcoded outside CSS variables

Every color value that affects runtime visual SHALL be reachable via a CSS custom property (`var(--color-*)`). Component code MUST NOT embed literal hex / rgb / rgba values in `style={{...}}` except for values that are explicitly theme-invariant (e.g. `transparent`, `currentColor`).

#### Scenario: lint catches a new hardcoded color
- **WHEN** a `.tsx` file introduces `style={{ background: '#abc123' }}`
- **THEN** `tools/lint-hardcoded-colors.mjs` exits with code 1 and points to the offending line

#### Scenario: CommandPalette reacts to theme switch
- **WHEN** user switches `colorTheme` from `dark` to `light` with CommandPalette open
- **THEN** the palette background, border, and row-active tint visibly change
- **AND** no element inside the palette renders with a dark-theme-only color

### Requirement: Floating surfaces have Storybook variant coverage

Components that render floating surfaces (CommandPalette, SettingsDialog, dialogs with `position: fixed`) SHALL have both `Dark` and `Light` stories, and a Playwright snapshot in `tools/snapshots/theme-variants/` covering each combination.

#### Scenario: Playwright dump captures floating layer
- **WHEN** `pnpm dump-theme-variants --with-floating` runs
- **THEN** it emits 4 base snapshots + 4 floating snapshots (theme × density)
- **AND** floating snapshots visibly differ between dark and light themes

### Requirement: InputArea colors follow data-theme

`ChatInputArea`（含其內部 ComposeInput / ComposeToolbar / SpeechInputButton）所渲染的背景、邊框、hover tint、focus-within shadow 顏色 MUST 透過已套主題覆寫的 CSS custom property 取得；`data-theme` 切換時整塊 InputArea 的相關 computed color 值 MUST 跟著改變。

#### Scenario: InputArea background/border switch with data-theme

- **WHEN** `<html data-theme="dark">` 時 render `ChatInputArea`
- **THEN** 外層容器使用 `bg-surface` + `border-border` 類別（或對應 token）
- **AND** `--color-surface` computed = `#252526`、`--color-border` computed = `#3e3e42`
- **WHEN** 切換成 `<html data-theme="light">`
- **THEN** `--color-surface` computed = `#f3f3f3`、`--color-border` computed = `#d4d4d4`

#### Scenario: Hover tint follows data-theme

- **WHEN** `data-theme="dark"` 時 `document.documentElement` computed `--color-hover-tint-rgb`
- **THEN** 值為 `255, 255, 255`
- **WHEN** 切到 `data-theme="light"`
- **THEN** 值為 `0, 0, 0`
- **AND** 所有 InputArea 相關元件（IconButton、PermissionModePicker、AddButton、ReviewUpsellBanner、MentionDropdown、CommandMenu、ModelPickerPopover）hover 行為使用 `hover-tint-5` / `hover-tint-10` utility（或等效 arbitrary value 引用同一 token），不得出現 `bg-white/5` / `bg-white/10`

#### Scenario: Permission-mode shadow follows rgb tokens

- **WHEN** `data-permission-mode="normal"` focus-within
- **THEN** shadow 顏色經由 `rgba(var(--color-accent-rgb), 0.2)` 表達
- **WHEN** `data-permission-mode="plan"` focus-within
- **THEN** shadow 經由 `rgba(var(--color-button-rgb), 0.2)` 表達
- **WHEN** `data-permission-mode="acceptEdits"` focus-within
- **THEN** shadow 經由 `rgba(var(--color-text-rgb), 0.1)` 表達
- **AND** 三個 rgb token 都在 dark / light 各有對應值

### Requirement: No single-region token aliases

新增的 CSS custom property MUST NOT 僅為單一區塊建立與既有 semantic token 同義的別名（例如 `--color-chat-input-bg` = `--color-surface`）。若某區塊需要不同色值，該差異 SHALL 以新 semantic token 表達（例如 `--color-code-block`），而非以位置命名的別名。

#### Scenario: Review rejects redundant alias token

- **WHEN** PR 新增 `--color-<region>-bg` 且其在所有主題下值都等於另一既有 token
- **THEN** review 必須要求直接使用該既有 token、或提出語意上不同的差異值

### Requirement: Permission-mode visuals do not rely on global CSS selectors

Permission-mode 相關的視覺樣式（send button 背景、ChatInputArea focus-within border / shadow）MUST NOT 以 `App.css` 的 global `.send-btn` class 或 `[data-permission-mode="..."]:focus-within` selector 實作。這些樣式 SHALL 以元件自身 `data-mode` 屬性 + Tailwind `data-[mode=...]` variant（或等效元件層封裝）表達，確保 permission-mode 行為與元件實作鎖在一起、且可被單元測試以 className 斷言驗證。

#### Scenario: App.css carries no permission-mode selector

- **WHEN** 讀取 `packages/client/src/App.css` 內容
- **THEN** 不得包含 `.send-btn` class 規則
- **AND** 不得包含 `[data-permission-mode="..."]:focus-within` selector
- **AND** 不得包含寫死的 rgb 值對應 accent / button / text（如 `rgba(217, 119, 87, 0.2)`、`rgba(0, 127, 212, 0.2)`、`rgba(204, 204, 204, 0.1)`）

#### Scenario: Send button renders mode-aware classes

- **WHEN** `ComposeToolbar` 以 `permissionMode = 'plan'` 渲染 send button
- **THEN** button element `data-mode` attribute = `'plan'`
- **AND** className 含 `data-[mode=plan]:bg-button`（或等效 arbitrary value 對應 plan mode token）
- **AND** 切換 permissionMode 會自動觸發 Tailwind variant 切換，無需額外 JS

