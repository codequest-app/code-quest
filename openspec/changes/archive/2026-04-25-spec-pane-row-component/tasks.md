## Tasks

### 1. Restructure the Active change row JSX
- [ ] In `apps/web/src/components/SpecPane.tsx`, change each Active change `<li>` into a non-interactive flex container.
- [ ] Replace the outer `<button>` with a sibling `<button>` wrapping emoji + name (`flex-1` so the click target spans the row middle); it opens the change modal.
- [ ] Render the Archive control as a sibling `<button>` (when `ready`) — drop `role="button"` and the `e.stopPropagation()` call.
- [ ] Convert the Ready badge and task pill into non-interactive `<span>`s.
- [ ] Move the row hover effect onto the `<li>`.

### 2. Remove silenced lint
- [ ] Delete the `biome-ignore` comments that previously silenced the invalid nested-interactive markup.

### 3. Verify existing tests
- [ ] `pnpm -F client test` for SpecPane — open-modal click, archive-dialog click, and "no double-fire" assertions remain green.

### 4. Add a regression test
- [ ] Extend the SpecPane test suite to assert the Archive control is rendered as a `<button>` element and NOT a `[role="button"]` span.

### 5. Verification
- [ ] `npx openspec validate spec-pane-row-component --strict`.
