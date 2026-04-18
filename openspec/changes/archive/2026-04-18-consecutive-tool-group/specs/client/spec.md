## ADDED Requirements

### Requirement: Group consecutive tool uses in the timeline

`CollapsibleTimeline` SHALL collapse any run of ≥ 2 consecutive `tool_use`
messages into a single `ExploredGroup` block with label "Explored" plus
a count badge. A single solitary `tool_use` SHALL render as a normal
timeline row. Any non-`tool_use` node (assistant `text`, `thinking`,
`streamlined_text`, `streamlined_tool_use_summary`, etc.) SHALL flush the
current group.

#### Scenario: Two or more consecutive tool uses collapse
- **WHEN** `CollapsibleTimeline` receives `[Bash, Bash, Read]` in order
- **THEN** the rendered DOM SHALL show an "Explored 3" header with a
  collapsible section, and the individual tool blocks SHALL be hidden
  until the header is clicked

#### Scenario: Single tool use renders solo
- **WHEN** the timeline contains exactly one `tool_use` node
- **THEN** no "Explored" header SHALL be rendered; the single block
  displays directly

#### Scenario: Assistant text splits a group
- **WHEN** the sequence is `[Bash, Bash, text, Bash, Bash]`
- **THEN** the renderer SHALL produce two grouped "Explored 2" blocks
  separated by the text node

#### Scenario: Group is collapsed by default
- **WHEN** a grouped run first renders
- **THEN** the body SHALL be hidden and only the header (dot, label,
  count, chevron) SHALL be visible
