## ADDED Requirements

### Requirement: Open / close
The CommandPalette opens on ⌘K (or Ctrl+K) from anywhere in the app and closes on Esc or backdrop click.

#### Scenario: Open with keyboard shortcut
- **WHEN** user presses ⌘K
- **THEN** CommandPalette overlay appears with focus on the search input

#### Scenario: Close on Esc
- **WHEN** CommandPalette is open and user presses Esc
- **THEN** CommandPalette closes

#### Scenario: Close on backdrop click
- **WHEN** user clicks outside the palette panel
- **THEN** CommandPalette closes

---

### Requirement: Three tabs — All, Messages, Actions
The palette has three tabs. The active tab filters what is shown in the results list.

#### Scenario: All tab (default)
- **WHEN** palette opens with no query
- **THEN** All tab is active, showing pinned Actions (flat, group-level) followed by recent Messages

#### Scenario: Messages tab
- **WHEN** user selects Messages tab
- **THEN** only message search results are shown

#### Scenario: Actions tab
- **WHEN** user selects Actions tab
- **THEN** only action items (panel toggles + message visibility groups) are shown

---

### Requirement: Keyboard navigation
↑↓ moves the active item, Enter activates it, Tab cycles tabs.

#### Scenario: Arrow navigation
- **WHEN** palette is open and user presses ↓ or ↑
- **THEN** active item moves down or up through the visible list

#### Scenario: Enter activates item
- **WHEN** an item is active and user presses Enter
- **THEN** the item's action executes (jump to message or toggle action)

#### Scenario: Tab cycles tabs
- **WHEN** user presses Tab inside the palette
- **THEN** active tab advances (All → Messages → Actions → All)
