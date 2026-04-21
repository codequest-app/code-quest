## ADDED Requirements

### Requirement: matchFirstToken filter ignores empty first token
`filterMenuItems` SHALL NOT match a `matchFirstToken` item when the filter's first token (before the first space) is empty. An empty string MUST NOT be treated as a universal substring match.

#### Scenario: Leading space filter does not match every matchFirstToken item
- **WHEN** the compose value is `/ wiki` (slash followed by space then text) producing a slash filter of `" wiki"`
- **THEN** `filterMenuItems` SHALL return no items that are only visible because their `matchFirstToken` flag treats `""` as a match
- **AND** `/btw` (which has `matchFirstToken: true` and label `/btw`) SHALL NOT appear in the palette

#### Scenario: Regular matchFirstToken usage still works
- **WHEN** the compose value is `/btw how are you` producing a slash filter of `"btw how are you"`
- **THEN** `/btw` SHALL appear because its label contains the first token `"btw"`

### Requirement: Palette hides when filter contains whitespace
The command palette SHALL hide as soon as the slash filter contains any whitespace character. Typing a space after `/` signals the user has finished picking and intends to send raw text (e.g. `/test `, `/ wiki`, `/btw hello`).

#### Scenario: Trailing space hides the palette
- **WHEN** the compose value is `/test ` (trailing space)
- **THEN** the palette surface SHALL NOT render

#### Scenario: Leading space hides the palette
- **WHEN** the compose value is `/ wiki` (space immediately after slash)
- **THEN** the palette surface SHALL NOT render

#### Scenario: Unmatched filter without whitespace keeps palette visible
- **WHEN** the compose value is `/zzznomatch` (no whitespace, no matches)
- **THEN** the palette SHALL render and show the "No matching commands" empty state

### Requirement: Enter submits raw slash text when no palette items match
When `slashOpen` is true but `flatItems` is empty, pressing Enter SHALL submit the compose value via the normal send path (which routes through `findSlashCommand` and falls back to `sendMessage`). The palette MUST NOT consume Enter when it has nothing to select.

#### Scenario: Enter with unmatched slash sends the text
- **WHEN** the compose value is `/test` (no registered feature matches it)
- **AND** the user presses Enter
- **THEN** `sendMessage("/test")` SHALL be called (which forwards to the CLI as a slash command)
- **AND** the compose value SHALL clear

#### Scenario: Enter with matched palette item still selects the item
- **WHEN** the compose value is `/btw` (palette shows `/btw` item)
- **AND** the user presses Enter
- **THEN** the palette SHALL execute the selected item (unchanged behavior)
