## ADDED Requirements

### Requirement: colorTheme preference accepts 'system'

The `ColorTheme` enum SHALL include `'system'` in addition to `'dark'` and `'light'`. The default for new users SHALL be `'system'`.

#### Scenario: system is the default for a fresh install
- **WHEN** the store initializes with no persisted value
- **THEN** `colorTheme` is `'system'`

#### Scenario: system preference survives migration
- **WHEN** persisted state contains `{ colorTheme: 'light' }` at version 3
- **THEN** `colorTheme` is `'light'` after hydration (existing user's choice preserved)

### Requirement: Effective theme tracks OS preference when colorTheme is 'system'

The effective color theme (written to `<html data-theme>` and consumed by non-CSS surfaces like CodeBlock) SHALL follow `prefers-color-scheme` when the user selected `'system'`, and SHALL react live to OS-level preference changes.

#### Scenario: system + OS dark → effective dark
- **WHEN** colorTheme is `'system'` and the OS reports `prefers-color-scheme: dark`
- **THEN** `<html data-theme>` is `'dark'`

#### Scenario: system + OS light → effective light
- **WHEN** colorTheme is `'system'` and the OS reports `prefers-color-scheme: light`
- **THEN** `<html data-theme>` is `'light'`

#### Scenario: OS preference changes live
- **WHEN** the user has colorTheme `'system'` and the OS flips from dark to light
- **THEN** `<html data-theme>` updates from `'dark'` to `'light'` without page reload

### Requirement: SettingsDialog uses FeatureRow for all preference choices

Color theme / density / font-size preferences in SettingsDialog SHALL render via the same `FeatureRow` component used by CommandPalette, with the choice options presented as `ChoicePills` trailing.

#### Scenario: SettingsDialog renders a feature row per preference
- **WHEN** SettingsDialog opens
- **THEN** it contains three elements with `data-testid="feature-row-*"` (one per preference)
- **AND** each row's trailing is a ChoicePills group

#### Scenario: Clicking a ChoicePill in SettingsDialog updates the store
- **WHEN** user clicks the 'System' pill in the color-theme row
- **THEN** `usePreferencesStore.getState().colorTheme === 'system'`
