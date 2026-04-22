## ADDED Requirements

### Requirement: settings carry thinkingDisplay alongside thinkingLevel

`settings:set_thinking_level` payload SHALL accept an optional
`thinkingDisplay: 'summarized' | 'omitted'` field. Resolution order for the
value forwarded into `LaunchOptions.thinkingDisplay` SHALL be:

1. per-session value persisted via `SettingsStore` (if any)
2. `config.thinkingDisplay` (parsed from `CLI_THINKING_DISPLAY` env)
3. hard-coded default `'summarized'`

#### Scenario: client sets thinkingDisplay=omitted

- **WHEN** client sends `settings:set_thinking_level` with
  `{ thinkingLevel: 'default_on', thinkingDisplay: 'omitted' }`
- **THEN** server persists `thinkingDisplay='omitted'` and the next session
  launch passes `--thinking-display omitted` to the CLI

#### Scenario: client omits thinkingDisplay, env unset

- **WHEN** client sends `settings:set_thinking_level` with
  `{ thinkingLevel: 'default_on' }` and `CLI_THINKING_DISPLAY` is unset
- **THEN** server uses the hard-coded default `'summarized'` and the next
  session launch passes `--thinking-display summarized`

#### Scenario: client omits thinkingDisplay, env=omitted

- **WHEN** client sends `{ thinkingLevel: 'default_on' }` and
  `CLI_THINKING_DISPLAY=omitted` is set in the environment
- **THEN** server uses the env value and the next session launch passes
  `--thinking-display omitted`

#### Scenario: client setting overrides env

- **WHEN** `CLI_THINKING_DISPLAY=omitted` AND client sends
  `{ thinkingLevel: 'default_on', thinkingDisplay: 'summarized' }`
- **THEN** per-session setting wins — launch passes
  `--thinking-display summarized`

#### Scenario: thinkingLevel=off

- **WHEN** `thinkingLevel='off'`, regardless of `thinkingDisplay` or env
- **THEN** session launch passes `--thinking disabled` and does NOT pass
  `--thinking-display` (the flag is irrelevant when thinking is off)
