## ADDED Requirements

### Requirement: Visibility filter applied after tree build

`MessageList` SHALL build the full `MessageNode` tree from the complete
flat message list and only THEN apply the visibility filter. The
visibility predicate SHALL filter the tree recursively, dropping any
subtree whose root fails the predicate. Subsequent search filtering
SHALL operate on the already-filtered tree.

#### Scenario: Hidden tool use drops its merged tool result

- **GIVEN** a stream of `[tool_use:TodoWrite, tool_result(TodoWrite)]`
- **AND** the visibility for `tool_use:TodoWrite` is off (default)
- **WHEN** `MessageList` renders
- **THEN** no DOM element SHALL contain the tool_result text, and no
  orphan "Result" block SHALL appear

#### Scenario: Visible tool use keeps merged result
- **GIVEN** the same stream but `tool_use:TodoWrite` visibility is on
- **WHEN** `MessageList` renders
- **THEN** the TodoWrite block SHALL be visible and its merged
  `tool_result` content SHALL be reachable via the expand button

#### Scenario: Search filter runs on filtered tree
- **GIVEN** a non-empty `searchQuery`
- **WHEN** `MessageList` renders
- **THEN** it SHALL apply the search predicate to nodes that already
  passed the visibility filter
