## MODIFIED Requirements

### Requirement: Workspace right pane shell
The workspace SHALL render a `RightPane` component as the third column on desktop, holding a Files/Git/Spec tab strip. The Git tab body SHALL render `<GitPane cwd={useActiveCwd()} />`. The Files tab body remains driven by `files-pane-v1`'s `<FilesPane>`; the Spec tab body remains a placeholder.

#### Scenario: Git tab renders GitPane
- **WHEN** RightPane is mounted AND the Git tab is active
- **THEN** the body renders `<GitPane>` receiving the current `useActiveCwd()` value as its `cwd` prop.

#### Scenario: Other tabs unchanged
- **WHEN** the Files or Spec tab is active
- **THEN** the body continues to render whatever the current-shipping change for that tab provides (FilesPane for Files; placeholder for Spec).
