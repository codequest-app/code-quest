## ADDED Requirements

### Requirement: buildArgs emits --thinking-display when configured

`buildArgs()` SHALL append `--thinking-display <value>` to the CLI arg list
when `LaunchOptions.thinkingDisplay` is set AND thinking is enabled with a
string mode (`'adaptive'` / `'enabled'`). It MUST NOT emit the flag when
thinking is `'disabled'`, a numeric budget (legacy `--max-thinking-tokens`
path), or unset.

#### Scenario: thinkingDisplay set with adaptive mode

- **WHEN** `buildArgs({ thinking: 'adaptive', thinkingDisplay: 'summarized' })`
- **THEN** output contains `--thinking adaptive` followed later by
  `--thinking-display summarized`

#### Scenario: thinkingDisplay set with disabled mode

- **WHEN** `buildArgs({ thinking: 'disabled', thinkingDisplay: 'summarized' })`
- **THEN** output does NOT contain `--thinking-display`

#### Scenario: thinkingDisplay set with numeric budget

- **WHEN** `buildArgs({ thinking: 31999, thinkingDisplay: 'summarized' })`
- **THEN** output contains `--max-thinking-tokens 31999` and does NOT contain
  `--thinking-display`

#### Scenario: thinkingDisplay unset

- **WHEN** `buildArgs({ thinking: 'adaptive' })` (no thinkingDisplay)
- **THEN** output contains `--thinking adaptive` and does NOT contain
  `--thinking-display`
