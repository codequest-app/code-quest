## Tasks

### 1. Shared schemas (TDD in `packages/shared`)
- [ ] Add `openspecChangeNewPayload` + `openspecChangeNewResult` zod schemas.
- [ ] Add `openspecSyncPayload` + `openspecSyncResult` schemas.
- [ ] Add `openspecToggleTaskPayload` + `openspecToggleTaskResult` schemas.
- [ ] Register three new event names in `EVENTS.openspec` and `ClientToServerEvents`.

### 2. Summoner layer — openspec CLI wrappers (TDD in `apps/summoner`)
- [ ] `LocalOpenspecService.changeNew(cwd, name)` — spawns `openspec change new <name>`, maps non-zero exit → `{ error: stderr }`, success → `{ ok: true }`.
- [ ] `LocalOpenspecService.sync(cwd)` — spawns `openspec sync`.
- [ ] `LocalOpenspecService.toggleTask(cwd, changeName, lineIndex)` — reads `<cwd>/openspec/changes/<changeName>/tasks.md`, flips the checkbox on the given 0-indexed line, writes back. Validates line matches `/^(\s*)- \[( |x)\] /`.
- [ ] `FakeOpenspecService` counterparts with injectable error / spy arrays.

### 3. Server handlers (TDD in `apps/server`)
- [ ] `openspec.ts` handler: register `openspec:changeNew`, `openspec:sync`, `openspec:toggleTask`. Path validation: `cwd` ∈ explorerRoots, slug matches `/^[a-z0-9-]+$/`.
- [ ] On success for `changeNew` / `toggleTask`, emit `openspec:dirty { cwd }` so clients refresh.
- [ ] Tests via FakeSummoner: happy path, invalid slug, cwd-not-allowed, CLI error, line-index-not-a-task-line.

### 4. Client context (TDD in `apps/web/src/contexts`)
- [ ] `OpenspecContext.useOpenspecActions()` exposes `changeNew(cwd, name)`, `sync(cwd)`, `toggleTask(cwd, changeName, lineIndex)`. Each round-trips via `rpc(socket, ...)` + schema parse.

### 5. SpecPane visual parity (TDD in `apps/web/src/components`)
- [ ] Change row: prepend `📋` span; wrap `{done}/{total}` in pill element with `border-border`, monospace, small padding.
- [ ] Change row: when `tasks.done === tasks.total && tasks.total > 0`, render a `Ready` badge (success-tone classes).
- [ ] Spec row: prepend `▸` glyph.
- [ ] Update SpecPane tests: assert icons render, pill classes present, Ready badge appears at 100% / absent at partial.

### 6. `+ new` dialog (TDD)
- [ ] `NewChangeDialog` component: Radix Dialog with name input, client-side regex validation, Submit + Cancel.
- [ ] SpecPane Active-changes header: add `+ new` button (small text link, accent color) that opens the dialog.
- [ ] On submit: call `changeNew`, toast success/error, close dialog, rely on `openspec:dirty` refresh.
- [ ] Tests: valid name calls RPC with `{cwd, name}`; invalid name shows inline error; CLI error keeps dialog open with toast.

### 7. `sync` button (TDD)
- [ ] SpecPane Specs header: add `sync` button that calls `useOpenspecActions().sync(cwd)` + toasts result.
- [ ] Test: clicking triggers RPC with `{cwd}`; success toast on ok; error toast on error.

### 8. Interactive Tasks checklist (TDD)
- [ ] Parse `tasks.md` content into `TaskLine[] = { lineIndex, indent, checked, text }` (only `- [ ]` / `- [x]` lines; other lines rendered as plain markdown below / above — or for v1, keep MarkdownContent for non-task lines and overlay checkboxes only where matches).
- [ ] SpecModal Tasks tab: render interactive checklist when `kind === 'change'` and artifact === `tasks`. Each checkbox: optimistic toggle → `toggleTask` RPC → on error revert + toast.
- [ ] Test: clicking a `[ ]` line optimistically flips UI, fires RPC with correct lineIndex; server error reverts state + toasts.

### 9. Integration & cleanup
- [ ] Full typecheck + client + server test suites green.
- [ ] Manual smoke test: open SpecPane, click + new, submit a name, watch list refresh; click sync; open a change's Tasks tab, toggle a few items.
- [ ] `openspec validate spec-pane-f-html-alignment --strict`.
