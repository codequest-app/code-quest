## MODIFIED Requirements

### Requirement: ProjectContext manages only project state
ProjectContext SHALL manage project list and active project. It SHALL NOT call TabContext actions. Tab creation and switching SHALL be handled by the coordinating component.

#### Scenario: addProject does not create tab
- **WHEN** addProject(cwd) is called
- **THEN** project is added to the list
- **AND** active project is set to cwd
- **AND** no tab is created (caller responsibility)

#### Scenario: setActiveProject does not switch tab
- **WHEN** setActiveProject(cwd) is called
- **THEN** active project changes
- **AND** no tab switch happens (caller responsibility)

### Requirement: WorkspaceLayout coordinates project and tab actions
WorkspaceLayout SHALL coordinate between ProjectContext and TabContext for UI flows that involve both.

#### Scenario: Add project creates tab via WorkspaceLayout
- **WHEN** user selects a directory in AddProjectDialog
- **THEN** WorkspaceLayout calls addProject(cwd) on ProjectContext
- **AND** WorkspaceLayout calls createNewTab({ cwd }) on TabContext

#### Scenario: Switch project restores active tab via WorkspaceLayout
- **WHEN** user clicks a different project card
- **THEN** WorkspaceLayout saves current active tab for current project
- **AND** WorkspaceLayout calls setActiveProject(cwd) on ProjectContext
- **AND** WorkspaceLayout restores saved active tab via setActiveTab on TabContext
