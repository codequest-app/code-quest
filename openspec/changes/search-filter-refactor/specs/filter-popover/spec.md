## ADDED Requirements

### Requirement: FilterPopover displays a searchable flat list of types with counts
FilterPopover SHALL render a list of type entries, each with a checkbox, display name, and count. Entries SHALL be sorted by count descending.

#### Scenario: Entries sorted by count
- **WHEN** FilterPopover is rendered with types of varying counts
- **THEN** the type with the highest count SHALL appear first

#### Scenario: Count displayed per entry
- **WHEN** FilterPopover is rendered
- **THEN** each entry SHALL display its count next to its label

### Requirement: FilterPopover includes a search field that filters the type list
A text input inside the popover SHALL filter the displayed entries by substring match against the type name or display label.

#### Scenario: Search filters entries
- **WHEN** user types in the popover search field
- **THEN** only entries whose name or label contains the search string SHALL be shown

#### Scenario: Empty search shows all entries
- **WHEN** the search field is empty
- **THEN** all entries SHALL be shown

### Requirement: FilterPopover uses whitelist semantics
Checked entries SHALL be visible in the consumer list; unchecked entries SHALL be hidden. The `selected` prop is a `Set<string>` of currently visible types.

#### Scenario: Checking an entry
- **WHEN** user checks an unchecked entry
- **THEN** onChange SHALL be called with the entry's type added to the selected set

#### Scenario: Unchecking an entry
- **WHEN** user unchecks a checked entry
- **THEN** onChange SHALL be called with the entry's type removed from the selected set

### Requirement: FilterPopover accepts a TYPE_LABELS map for friendly display names
An optional `labels` prop (`Partial<Record<string, string>>`) maps internal type names to human-readable labels. Types without a mapping SHALL display their raw name.

#### Scenario: Type with label
- **WHEN** a type has an entry in the labels map
- **THEN** the friendly label SHALL be displayed instead of the raw type name

#### Scenario: Type without label
- **WHEN** a type has no entry in the labels map
- **THEN** the raw type name SHALL be displayed

### Requirement: FilterPopover provides Select All and Clear All actions
Two buttons at the bottom of the popover SHALL select or deselect all currently visible (post-search) entries.

#### Scenario: Select All
- **WHEN** user clicks Select All
- **THEN** onChange SHALL be called with all visible entries added to the selected set

#### Scenario: Clear All
- **WHEN** user clicks Clear All
- **THEN** onChange SHALL be called with all visible entries removed from the selected set
