# Spec Delta: protocol (tighten-cwd-l1)

## ADDED Requirements

### Requirement: Channel.cwd is non-null in memory

`Channel.cwd` SHALL be `string` (never `undefined`). The constructor SHALL require a `cwd: string` parameter. Every code path that creates a `Channel` — directly or via `channelManager.create` / `channelManager.join` — SHALL supply a non-empty cwd or reject the request.

#### Scenario: launch without cwd is rejected

- WHEN a client emits `session:launch` with no `cwd` in the payload
- THEN the server SHALL ack with `{ error: 'cwd required' }`
- AND no channel SHALL be created

#### Scenario: join lazy-resumes with cwd from sessionStore

- GIVEN a sessionStore row `{ id: 'S', channelId: 'C', cwd: '/proj' }`
- AND no live channel for `C`
- WHEN `channelManager.join('C')` is called
- THEN the spawned CLI SHALL run with `cwd='/proj'`
- AND the resulting channel SHALL have `cwd='/proj'`

#### Scenario: join fails when row has no cwd

- GIVEN a sessionStore row `{ id: 'S', channelId: 'C', cwd: null }`
- WHEN `channelManager.join('C')` is called
- THEN the call SHALL throw with a message indicating cwd is missing
