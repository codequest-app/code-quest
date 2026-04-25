## Tasks

### 1. TDD in `RightPane`
- [ ] Write test: switching Files → Spec → Files preserves a tree-expansion spy (e.g. mock FakeSummoner browseEntries and assert no additional call on the third switch).
- [ ] Write test: first render with `active='files'` only mounts `<FilesPane>` (Git / Spec are absent from the tree).
- [ ] Write test: after visiting Spec, it stays mounted with `hidden=true` when Files is active.

### 2. Implementation
- [ ] Add a `useRef<Set<'files'|'git'|'spec'>>` inside `RightPane` tracking first-visit activation.
- [ ] Replace conditional render with three wrappers: `<div hidden={active !== id}>{mounted.has(id) && <Pane/>}</div>`.
- [ ] When `active` changes, add the new id to the mounted set before render (via `useMemo` / inline computation).

### 3. Cleanup
- [ ] Verify no regressions in the existing FilesPane / GitPane / SpecPane test suites.
- [ ] Typecheck + full client tests green.
- [ ] `openspec validate right-pane-tab-keep-alive --strict`.
