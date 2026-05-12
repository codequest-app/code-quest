## ADDED Requirements

### Requirement: Subagent user message carries parentToolUseId

When a `message:user` event arrives with `parentToolUseId`, the resulting UI message SHALL include `parentToolUseId` so it is routed to the correct subagent child timeline.

#### Scenario: User message with parentToolUseId goes into childrenIndex

- **WHEN** a `message:user` event has `parentToolUseId: "toolu_abc"`
- **THEN** the resulting message in state SHALL have `parentToolUseId: "toolu_abc"`
- **AND** `buildChildrenIndex` SHALL include it under key `"toolu_abc"`
- **AND** `renderableGroups` SHALL NOT yield it as a top-level item

#### Scenario: User message without parentToolUseId is unaffected

- **WHEN** a `message:user` event has no `parentToolUseId`
- **THEN** the resulting message SHALL have no `parentToolUseId`
- **AND** it SHALL appear as a top-level item in `renderableGroups`
