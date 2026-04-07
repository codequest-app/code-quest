## ADDED Requirements

### Requirement: SidebarContext SHALL provide global sidebar panel switching

SidebarContext SHALL expose `activePanel` (current panel id or null) and `setActivePanel` (setter function) to all descendant components within WorkspaceLayout.

- Provided at WorkspaceLayout level
- `activePanel` of `null` means sidebar is collapsed
- `setActivePanel(id)` opens the panel; `setActivePanel(null)` collapses sidebar
- Calling `setActivePanel` with the current activePanel SHALL toggle it to null (collapse)

#### Scenario: Component reads active panel
- **WHEN** a component calls `useSidebar()`
- **THEN** it receives the current `activePanel` value and `setActivePanel` function

#### Scenario: Deep component toggles sidebar
- **WHEN** a component deep in the tree (e.g., ChatInputArea) calls `setActivePanel('history')`
- **THEN** the sidebar opens and shows the History panel

#### Scenario: Toggle active panel collapses sidebar
- **WHEN** `activePanel` is `'history'` and a component calls `setActivePanel('history')`
- **THEN** `activePanel` becomes `null` and the sidebar collapses

#### Scenario: useSidebar outside provider throws
- **WHEN** `useSidebar()` is called outside of SidebarContext provider
- **THEN** it throws an error with a descriptive message
