## Context

Today `packages/summoner/src/claude/transforms/user.ts` emits a single
`message:user` shape for every `role=user` CLI event. The client's
`MessageContent.tsx` has one `case 'text'` that blindly runs `MarkdownContent`.
Four distinct producers share that path:

1. **Typed input** — the human typed in the composer. Plain text, might
   contain characters that look like markdown (`**`, `1.`, `#`) but aren't.
2. **Skill body** — when an assistant calls `Skill`, the CLI injects the
   resolved `SKILL.md` as a `role=user` text block prefixed
   `Base directory for this skill: <path>\n\n# <Heading>\n\n...` (confirmed
   from `raw_entries` dump).
3. **Slash-command echo** — CLI mirrors `/command` invocations as a `role=user`
   message whose content is the string
   `<command-message>...</command-message>\n<command-name>/...</command-name>`.
   `transforms/user.ts:16` already drops these when `rawContent` is a string.
4. **System reminder** — CLI drops `<system-reminder>…</system-reminder>`
   blocks (seen in our live stream) as `role=user` text.

The real VS Code extension, per `anthropic.claude-code-2.1.45-darwin-arm64`
(inspected via agent), does not expose a dedicated classifier; it renders all
`type:text` assistant and user blocks through the same markdown pipeline
(react-markdown + remark-gfm + DOMPurify). That works for the extension
because its audience is engineers used to seeing their typed text re-rendered
as markdown. We want a sharper behaviour because our users are mixed; skill
body content bleeding into the typed-text code path is the proximate
complaint.

Skill tool results are a separate problem: `ToolUseBlock.tsx` has cases for
`Bash`, `Read`, `Write`/`Edit`/`MultiEdit` and a `DefaultToolBody` fallback
that uses `<pre whitespace-pre>`. `Skill` falls through, so its markdown
output shows raw syntax.

## Goals / Non-Goals

**Goals:**
- Classify user messages at the transform layer so the UI gets a deterministic
  `source` signal (`typed | skill | command | reminder`).
- Route each `source` to the correct renderer in `MessageContent.tsx`.
- Render `Skill` tool output through `MarkdownContent`.
- Keep current behaviour for already-stored events (no `source` → treat as
  `typed`).
- Full TDD: fixture-driven transform tests, handler/component tests, then
  implementation.

**Non-Goals:**
- No new top-level `MessageRole` or `MessageType`. `source` is metadata, not a
  type.
- Do **not** add `remark-breaks` in this change. Typed multi-line input will
  be handled with `whitespace-pre-wrap` (already on the user wrapper at
  `ChatMessage.tsx:53`). Re-evaluate if users complain about single-newline
  wrapping.
- Do not restyle the chat globally. The loose-list fix (`.prose :where(li) > p`
  margin 0) already landed and stays.
- Do not extend to MCP tool outputs beyond `Skill`. `AskUserQuestion` and
  friends remain on `DefaultToolBody` until we have real content samples.
- Do not touch assistant text rendering. It stays on `MarkdownContent`.

## Decisions

### D1. Tag at transform, not at UI

**Choice**: Detect source in `packages/summoner/src/claude/transforms/user.ts`
and emit `source` on `message:user` payload.

**Why**: The detection uses signals available only in raw CLI content
(prefixes, XML-ish tags embedded in text blocks). Doing it in the UI means
every consumer of `message:user` must re-implement the same heuristics, and
the summoner already owns the "translate CLI semantics to client semantics"
responsibility (`transforms/system.ts` has the same `// Skip: extension also
ignores these` pattern for `handlePostTurnSummary`, etc.).

**Alternatives considered**:
- Client-side detection in `handlers/message.ts` — rejected; duplicates logic
  across any future non-web consumer.
- Introduce a new CLI event type — rejected; no upstream change we can make.

### D2. `source` values and precedence

**Choice**: Enum `'typed' | 'skill' | 'command' | 'reminder'`. Detection order
when iterating the content blocks:

1. If `rawContent` is a string containing `<command-message>` or
   `<command-name>` → `command`. (Current string short-circuit at
   `transforms/user.ts:16` already returns `null`; we keep that behaviour.
   The `source='command'` tag is there for future us if we want to surface
   a "command invoked" chip — but this change still returns `null` for
   backward compatibility.)
