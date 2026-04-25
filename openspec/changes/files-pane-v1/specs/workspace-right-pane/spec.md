## MODIFIED Requirements

### Requirement: Workspace right pane shell
The workspace SHALL render a `RightPane` component as the third column on desktop, holding a Files/Git/Spec tab strip. The Files tab body SHALL render `<FilesPane cwd={useActiveCwd()} />`. The Git and Spec tab bodies remain placeholders until their respective changes land.

#### Scenario: Files tab renders FilesPane
- **WHEN** RightPane is mounted AND the Files tab is active
- **THEN** the body renders `<FilesPane>` receiving the current `useActiveCwd()` value as its `cwd` prop.

#### Scenario: Other tabs unchanged
- **WHEN** the Git or Spec tab is active
- **THEN** the body continues to render the placeholder from the shell change.
