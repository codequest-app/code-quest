## ADDED Requirements

### Requirement: Directory tree dialog for selecting project
The system SHALL provide a modal dialog containing a DirectoryTree for browsing and selecting a project directory.

#### Scenario: Dialog opens from Add button
- **WHEN** user clicks "Add" button in sidebar or empty state
- **THEN** a modal dialog appears with title "Select Project Directory"
- **AND** DirectoryTree shows the configured explorer roots

#### Scenario: Browse and expand directories
- **WHEN** user clicks a directory in the dialog tree
- **THEN** directory expands to show children
- **AND** directories can be expanded to arbitrary depth

### Requirement: Select and confirm directory
The system SHALL allow the user to select a directory and confirm with an "Open" button.

#### Scenario: Select directory and open
- **WHEN** user clicks a directory to select it
- **AND** clicks "Open" button
- **THEN** dialog closes
- **AND** selected directory is added as a project

#### Scenario: Cancel dialog
- **WHEN** user clicks "Cancel" button
- **THEN** dialog closes
- **AND** no project is added

### Requirement: Prevent duplicate projects
The system SHALL NOT add a project if one with the same cwd already exists. Instead, it SHALL switch to the existing project.

#### Scenario: Add existing project cwd
- **WHEN** user selects a directory that already exists as a project
- **THEN** dialog closes
- **AND** active project switches to the existing project
- **AND** no duplicate project is created
