## ADDED Requirements

### Requirement: Layout axis has full round-trip

The `layout` preference axis SHALL be fully wired end-to-end: store value, HTML data-attr, CSS override, feature factory, SettingsDialog option, and CommandPalette entry.

#### Scenario: Setting layout to 'b' updates <html>
- **WHEN** `usePreferencesStore.setLayout('b')` is called
- **THEN** `document.documentElement.dataset.layout === 'b'`
- **AND** CSS variables defined under `:root[data-layout="b"]` take effect

#### Scenario: Layout is user-switchable via SettingsDialog
- **WHEN** user opens SettingsDialog and selects 'b' in the Layout radio group
- **THEN** store `layout` becomes 'b' and persists to localStorage

#### Scenario: Layout is user-switchable via CommandPalette
- **WHEN** user opens CommandPalette (actions tab) and clicks the layout feature row
- **THEN** `layout` cycles to the next value
