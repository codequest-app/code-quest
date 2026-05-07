## Why

`spec-pane-v1` filled the Spec tab with read-only list + modal (Proposal / Design / Tasks). Comparing against `docs/prototype/F.html`'s prototype surfaces the remaining gaps:

| F.html | Current |
|---|---|
| Change row: `📋` icon + name + status badge + pill task badge | name + grey text `done/total` |
| Spec row: `▸` icon + name | plain name |
| Active-changes section: `+ new` action button in header | no header action |
| Specs section: `sync` action button in header | no header action |
| Tasks tab: interactive checklist (click to toggle) | markdown render (read-only) |

The action buttons are mock-only in F.html (`this.toast('New change', 'openspec change new')`), so we'd diverge positively by actually wiring them to the `openspec` CLI — which is already a project dependency.

Status badge in F.html is mock strings (`draft` / `review`) — OpenSpec itself has no such field. We derive a meaningful badge instead: **`Ready`** when tasks are 100% done (a hint that the change is ready to archive). Nothing when tasks are in progress or absent.

## What Changes

- **Visual (rows)**
  - Change rows: prefix `📋` icon, render task progress as a pill-style `badge task` (matching F.html `.spec-row .badge.task` visuals).
  - Change rows with `tasks.done === tasks.total && tasks.total > 0`: render a `Ready` badge (success tone).
  - Spec rows: prefix `▸` chevron icon.

- **`+ new` action** (Active changes header)
  - New RPC `openspec:changeNew { cwd, name }` → server exec `openspec change new <name>` → returns `{ ok } | { error }`.
  - UI: small `NewChangeDialog` (re-use Radix Dialog primitive) with name input + validation (lowercase-hyphen-only, matching openspec's slug rules). Submit → RPC → toast + `openspec:dirty` broadcast refreshes list.

- **`sync` action** (Specs header)
  - New RPC `openspec:sync { cwd }` → server exec `openspec sync` → `{ ok } | { error }`.
  - UI: button triggers RPC directly (no dialog); toast on success/failure.

- **Interactive tasks checklist** (SpecModal Tasks tab)
  - New RPC `openspec:toggleTask { cwd, name, lineIndex }` — reads `tasks.md`, flips `- [ ]` ↔ `- [x]` at the given line (absolute line number, 0-indexed), writes back, returns `{ ok } | { error }`.
  - UI: parse `tasks.md` into `[ { lineIndex, checked, text, indent } ]`; render as `<label><input type=checkbox onChange={toggle} />...<text></label>`; click → optimistic flip → RPC → on error, revert + toast. `openspec:dirty` refresh loads new content.

- **Path safety**: all three new RPCs validate the resolved target path stays under `<cwd>/openspec/` (same guard pattern as existing `openspec:read`).

Explicitly out of scope:
- Archive / delete / rename a change from UI (CLI suffices; future change).
- Proposal / Design editor (read-only; user edits via IDE).
- Creating new spec capabilities from UI (same reasoning).
- Validating change on save (future CLI integration).

## Capabilities

- **spec-pane**: extend the Spec tab with F.html visual parity (icons + pill badge + Ready indicator) and three CLI actions (create change, sync specs, toggle task).
