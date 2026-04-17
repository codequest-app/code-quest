## ADDED Requirements

### Requirement: MenuItemFeature supports trailing UI
`MenuItemFeature` SHALL support an optional `trailing` field of type `React.ReactNode` that is passed through to the rendered `MenuItem`.

#### Scenario: Feature with trailing renders it in menu
- **WHEN** a `MenuItemFeature` has a `trailing` value
- **THEN** the corresponding `MenuItem` SHALL include that value as its `trailing` field

### Requirement: Effort feature as MenuItemFeature
The system SHALL provide `createEffortFeature({ effort, effortLevels, onSetEffort })` that returns a `MenuItemFeature` with id `effort-level`, section `Model`, and an `EffortSwitch` as trailing.

#### Scenario: Clicking effort item cycles to next level
- **WHEN** user clicks the effort menu item
- **THEN** `onSetEffort` SHALL be called with the next effort level in the list

#### Scenario: No effort levels disables click
- **WHEN** `effortLevels` is empty and user clicks the effort menu item
- **THEN** `onSetEffort` SHALL NOT be called

### Requirement: Thinking feature as MenuItemFeature
The system SHALL provide `createThinkingFeature({ isThinkingOn, onSetThinkingLevel })` that returns a `MenuItemFeature` with id `toggle-thinking`, section `Model`, and a `ToggleSwitch` as trailing.

#### Scenario: Clicking thinking item toggles state
- **WHEN** `isThinkingOn` is false and user clicks the thinking menu item
- **THEN** `onSetThinkingLevel` SHALL be called with `'default_on'`

#### Scenario: Clicking thinking item when on turns it off
- **WHEN** `isThinkingOn` is true and user clicks the thinking menu item
- **THEN** `onSetThinkingLevel` SHALL be called with `'off'`

### Requirement: Fast mode feature as MenuItemFeature
The system SHALL provide `createFastModeFeature({ isFastMode, fastModeState, setFastMode })` that returns a `MenuItemFeature` with id `fast-mode`, section `Model`, and a `ToggleSwitch` as trailing.

#### Scenario: Clicking fast mode item toggles it on
- **WHEN** `fastModeState` is `'off'` and user clicks the fast mode menu item
- **THEN** `setFastMode` SHALL be called with `true`

#### Scenario: Fast mode only added when supported
- **WHEN** `supportsFastMode` is false
- **THEN** the fast mode feature SHALL NOT be included in `localFeatures`

### Requirement: BuildMenuItemsParams removes model state params
`BuildMenuItemsParams` SHALL NOT contain `effort`, `effortLevels`, `isThinkingOn`, `isFastMode`, `fastModeState`, `onSetEffort`, `onSetThinkingLevel`, `setFastMode`, `supportsFastMode`.

#### Scenario: buildMenuItems receives no model state params
- **WHEN** `buildMenuItems` is called
- **THEN** it SHALL derive the model section solely from registry features and `localFeatures`
