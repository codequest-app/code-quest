## ADDED Requirements

### Requirement: Single ⌘K trigger replaces all toolbar buttons
HeaderBar exposes only `onOpenCommandPalette` — all other action props (onToggleRaw, rawActive, onOpenSpotlight) are removed.

#### Scenario: Only ⌘K button visible
- **WHEN** HeaderBar renders
- **THEN** only the ⌘K / search icon button is present; no raw-toggle or filter buttons

#### Scenario: onOpenCommandPalette called on click
- **WHEN** user clicks the ⌘K button
- **THEN** onOpenCommandPalette callback is invoked
