## ADDED Requirements

### Requirement: Thinking messages are always visible

Thinking messages SHALL always be rendered outside any tool group, directly in the conversation timeline as individual rows.

#### Scenario: Thinking between tool uses
WHEN a thinking message appears between tool_use messages
THEN each sequence of tool_use messages before and after the thinking SHALL form separate groups
AND the thinking SHALL be visible without expanding any group

#### Scenario: Thinking at start of turn
WHEN a thinking message appears before any tool_use messages
THEN the thinking SHALL be visible directly in the timeline

---

### Requirement: All tool_use messages are grouped

Every tool_use message SHALL be placed inside a tool group, regardless of count (including single tool_use messages).

#### Scenario: Single tool use
WHEN a single tool_use message appears between two non-tool messages (thinking or text)
THEN it SHALL be rendered as a collapsed group of 1

#### Scenario: Multiple consecutive tool uses
WHEN two or more tool_use messages appear consecutively (no thinking or text between them)
THEN they SHALL be collapsed into a single group

#### Scenario: Tool uses separated by thinking
WHEN tool_use messages are separated by a thinking message
THEN each run SHALL form its own separate group
AND the thinking SHALL appear between the groups

---

### Requirement: Group summary chips show semantic labels

A collapsed tool group SHALL display summary chips that communicate what happened without requiring expansion.

#### Scenario: Generic tool chip
WHEN a group contains one or more tool_use messages with a generic tool name (Read, Bash, Write, Edit, Grep, Glob, or any unrecognised tool)
THEN the chip SHALL show `<ToolName> ×N` where N is the count of that tool in the group
AND tools of the same type SHALL be aggregated into a single chip

#### Scenario: Skill tool chip
WHEN a group contains a tool_use with name "Skill"
THEN the chip SHALL show `/<skill-name>` derived from the tool's input.skill field
AND each distinct skill SHALL appear as its own chip

#### Scenario: Task tool chip
WHEN a group contains a tool_use with name "Task" or "Agent"
THEN the chip SHALL show the task description if available from task_started meta
AND SHALL fall back to "Agent" if no description is available

---

### Requirement: Error state is indicated on chips

WHEN a tool_use in a group has a result with is_error = true, the chip corresponding to that tool SHALL be visually marked as error (e.g. red colour).

#### Scenario: Partial error
WHEN only some tools in a group have errors
THEN only the chips for erroring tool types SHALL be marked as error

#### Scenario: All errors
WHEN all tools in a group have errors
THEN all chips SHALL be marked as error

---

### Requirement: Group is expandable

A collapsed tool group SHALL be expandable to show individual tool blocks.

#### Scenario: Expand group
WHEN the user clicks the expand control on a collapsed group
THEN all tool_use messages in the group SHALL be rendered as individual CollapsibleBlock rows

#### Scenario: Collapse group
WHEN the user clicks the collapse control on an expanded group
THEN the group SHALL return to collapsed chip summary view

---

### Requirement: Grouping logic is reusable for subagent children

The grouping logic (splitTimelineRuns) and chip summary component (ToolGroupSummary) SHALL be reusable so that SubagentChildren can apply the same grouping to the nested message tree.

#### Scenario: SubagentChildren uses same grouping
WHEN SubagentChildren renders a nested message tree
THEN it SHALL use CollapsibleTimeline with the same splitTimelineRuns and ToolGroupSummary logic as the main timeline
