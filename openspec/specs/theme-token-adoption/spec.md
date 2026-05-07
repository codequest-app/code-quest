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

- **WHEN** 讀取 `apps/web/src/App.css` 內容
- **THEN** 不得包含 `.send-btn` class 規則
- **AND** 不得包含 `[data-permission-mode="..."]:focus-within` selector
- **AND** 不得包含寫死的 rgb 值對應 accent / button / text（如 `rgba(217, 119, 87, 0.2)`、`rgba(0, 127, 212, 0.2)`、`rgba(204, 204, 204, 0.1)`）

#### Scenario: Send button renders mode-aware classes

- **WHEN** `ComposeToolbar` 以 `permissionMode = 'plan'` 渲染 send button
- **THEN** button element `data-mode` attribute = `'plan'`
- **AND** className 含 `data-[mode=plan]:bg-button`（或等效 arbitrary value 對應 plan mode token）
- **AND** 切換 permissionMode 會自動觸發 Tailwind variant 切換，無需額外 JS

### Requirement: Tiny text sizes (10–11 px) collapse into the existing `text-xs` token

Component className strings under `apps/web/src/components/` SHALL NOT use Tailwind arbitrary values `text-[10px]` or `text-[11px]`. Both collapse into the existing `text-xs` (12 px) token. Visual weight differences for uppercase chips MUST be controlled via `tracking`, opacity (`bg-x/10`, `border-x/30`), and color choice — not by sub-12px font sizes.

The token-first rule already documents the wider principle ("差 1-2px 就近取"); this requirement makes the 10/11 → xs collapse explicit so it survives future PR review.

#### Scenario: New component
- **WHEN** a new component is added under `apps/web/src/components/`
- **THEN** its className strings contain no `text-[10px]` or `text-[11px]`
- **AND** any visually "smaller than body" element uses `text-xs`

#### Scenario: Existing arbitrary text size
- **WHEN** code review or grep finds `text-[10px]` or `text-[11px]` in a component className
- **THEN** the value is replaced with `text-xs` in the same change

#### Scenario: Chip / badge needs visual reduction
- **WHEN** a chip or badge looks too heavy at `text-xs`
- **THEN** the design adjusts via `tracking-wider`, lower opacity background, lighter color, or smaller padding — not by reverting to `text-[10px]`

### Requirement: Pixel-valued Tailwind arbitraries collapse to built-in utilities

Component className strings under `apps/web/src/components/` SHALL NOT use Tailwind arbitrary values of the form `\w+-[Npx]` (any utility, any pixel value). Tailwind v4's integer spacing (`h-9`, `max-h-120`, `max-w-45`, etc.) and existing `@theme` tokens cover the design ranges; the 1–2 px gap allowed by the "差 1-2px 就近取" rule absorbs the rest.

The arbitrary form survives only for these explicit categories:

- `calc(...)` / `min(...)` / `max(...)` expressions
- `var(--…)` references (CSS-variable indirection)
- Viewport-relative units (`*vh`, `*vw`, `*dvh`)
- em-relative units (`*em`) — keeps font-axis scaling intact
- Radix data-attribute selectors (`data-[state=…]`, `data-[highlighted]`, etc.)
- Documented "intentional off-grid" cases (e.g. `backdrop-blur-[2px]` for sub-token glass effect)

#### Scenario: New component
- **WHEN** a new component file under `apps/web/src/components/` is added
- **THEN** its className strings contain no `\w+-[Npx]` literal-pixel arbitraries

#### Scenario: Existing arbitrary
- **WHEN** code review or grep finds `\w+-[Npx]` outside the allow-list
- **THEN** the value is replaced with the matching Tailwind built-in (integer spacing or named utility) in the same change

#### Scenario: Justified arbitrary
- **WHEN** the design genuinely needs a value Tailwind cannot express (calc, var, viewport, em, intentional off-grid)
- **THEN** the arbitrary is allowed, and the surrounding code carries a brief comment explaining why

### Requirement: `text-2xs` (10 px) is the sanctioned token for chip-style and section-heading text

`@theme` SHALL declare `--text-2xs: 0.625rem` (10 px). The corresponding `text-2xs` utility is the **only** legitimate way for component code to use 10 px font size. Two use-categories qualify:

1. Uppercase tracked chip / badge labels (e.g. SpecPane `Ready`, `Archive`, task pill).
2. Section-heading utilities such as `section-label` (consolidated from the previously hardcoded `font-size: 10px`).

Body text, links, hints, and dialog descriptions continue to use `text-xs` (12 px). The arbitrary `text-[10px]` ban from `text-arbitrary-cleanup` stays in force; `text-2xs` is the proper replacement, not the arbitrary.

#### Scenario: Chip badge needs sub-12 px text
- **WHEN** an uppercase tracked chip needs less visual weight than its surrounding body text
- **THEN** the className uses `text-2xs`, not `text-[10px]`

#### Scenario: Section heading utility
- **WHEN** an `@utility` defines a section-heading style (uppercase tracked label)
- **THEN** its `font-size` is `var(--text-2xs)`, not a hardcoded `10px`

#### Scenario: Body text remains text-xs
- **WHEN** a paragraph, dialog body, or hint needs "small" text
- **THEN** the className uses `text-xs` (12 px) — `text-2xs` is reserved for chip / heading scale

### Requirement: `--color-*-rgb` tokens are restricted to inline-style alpha and mode-aware shadow indirection

The `--color-*-rgb` family in `@theme` SHALL be limited to two specific use categories that Tailwind's opacity modifier cannot serve:

1. **Inline-style alpha**: `style={{ background: 'rgba(var(--color-X-rgb), 0.N)' }}` — Tailwind's `bg-X/N` is className-only.
2. **Mode-aware shadow indirection**: `--mode-accent-rgb: var(--color-X-rgb)` re-exports that change with provider mode (Claude / Gemini / Codex), where the alpha varies per state.

Any other use case (className-driven alpha) MUST use Tailwind's opacity modifier (`bg-accent/10`, `text-success/60`, etc.) instead.

#### Scenario: New className needs alpha
- **WHEN** a developer adds a className that needs partial opacity of a theme color
- **THEN** the className uses `bg-X/N` / `text-X/N` / `border-X/N` opacity modifier — not `bg-[rgba(var(--color-X-rgb),0.N)]`

#### Scenario: Inline style needs alpha
- **WHEN** the styling cannot live in a className (conditional inline `style`, animations with dynamic alpha)
- **THEN** `rgba(var(--color-X-rgb), 0.N)` is the sanctioned pattern, and the surviving `--color-X-rgb` token must remain in `@theme`

#### Scenario: RGB-split token has zero consumers
- **WHEN** an audit finds an `--color-X-rgb` token with no inline-style or mode-shadow consumer
- **THEN** the token is removed from `@theme`

