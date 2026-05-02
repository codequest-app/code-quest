## Why

User-typed chat input, CLI-injected skill bodies (Skill tool invocations dump a
full `SKILL.md` as a `role=user` text message starting with `Base directory for
this skill:`), slash-command echoes (`<command-message>/<command-name>` tags),
and `<system-reminder>` blocks all arrive in the UI with identical shape
(`role: user, type: text`), so every one of them currently runs through
`MarkdownContent`. The result:

- A user who types `**bold**`, `1. 史萊姆 2. DQ 3. 要保留`, or presses Enter
  several times sees their text silently reinterpreted as markdown — bold
  rendered, spurious list attempts, huge `<p>`-margin gaps from prose-sm.
- Conversely, the CLI-injected skill body really *is* markdown, so any attempt
  to fix (1) by blanket-rendering user text as plain text would expose literal
  `**Input**`, `- item`, `---` in the Skill block (we just saw this).
- The `Skill` tool's `tool_result.content` is also markdown but currently falls
  through `DefaultToolBody` into `<pre whitespace-pre>`, showing raw syntax.

We already pay for the distinction at the transform layer (`transforms/user.ts`
already drops `<local-command-stdout>` string content) but the UI side has no
signal to differentiate. The fix must tag messages at their source so the
renderer picks the right mode deterministically.

## What Changes

- Extend `transforms/user.ts` to classify every `role=user` message by content
  shape and attach a `source` tag to the emitted `message:user` payload:
  `typed` (human input), `skill` (skill-body injection), `command` (slash
  echo), `reminder` (`<system-reminder>` block).
- Add a matching `source` field to the shared socket payload schema and the
  client-side `Message.meta` for `type: 'text'` user messages.
- In `MessageContent.tsx`, route each user text message by `meta.source`:
  - `typed` → plain text with `whitespace-pre-wrap` (wrapper already supplies it)
  - `skill` → `MarkdownContent`
  - `command` → skip (matches existing `<local-command-stdout>` behaviour)
  - `reminder` → skip or render as dim system note (decided in design.md)
- In `ToolUseBlock.tsx`, add a `Skill` case that renders `result.content` via
  `MarkdownContent` instead of falling through to `<pre>`.
- Keep the existing loose-list prose fix (`.prose :where(li) > p` margin 0) so
  markdown paths still look right.
- No new runtime dependency unless design.md concludes we need
  `remark-breaks` for typed multi-line preservation (deferred decision).

## Capabilities

### New Capabilities

- `message-rendering`: classification rules for how each inbound message is
  rendered (markdown vs plain vs code vs skip), the `source` tag propagated
  from CLI-event transforms through the socket payload to the UI, and the
  tool→renderer table used by `ToolUseBlock`.

### Modified Capabilities

- `adapter`: `message:user` payload gains an optional `source` field produced
  by `transforms/user.ts`; no breaking change for existing consumers (default
  is `typed`).
- `protocol`: shared socket `userMessagePayloadSchema` gains optional `source`
  field mirroring the adapter output.
- `client`: `MessageContent.tsx` and `ToolUseBlock.tsx` consume `source` to
  choose the renderer; `Message.meta` typing for `text` messages is extended.

## Impact

- **Code**: `packages/summoner/src/claude/transforms/user.ts`,
  `packages/summoner/src/claude/schemas.ts` (if needed for raw shape),
  `packages/shared/src/schemas/message.ts` (user payload schema),
  `packages/client/src/types/ui.ts` (Message meta for text),
  `packages/client/src/components/MessageContent.tsx`,
  `packages/client/src/components/message-blocks/ToolUseBlock.tsx`,
  `packages/client/src/contexts/channel/handlers/message.ts` (or the user
  message handler that maps payload → UI state).
- **Tests**: new fixture-driven transform tests for each `source`; client
  handler/component tests asserting the correct renderer per `source`;
  existing ChatMessage tests adjusted to pass `meta.source` for user text.
- **Dependencies**: none required; optional `remark-breaks` only if design
  phase confirms multi-line typed input needs `<br>` preservation beyond
  pre-wrap.
- **Behaviour**: no breaking change to the socket protocol (field is
  optional); replaying older stored events without `source` defaults to
  `typed`, matching today's inferred handling for typed input.
