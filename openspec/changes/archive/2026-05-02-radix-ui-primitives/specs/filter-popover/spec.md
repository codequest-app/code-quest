## MODIFIED Requirements

### Requirement: FilterPopover displays a searchable flat list of types with counts
FilterPopover SHALL render a list of type entries, each with a checkbox, display name, and count. Entries SHALL be sorted by count descending. Checkboxes SHALL use `@radix-ui/react-checkbox` (directly or via a wrapper) instead of hand-rolled `<input type="checkbox">` markup.

#### Scenario: Entries sorted by count
- **WHEN** FilterPopover is rendered with types of varying counts
- **THEN** the type with the highest count SHALL appear first

#### Scenario: Count displayed per entry
- **WHEN** FilterPopover is rendered
- **THEN** each entry SHALL display its count next to its label

#### Scenario: Checkbox uses Radix primitive
- **WHEN** an entry is rendered
- **THEN** the checkbox SHALL be rendered via `@radix-ui/react-checkbox` (directly or via a shared wrapper)
