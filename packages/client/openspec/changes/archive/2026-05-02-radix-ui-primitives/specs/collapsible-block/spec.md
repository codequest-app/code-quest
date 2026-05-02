## ADDED Requirements

### Requirement: CollapsibleBlock uses Radix Collapsible primitive
`CollapsibleBlock` SHALL use `@radix-ui/react-collapsible` (`Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Content`) instead of manual `useState` + conditional render.

#### Scenario: Default closed state
- **WHEN** `CollapsibleBlock` renders with `defaultOpen={false}`
- **THEN** the content region SHALL be hidden

#### Scenario: Default open state
- **WHEN** `CollapsibleBlock` renders with `defaultOpen={true}`
- **THEN** the content region SHALL be visible without user interaction

#### Scenario: Toggle open
- **WHEN** the user clicks the trigger button
- **THEN** the content region SHALL toggle between visible and hidden

