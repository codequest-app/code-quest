## ADDED Requirements

### Requirement: hiddenItems is the source of truth for dismissible UI

Every UI component that supports user-dismissal SHALL store its dismissed state as an ID inside `usePreferencesStore.hiddenItems`, not as a dedicated boolean flag.

#### Scenario: Dismissing onboarding overlay adds its ID to hiddenItems
- **WHEN** user dismisses the OnboardingOverlay
- **THEN** `hiddenItems` contains `'onboarding-overlay'`
- **AND** the overlay does not render on next mount

#### Scenario: Reset dismissed clears hiddenItems
- **WHEN** user clicks "Show dismissed items" in SettingsDialog or runs the CommandPalette feature
- **THEN** `hiddenItems` becomes an empty array
- **AND** all previously dismissed UI components render again

#### Scenario: v2 → v3 migration preserves dismissal state
- **WHEN** a user with v2 persisted state (`isOnboardingDismissed: true`) upgrades
- **THEN** `hiddenItems` contains `'onboarding-overlay'` after migration
- **AND** re-running migration is idempotent (no duplicate IDs)
