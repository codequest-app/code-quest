## Why

Long sessions accumulate many consecutive read-only tool calls (Read, Grep,
Glob, TodoWrite, WebSearch, WebFetch…). Today every call renders as its own
collapsible block, so ten Reads in a row produce ten stacked blocks even
though the user rarely cares about each individual step. The real
Claude Code extension groups these under a collapsible "Explored" header
(`src/webview/core/main.js` L145521-145635); we should do the same.

## What Changes

- Introduce a render-time grouping pass in `MessageList` that collapses
  consecutive **read-only** `tool_use` (and the adjacent `tool_result` of
  the same ids) into a single `<CollapsibleBlock>` with label "Explored"
  and a count badge.
- Group only when the run has ≥ 2 tool calls; a single tool continues to
  render solo.
- Writes and interruption events break the group: `Edit`, `Write`,
  `MultiEdit`, `Bash`, `NotebookEdit`, assistant **text/thinking**,
  `pending_action`, `error`, `result`, etc. Any of these ends the current
  group.
- Group is **collapsed by default**; click to expand and reveal the
  individual tool blocks unchanged.

## Capabilities

### New Capabilities

- `consecutive-tool-group`: grouping pass rules, whitelist of "read-only"
  tools that qualify for grouping, default collapse state, and how the
  per-tool UI relates to the group wrapper.

### Modified Capabilities

- `client`: `MessageList` (or nearby render helper) gains the grouping
  pass; no message-schema change.

## Impact

- **Code**: `packages/client/src/components/MessageList.tsx` (or helper
  file used by it), possibly a new `groupConsecutiveTools.ts` utility.
- **Tests**: pure utility test for the grouping function + component test
  asserting a "Explored" header appears for ≥ 2 consecutive Read and
  expands to show both tools.
- **Dependencies**: none.
- **Behaviour**: no change to stored or transmitted data; purely a
  rendering reshape. Feature flag not needed.