2. Else on the `text` block level: if `text.startsWith('Base directory for
   this skill:')` → `skill`.
3. Else if `text` begins with `<system-reminder>` (trimmed) → `reminder`.
4. Else → `typed`.

Only one `source` per message; if the first text block matches `skill`, the
whole message is `skill`.

**Why**: Order matches the way CLI produces these; skill and reminder are
never mixed in the same message in practice.

**Alternatives considered**:
- Per-block tagging — overkill; user text messages observed in
  `raw_entries` always have a single text block of one kind.
- Regex for the skill prefix — rejected; plain `startsWith` is faster and
  unambiguous.

### D3. UI routing

**Choice**: `MessageContent.tsx` gains a helper
`pickUserTextRenderer(source)` and `case 'text'` dispatches:

| source | Renderer |
| --- | --- |
| `typed` (default) | plain `{content}` in the existing `whitespace-pre-wrap` wrapper |
| `skill` | `MarkdownContent` |
| `command` | `null` (already dropped at transform; belt-and-braces) |
| `reminder` | `null` for now (decided Non-Goal to render system notes) |

Assistant text stays on `MarkdownContent` unconditionally.

### D4. `Skill` tool output

**Choice**: Add `case 'Skill'` in `ToolUseBlock.tsx`'s `renderBody()` switch,
producing a `SkillToolBody` component that renders
`meta.result.content` via `MarkdownContent` and shows the invoked skill id
(`meta.input.skill`) in a small header row.

**Why**: Matches the pattern used by `BashToolBody`, `ReadToolBody`, etc.
Keeps the markdown decision tool-local, so other tools fall through unchanged.

### D5. Schema + type propagation

`packages/shared/src/schemas/message.ts` (the user-payload schema): add
`source: z.enum(['typed', 'skill', 'command', 'reminder']).optional()`.

`packages/client/src/types/ui.ts`: `OptionalMetaMap['text']` extended with
`source?: 'typed' | 'skill' | 'command' | 'reminder'`.

Absence of the field is treated as `typed` everywhere for forward/backward
compatibility with stored events.

## Risks / Trade-offs

- [Risk] Skill prefix drifts upstream. → Mitigation: keep detection in one
  place (transform) with a single constant; we add a dedicated fixture
  (`__fixtures__/claude/real/skill-body-user.jsonl`) captured from today's
  CLI so a future drift makes the test fail loudly.
- [Risk] `<system-reminder>` blocks appear interleaved mid-conversation and
  their disappearance confuses users. → Mitigation: document the skip in
  `docs/flows/` and leave a debug-group entry in `MessageVisibilityContext`
  (future work, not in this change).
- [Risk] Typed content that *intentionally* contains markdown (power users
  pasting tables) loses formatting. → Accepted; those users can continue to
  paste into the composer preview or we revisit with `remark-breaks` later.
- [Risk] `Skill` tool sometimes returns plain log output rather than
  markdown. → Mitigation: the new `SkillToolBody` can fall back to
  `OutputContent` when the content is empty or obviously not markdown; but
  first iteration just always uses `MarkdownContent`; if users complain we
  add a heuristic.
- [Trade-off] Splitting dispatch in two files (transform + UI) means both
  must ship together; acceptable because they live in the same monorepo
  PR/commit.

## Migration Plan

1. Land schema/transform changes behind fixture tests (no client effect yet
   because client ignores unknown metadata).
2. Land client routing. Stored messages without `source` default to `typed`,
   matching today's rendering for plain typed input (regression-free for
   typed content). Skill bodies from old sessions will now render as
   `typed` (plain) — users replaying historical sessions see the same raw
   text they see today with the current bug, no worse.
3. Release together; no phased flag needed.

## Open Questions

- Should `reminder` messages appear as a dim, collapsed system note instead
  of being hidden outright? Leaning "no" for this change; revisit after
  usage feedback.
- Do we want a future `source: 'mcp_tool_result_text'` for MCP server echoes?
  Not in this change.
