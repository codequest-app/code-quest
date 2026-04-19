## ADDED Requirements

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
