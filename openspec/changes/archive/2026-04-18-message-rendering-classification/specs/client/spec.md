## ADDED Requirements

### Requirement: `Message.meta` for text messages SHALL carry `source`

`apps/web/src/types/ui.ts` SHALL extend the optional meta for
`type: 'text'` messages with
`source?: 'typed' | 'skill' | 'command' | 'reminder'`. The field MUST remain
optional so that legacy state (snapshots, persisted channel state) still
type-checks.

#### Scenario: Text meta accepts source
- **WHEN** `buildMessagesFromHistory` or the user-message handler constructs
  a `type: 'text'` message with `meta.source`
- **THEN** TypeScript SHALL accept the construction and React components
  downstream SHALL read the field without casts

### Requirement: `renderBody` SHALL dispatch user text by `source`

`apps/web/src/components/MessageContent.tsx`'s `case 'text'` SHALL
select the renderer using a helper that maps `source` (default `typed`) to
the renderer listed in the `message-rendering` capability.

#### Scenario: Typed user text renders plain
- **WHEN** `renderBody` receives `role='user', type='text', meta.source='typed'`
- **THEN** the output SHALL be the raw `content` without running the
  markdown parser

#### Scenario: Skill body user text renders markdown
- **WHEN** `renderBody` receives `role='user', type='text', meta.source='skill'`
- **THEN** the output SHALL render via `MarkdownContent`

#### Scenario: Command/reminder user text drops out
- **WHEN** `renderBody` receives a user text message with
  `meta.source='command'` or `'reminder'`
- **THEN** `renderBody` SHALL return `null` so the message leaves no DOM
  footprint

### Requirement: `ToolUseBlock` SHALL render `Skill` output as markdown

`apps/web/src/components/message-blocks/ToolUseBlock.tsx` SHALL add a
`case 'Skill'` branch that renders the invoked skill id header and the
result content through `MarkdownContent`. The branch SHALL coexist with
existing cases (`Bash`, `Read`, `Write`/`Edit`/`MultiEdit`) and the
`DefaultToolBody` fallback.

#### Scenario: Skill tool expands to markdown
- **WHEN** a user clicks to expand a `tool_use` with `content='Skill'` and
  a markdown `result.content`
- **THEN** the DOM SHALL contain rendered markdown (`<strong>`, `<ul>`,
  etc.), not a `<pre>` showing raw syntax

#### Scenario: Unknown tools still use default body
- **WHEN** a `tool_use` has `content='SomeOtherTool'`
- **THEN** `DefaultToolBody` SHALL be used, unchanged by this requirement

### Requirement: Copy affordances SHALL match the real extension

`MarkdownContent` SHALL surface a copy button on every fenced code block,
including blocks without a language hint, matching the extension's webview
(`src/webview/core/main.js` L80450-80462). Inline `<code>` SHALL NOT gain
a copy button. Markdown links rendered by `MarkdownContent` SHALL show a
"Copy Link" entry on right-click (context menu). Left-click SHALL continue
to open the link.

#### Scenario: Fenced code block without language
- **GIVEN** markdown content `` ```\nhello\n``` ``
- **WHEN** the content renders
- **THEN** the DOM SHALL contain a copy button adjacent to the code block
  and clicking it SHALL invoke `navigator.clipboard.writeText('hello')`

#### Scenario: Inline code stays unadorned
- **GIVEN** markdown content with inline `` `hello` ``
- **WHEN** the content renders
- **THEN** the DOM SHALL NOT contain a copy button for that `<code>` element

#### Scenario: Right-click a markdown link
- **GIVEN** markdown content `[docs](https://example.com)`
- **WHEN** the user right-clicks the rendered `<a>`
- **THEN** a menu SHALL open with a "Copy Link" entry; clicking it SHALL
  invoke `navigator.clipboard.writeText('https://example.com')` and close
  the menu
