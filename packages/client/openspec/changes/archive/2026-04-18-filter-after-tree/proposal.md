## Why

When a user hides `tool_use:TodoWrite` (or any other `tool_use:*` type in
the debug group), its `tool_result` still leaks through as an orphan "Result"
block because the current pipeline filters the flat message list *before*
building the tree:

```
messages → filter(isMessageVisible) → buildMessageTree → render
```

The filter stage has no knowledge of tool_use ↔ tool_result relationships,
so the tool_result passes through while its parent tool_use is removed.
`mergeToolResult` then can't find the parent node and the result becomes a
standalone node, which renders as "Result: Todos have been modified
successfully…" (real bug observed in session 6992bec6, seq 697 → seq 700).

The real Claude Code extension doesn't exhibit this because its grouping
predicate `_8770` evaluates tool_use + tool_result together
(`src/webview/core/main.js` L145618-L145629).

## What Changes

- Swap the pipeline to **tree-first, filter-second**:
  ```
  messages → buildMessageTree → filterTree → searchFilter → render
  ```
- Add `packages/client/src/utils/filter-tree.ts` exporting a pure
  `filterTree(nodes, predicate)` that keeps a node iff the predicate
  returns true for `node.message`, otherwise drops the whole subtree.
  Subagent `children` are filtered recursively with the same predicate.
- Update `MessageList.tsx` to call `filterTree` on the root tree rather
  than filtering the flat list up front.
- As a consequence, hiding a `tool_use` (e.g. `TodoWrite`) also hides the
  merged `tool_result` because it now lives inside the tool_use's
  `meta.result`.

## Capabilities

### New Capabilities
- `filter-after-tree`: the tree-first filtering rule, including how it
  interacts with search query filtering and subagent children.

### Modified Capabilities
- `client`: `MessageList` filtering pipeline order changes; no public
  API change beyond internal order.

## Impact

- **Code**: `packages/client/src/components/MessageList.tsx`,
  new `packages/client/src/utils/filter-tree.ts`.
- **Tests**: pure utility tests for `filterTree`; component test asserting
  a hidden-tool_use TodoWrite also removes its "Result" companion (regression
  for the observed bug).
- **Dependencies**: none.
- **Behaviour**: subagent child nodes are now filtered with the same
  visibility predicate as the top-level timeline. Users with debug types
  hidden will see fewer (not more) messages — the change only removes
  content that currently leaks through in violation of the user's
  visibility settings.
