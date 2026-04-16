## ADDED Requirements

### Requirement: Panel toggles section
Actions tab shows a "Panels" section with toggleable panel commands.

#### Scenario: Toggle Raw Event Panel
- **WHEN** user activates "Raw Event Panel" action
- **THEN** Raw Event Panel opens or closes (toggle)

---

### Requirement: Message Visibility section with expandable groups
Actions tab shows "Message Visibility" section; each group row has a toggle `[●/○]` and a chevron `▶/▼` for inline expansion.

#### Scenario: Expand group
- **WHEN** user clicks the chevron `▶` on a group row
- **THEN** group expands inline showing pill/chips for each type in that group; chevron becomes `▼`

#### Scenario: Collapse group
- **WHEN** user clicks `▼` on an expanded group
- **THEN** pills collapse; chevron returns to `▶`

#### Scenario: Toggle group from row
- **WHEN** user clicks the `[●/○]` toggle on a group row
- **THEN** all types in group flip on/off; expansion state unchanged

#### Scenario: Toggle individual pill
- **WHEN** user clicks a type pill inside an expanded group
- **THEN** only that type is toggled; group shows partial indicator if mixed

---

### Requirement: All tab shows flat group-level actions only
In All tab, Message Visibility actions appear as flat group rows (no expansion, no pills).

#### Scenario: All tab action display
- **WHEN** All tab is active
- **THEN** each visibility group appears as a single toggle row, no chevron or pills visible
