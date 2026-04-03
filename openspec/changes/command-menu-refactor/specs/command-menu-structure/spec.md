## ADDED Requirements

### Requirement: buildMenuItems is a pure utility function
buildMenuItems SHALL be extracted to a separate file as a pure function with no React dependencies. It receives params and returns MenuSections.

#### Scenario: buildMenuItems is importable without React
- **WHEN** buildMenuItems is imported in a test file
- **THEN** it SHALL work without any React context or rendering

#### Scenario: buildMenuItems output is stable
- **WHEN** buildMenuItems is called with the same params
- **THEN** it SHALL return the same menu structure

### Requirement: Section renderers are reusable components
Menu section and item renderers SHALL be extracted to a parts file. Each section renders a header + list of MenuItems.

#### Scenario: MenuSection renders items
- **WHEN** MenuSection receives a label and items array
- **THEN** it SHALL render the section header and each item

### Requirement: CommandMenu orchestrator is under 250 lines
After extraction, CommandMenu.tsx SHALL contain only orchestration logic: state management, keyboard navigation, filtering, and composition of parts.

#### Scenario: File size check
- **WHEN** the refactoring is complete
- **THEN** CommandMenu.tsx SHALL be under 250 lines
