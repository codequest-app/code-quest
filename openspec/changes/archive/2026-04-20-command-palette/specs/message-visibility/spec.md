## ADDED Requirements

### Requirement: Default visibility matches extension
There SHALL be five groups; 對話/工具/系統 SHALL be on by default, and Hooks/Debug SHALL be off by default.

#### Scenario: Initial state
- **WHEN** user opens cc-office for the first time (no localStorage entry)
- **THEN** MessageList shows 對話, 工具, 系統 messages; Hooks and Debug messages are hidden

---

### Requirement: Group-level toggle
Toggling a group SHALL turn all its types on or off at once.

#### Scenario: Toggle group off
- **WHEN** user toggles a group off in CommandPalette
- **THEN** all message types in that group disappear from MessageList

#### Scenario: Toggle group on
- **WHEN** user toggles a group on
- **THEN** all message types in that group appear in MessageList

---

### Requirement: Per-type override via pill/chip
Expanding a group in the Actions tab SHALL reveal individual type pills; clicking a pill SHALL toggle only that type.

#### Scenario: Partial group state
- **WHEN** some but not all types within a group are enabled
- **THEN** group toggle shows partial indicator `[∂]`

---

### Requirement: Persistence
Visibility state SHALL be persisted to localStorage and MUST be restored on reload.

#### Scenario: Reload restores state
- **WHEN** user reloads the page after changing visibility
- **THEN** the same groups/types are visible as before reload
