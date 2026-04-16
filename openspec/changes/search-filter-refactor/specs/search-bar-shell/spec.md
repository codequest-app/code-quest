## ADDED Requirements

### Requirement: SearchBar accepts a pluggable filter panel
SearchBar SHALL accept a `filterPanel` prop (ReactNode) rendered inside its popover. This decouples the shell (input + button + badge) from the filter content.

#### Scenario: No filterPanel provided
- **WHEN** filterPanel prop is omitted
- **THEN** the filter button SHALL not be rendered

#### Scenario: filterPanel provided
- **WHEN** filterPanel prop is provided
- **THEN** a filter button SHALL appear at the right of the search input
- **THEN** clicking the button SHALL show the filterPanel content in a popover

### Requirement: SearchBar displays active filter count badge
SearchBar SHALL accept a `filterCount` prop (number). When > 0, display as badge on the filter button.

#### Scenario: filterCount zero
- **WHEN** filterCount is 0 or undefined
- **THEN** no badge SHALL be shown

#### Scenario: filterCount positive
- **WHEN** filterCount is N > 0
- **THEN** the filter button SHALL show N as a badge

### Requirement: SearchBar provides clear button when query is non-empty
When searchQuery is non-empty, a clear (✕) button SHALL appear and reset the query on click.

#### Scenario: Clear button visibility
- **WHEN** searchQuery is empty
- **THEN** clear button SHALL not be visible

#### Scenario: Clear button action
- **WHEN** user clicks the clear button
- **THEN** setSearchQuery SHALL be called with empty string
