## Context

`ComposeInput` uses `useInputHistory` — a standalone hook with `push/cycleUp/cycleDown/reset`. It is the only consumer of this hook. History is in-memory only (`useRef`), so it resets on every page reload.

Channel messages are already replayed from the server on join (`session:join` callback calls `applyJoinSnapshot` → `buildMessagesFromHistory`). User messages (`role: 'user'`) are present in `useChannelMessages().messages` after join completes.

## Goals / Non-Goals

**Goals**
- History persists across reloads by deriving from already-loaded channel messages
- ArrowUp in multiline textarea only triggers history when cursor is on the first line
- Inline hook logic; use module-level functions (only one consumer, per project convention)

**Non-Goals**
- Cross-device sync (messages already cover this via server replay)
- Storing history separately (redundant with existing message replay)

## Decisions

**Inline instead of hook**
`useInputHistory` has exactly one consumer. Per project convention, hooks with one consumer should be module-level functions. The logic (`cycleUp`, `cycleDown`, `push`, `reset`) are pure functions on a `{ history, index }` ref — extract as module-level functions, call them from `ComposeInput`.

**Initialize from messages, not a separate store**
Channel messages are already replayed on join. Filter `role === 'user'` + `content.trim()` non-empty → initial history array. Guard with `initializedRef` so it runs once when messages first become non-empty (async join).

**Multiline ArrowUp guard**
Check `textarea.selectionStart <= value.indexOf('\n')`. When no newline exists, `indexOf` returns `-1` and `selectionStart >= 0 > -1` so it always triggers (single-line case). When multiline, only triggers if cursor is at or before the first newline (first line).

**ArrowDown guard (symmetric)**
Only trigger history cycle-down when `historyIndex !== -1` (currently navigating history). No cursor position check needed for down.

## Risks / Trade-offs

[Async init] Messages load after first render. `initializedRef` prevents re-initialization but means messages sent in this render-cycle before join completes won't be in initial history → fine, they'll be pushed on submit.

[Clear/rewind] If messages are cleared or rewound, `historyRef` still holds the old entries. Acceptable — this matches terminal behavior (history doesn't shrink when you clear the screen).

## Open Questions

None.
