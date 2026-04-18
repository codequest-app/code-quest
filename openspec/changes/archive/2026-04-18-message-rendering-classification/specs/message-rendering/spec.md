## ADDED Requirements

### Requirement: User messages SHALL be classified by source at the transform layer

The summoner's user-message transform SHALL inspect every `role=user` CLI
event and attach a `source` tag of `'typed' | 'skill' | 'command' | 'reminder'`
to the emitted `message:user` payload. Classification SHALL use the content
shape only — no out-of-band state. Messages without a recognised signal
SHALL be tagged `typed`.

#### Scenario: CLI echoes a slash command
- **WHEN** the raw user message `content` is a string containing
  `<command-message>` and `<command-name>` tags
- **THEN** the transform SHALL drop the event (return `null`) as today, and
  any future surfacing SHALL use `source='command'`

#### Scenario: CLI injects a skill body
- **WHEN** a text block starts with the exact prefix
  `Base directory for this skill:`
- **THEN** the emitted `message:user` payload SHALL carry `source='skill'`

#### Scenario: CLI injects a system reminder
- **WHEN** the first text block, after trimming whitespace, starts with
  `<system-reminder>`
- **THEN** the emitted payload SHALL carry `source='reminder'`

#### Scenario: Human-typed input
- **WHEN** no injection pattern matches
- **THEN** the emitted payload SHALL carry `source='typed'` (or omit the
  field; consumers MUST treat absence as `typed`)

### Requirement: Client SHALL route user text messages to the renderer matching `source`

The client `MessageContent.tsx` `case 'text'` SHALL use the message's
`meta.source` (defaulting to `typed`) to pick a renderer. The routing
table is normative:

| source | Renderer |
| --- | --- |
| `typed` | raw `{content}` inside the existing `whitespace-pre-wrap` wrapper (no markdown) |
| `skill` | `<MarkdownContent content={content} />` |
| `command` | render nothing |
| `reminder` | render nothing |

#### Scenario: Typed message with markdown-like characters
- **GIVEN** `meta.source='typed'` and `content='1. 史萊姆 2. DQ 3. 要保留'`
- **WHEN** the message renders
- **THEN** the DOM SHALL contain the literal text, no `<ol>`/`<li>`, no
  `<strong>`, and no `<p>` margin-based extra spacing

#### Scenario: Skill body preserves markdown
- **GIVEN** `meta.source='skill'` and `content` starts with
  `Base directory for this skill: /path\n\n# Heading\n\n**bold**`
- **WHEN** the message renders
- **THEN** the DOM SHALL contain an `<h1>` for the heading and a `<strong>`
  for `bold`

#### Scenario: Assistant text unaffected
- **GIVEN** `role='assistant', type='text'` and any content
- **WHEN** the message renders
- **THEN** it SHALL continue to use `MarkdownContent` regardless of
  `meta.source`

### Requirement: `Skill` tool output SHALL render as markdown

`ToolUseBlock.tsx` SHALL handle `Skill` explicitly, rendering
`meta.result.content` via `MarkdownContent` and displaying the invoked skill
id (from `meta.input.skill`) as a small header row. It SHALL NOT fall
through to `DefaultToolBody`'s `<pre whitespace-pre>` path.

#### Scenario: Skill tool output with markdown
- **GIVEN** a `tool_use` message with `content='Skill'`,
  `meta.input.skill='opsx:propose'`, and
  `meta.result.content='Hello **world**\n\n- item one\n- item two'`
- **WHEN** the block is expanded
- **THEN** the rendered DOM SHALL contain `<strong>world</strong>` and two
  `<li>` elements

#### Scenario: Skill tool with no result yet
- **GIVEN** a `tool_use` message for `Skill` with no `meta.result`
- **WHEN** the block is expanded
- **THEN** it SHALL display the invoked skill id and a "Running…"
  indicator, matching the default-tool behaviour

### Requirement: Backward compatibility for stored source

Payloads without a `source` field SHALL render as `typed`. No UI or
transform code SHALL throw when the field is absent.

#### Scenario: Legacy event replay
- **GIVEN** a stored `raw_entries` row whose transformed payload has no
  `source`
- **WHEN** replayed through the client
- **THEN** the renderer SHALL treat the message as `source='typed'` without
  logging an error
