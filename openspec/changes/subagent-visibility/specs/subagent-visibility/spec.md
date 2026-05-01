## ADDED Requirements

### Requirement: Task tool meta tracks subagent lifecycle

When a Task tool_use is in progress, its meta SHALL be updated by system events to reflect the current lifecycle state.

#### Scenario: task_started updates tool_use meta
WHEN a `system:task_started` event arrives with a tool_use_id
THEN the corresponding tool_use message's meta SHALL be updated with:
- `taskType`: `'local_agent'` or `'subagent'` from the event's task_type field
- `taskStatus`: `'running'`

#### Scenario: task_progress updates tool_use meta
WHEN a `system:task_progress` event arrives with a tool_use_id
THEN the corresponding tool_use message's meta SHALL be updated with:
- `taskStatus`: `'running'`
- `lastToolName`: the event's last_tool_name field

#### Scenario: task_notification completes tool_use meta
WHEN a `system:task_notification` event arrives with a tool_use_id and status `'completed'`
THEN the corresponding tool_use message's meta SHALL be updated with:
- `taskStatus`: `'completed'`
- `taskSummary`: the event's summary field

#### Scenario: task_notification fails tool_use meta
WHEN a `system:task_notification` event arrives with a tool_use_id and status other than `'completed'`
THEN the corresponding tool_use message's meta SHALL be updated with:
- `taskStatus`: `'failed'`

#### Scenario: event arrives before tool_use exists
WHEN a task lifecycle event arrives but no tool_use with the matching tool_use_id exists in the message list
THEN the event SHALL be silently ignored

---

### Requirement: Task tool block header shows lifecycle status

The Task tool block header SHALL display the current lifecycle status when task meta is present.

#### Scenario: Running state
WHEN a Task tool_use has `meta.taskStatus = 'running'` and `meta.lastToolName` is set
THEN the header SHALL show a running indicator and the last tool name (e.g. `● Running · Bash`)

#### Scenario: Running state without last tool name
WHEN a Task tool_use has `meta.taskStatus = 'running'` and no `meta.lastToolName`
THEN the header SHALL show a running indicator without tool name (e.g. `● Running`)

#### Scenario: Completed state with summary
WHEN a Task tool_use has `meta.taskStatus = 'completed'` and `meta.taskSummary` is set
THEN the header SHALL show a success indicator and the summary (e.g. `✓ Done · <summary>`)

#### Scenario: Completed state without summary
WHEN a Task tool_use has `meta.taskStatus = 'completed'` and no `meta.taskSummary`
THEN the header SHALL show a success indicator without summary (e.g. `✓ Done`)

#### Scenario: Failed state
WHEN a Task tool_use has `meta.taskStatus = 'failed'`
THEN the header SHALL show a failure indicator (e.g. `✗ Failed`)

#### Scenario: No task meta
WHEN a Task tool_use has no taskStatus in meta
THEN the header SHALL display without a status badge (default collapsed state)

---

### Requirement: Task type is visually distinguished

The Task tool block SHALL visually distinguish between `local_agent` and `subagent` types.

#### Scenario: local_agent type
WHEN `meta.taskType = 'local_agent'`
THEN the tool block header SHALL use the local agent label or icon

#### Scenario: subagent type
WHEN `meta.taskType = 'subagent'`
THEN the tool block header SHALL use the subagent label or icon

---

### Requirement: Subagent children use CollapsibleTimeline grouping

The nested messages inside a Task tool_use SHALL be rendered using the same grouping logic as the main timeline.

#### Scenario: Subagent children are grouped
WHEN a Task tool_use has nested children messages containing tool_use messages
THEN those tool_use messages SHALL be grouped using CollapsibleTimeline
AND thinking messages SHALL be visible outside groups
AND the same chip summary rules SHALL apply as in the main timeline
