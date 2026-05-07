## ADDED Requirements

### Requirement: User-message payload source field

The shared `messageUserPayloadSchema` SHALL declare an optional `source`
field accepting the string enum `'typed' | 'skill' | 'command' | 'reminder'`.
The field is optional so that payloads emitted by older builds — or
replayed from `raw_entries` rows stored before this change — remain valid.

#### Scenario: Schema accepts payload with source
- **WHEN** a `message:user` payload with
  `source: 'skill'` is validated
- **THEN** zod SHALL parse the payload successfully and preserve the field

#### Scenario: Schema accepts payload without source
- **WHEN** a `message:user` payload omits `source`
- **THEN** zod SHALL parse the payload successfully (treating absence as
  the default)

#### Scenario: Invalid source rejected
- **WHEN** a payload has `source: 'tool_result'` (not in the enum)
- **THEN** zod SHALL fail validation
