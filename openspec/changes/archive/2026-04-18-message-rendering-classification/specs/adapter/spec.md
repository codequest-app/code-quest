## ADDED Requirements

### Requirement: `transformUser` SHALL classify CLI-injected user messages

`apps/summoner/src/claude/transforms/user.ts` SHALL inspect every
`role=user` event and attach a `source` field to the `message:user` payload,
following the rules defined in the `message-rendering` capability. The
detection uses content shape only and MUST NOT require additional CLI state.

#### Scenario: Skill body detection at the text-block level
- **WHEN** a user event has a single `text` block whose `text` starts with
  `Base directory for this skill:`
- **THEN** the transform SHALL emit `message:user` with `source='skill'`

#### Scenario: System reminder detection
- **WHEN** a user event has a text block whose trimmed `text` starts with
  `<system-reminder>`
- **THEN** the transform SHALL emit `message:user` with `source='reminder'`

#### Scenario: Default to typed
- **WHEN** no injection pattern matches
- **THEN** the transform SHALL emit `message:user` with `source='typed'`

#### Scenario: String content (slash command echo) still dropped
- **WHEN** `message.content` is a string containing `<command-message>` or
  `<command-name>`
- **THEN** the transform SHALL continue to return `null`, matching today's
  behaviour
