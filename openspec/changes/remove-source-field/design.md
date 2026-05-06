## Context

`meta.source` (`typed` | `skill` | `command` | `reminder`) was added to classify user message origin for two purposes: ArrowUp history filtering and render style selection. The classification relies on `isSynthetic` from the CLI, which is not set consistently (loop wakeup prompts lack it), making `source` unreliable. `reminder` has never been assigned. `command` is under-populated.

## Goals / Non-Goals

**Goals:**
- Remove `source` entirely from schema, transforms, and UI
- Replace ArrowUp filter with `meta.fromInput: true`, set only by `sendMessage`
- All user text messages render identically (plain text, `whitespace-pre-wrap`)

**Non-Goals:**
- Changing how skill bodies are displayed (already collapsed by `TruncatedContent`)
- Filtering any messages from the conversation view

## Decisions

**`fromInput` set in `sendMessage`, not on CLI echo**
`sendMessage` is the only code path that represents a deliberate user action. Setting `fromInput: true` there (before the CLI echo arrives) gives a reliable, single source of truth. The CLI echo match in `applyUserContent` preserves `fromInput` on the existing message via spread — no extra logic needed.

**`fromInput` not stored in DB / not propagated through history**
History messages loaded via `buildMessagesFromHistory` were typed in previous sessions but do not go through `sendMessage` in the current session. They will not have `fromInput`, so they will NOT appear in ArrowUp history. This is a deliberate trade-off: ArrowUp only reflects the current session's input, not cross-session history.

**Remove all `source`-based render branching**
`skill` → markdown render was the only visually distinct case. With `TruncatedContent` already collapsing long messages, there is no UX reason to render skill bodies differently. Removing the branch simplifies `renderUserText` to a single path.

## Risks / Trade-offs

- [ArrowUp loses cross-session history] → Acceptable: the previous behavior was unreliable anyway (loop wakeups polluted history). Users can rely on server-side search if needed.
- [Skill body messages now render as plain text] → Mitigated by `TruncatedContent` collapsing them; content is still accessible on expand.

## Migration Plan

1. Add `fromInput?: boolean` to `TextMeta` in shared schema
2. Set `fromInput: true` in `sendMessage`; `applyUserContent` match path preserves it via object spread
3. Update `ComposeInput` ArrowUp filter: `m.meta?.fromInput === true`
4. Remove `source` from all schemas, transforms, and UI components
5. Delete `renderUserText` source branching and `preserveWhitespace` source check
