## ADDED Requirements

### Requirement: Right-pane tabs preserve component-local state across switches

The right pane SHALL keep each tab's React subtree mounted once that tab has been activated at least once, hiding inactive tabs via the HTML `hidden` attribute. Switching tabs MUST NOT cause the previously-active tab to unmount, so that tree-expansion state, scroll position, and any local UI state is preserved when the user returns to it.

#### Scenario: Switch away then back to Files
- **WHEN** the user expands a folder in the Files tab, switches to Spec, then switches back to Files
- **THEN** the previously-expanded folder remains expanded with no re-fetch
- **AND** the scroll position is unchanged

#### Scenario: First-mount is lazy
- **WHEN** the right pane first renders with `active = 'files'`
- **THEN** only `<FilesPane>` mounts (Git and Spec do not mount until the user switches to them)

#### Scenario: Inactive tab is hidden but mounted
- **WHEN** the user has visited Files and Spec, and Files is currently active
- **THEN** the Spec subtree is present in the DOM with `hidden` attribute set
- **AND** Files subtree is visible

#### Scenario: Tabs never re-fetch on re-activation
- **WHEN** an already-mounted tab becomes active again
- **THEN** no new RPC fires solely because of the activation (data refresh continues to flow from `*-dirty` broadcasts as before)
