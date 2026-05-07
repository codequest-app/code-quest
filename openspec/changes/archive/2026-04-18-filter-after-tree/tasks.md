## 1. filterTree utility (TDD)

- [x] 1.1 Write `apps/web/src/utils/__tests__/filter-tree.test.ts` with:
  - empty input → empty output
  - single visible root → kept
  - single hidden root → dropped
  - mixed roots → only visible kept
  - nested subagent: parent visible, child hidden → child stripped
  - nested subagent: parent hidden → whole subtree dropped
- [x] 1.2 Implement `apps/web/src/utils/filter-tree.ts` exporting `filterTree(nodes, predicate)` that recursively filters both roots and `node.children`. Run tests green.

## 2. MessageList integration (TDD)

- [x] 2.1 Write component test (in an appropriate test file under `src/components/__tests__/`) that renders `MessageList` with: `[tool_use:TodoWrite, tool_result-for-TodoWrite, text]` + visibility off for `tool_use:TodoWrite` → DOM should NOT contain "Todos have been modified" text and should NOT contain an orphan "Result" block
- [x] 2.2 Write positive test: same sequence with `tool_use:TodoWrite` visible → DOM contains the tool_use block (merged with its tool_result)
- [x] 2.3 Refactor `MessageList.tsx` to build the tree first, then apply `filterTree` with the same predicate that's currently used on the flat list; apply search filter on the already-filtered tree. Run tests green.

## 3. Regression and polish

- [x] 3.1 Run `pnpm -C apps/web test` — confirm no existing test regressed
- [x] 3.2 Run `biome check` on touched files
- [x] 3.3 Manually verify in dev: toggle TodoWrite visibility off in the visibility popover and confirm the "Result: Todos have been modified…" block disappears too

## 4. Ship

- [x] 4.1 Commit with spec reference
- [x] 4.2 Push branch (or main per convention)
