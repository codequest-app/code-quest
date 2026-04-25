# client-spec-pane Specification

## Purpose
TBD - created by archiving change spec-pane-row-component. Update Purpose after archive.
## Requirements
### Requirement: Active change rows MUST NOT nest interactive elements

In the SpecPane Active changes list, each row's open-modal action and Archive action SHALL be implemented as sibling `<button>` elements inside a non-interactive `<li>` container. No `<button>` element in the row may contain another interactive element (button, `role="button"`, or link).

#### Scenario: User clicks the row name
- **WHEN** the user clicks the row's name area (emoji + name button)
- **THEN** the change modal opens

#### Scenario: User clicks Archive
- **WHEN** the user clicks the Archive button on a `ready` change
- **THEN** the archive confirmation dialog opens AND the change modal does NOT open

#### Scenario: HTML validity
- **WHEN** the row is rendered
- **THEN** no `<button>` element contains another interactive element (button, `role="button"`, or link)

