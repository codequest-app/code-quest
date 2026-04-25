## Why

`openspec-cli-correctness` removed the fake `sync` button after we discovered `openspec sync` doesn't exist. The legitimate equivalent in the CLI is `openspec archive <change>` — it archives a completed change AND propagates its delta specs into the main `openspec/specs/` tree (the spec-sync workflow happens **as part of** archiving).

Today users finishing a change have to drop into the terminal:
```bash
openspec archive my-change --skip-specs -y
# or
openspec archive my-change -y      # propagates delta specs
```
…which loses the discoverability win that `+ new` gave us. Pairing `+ new` (start a change) with an in-pane archive action (finish a change) closes the lifecycle loop without needing the CLI.

The action is **destructive** — once archived, the change directory moves to `openspec/changes/archive/<date>-<name>/` and (without `--skip-specs`) the main specs are rewritten. So the UI MUST gate it behind a confirm dialog and only surface it when the change is plausibly ready (`status === 'complete'`).

## What Changes

- **New RPC `openspec:archive`** with payload `{ cwd, name, skipSpecs?: boolean }` returning `{ ok: true } | { error }`. Spawns `openspec archive <name> -y` (always non-interactive); `--skip-specs` is added when `skipSpecs === true`. Slug-validated and cwd-rooted like the existing `changeNew`/`toggleTask`.
- **`LocalOpenspecService.archive(cwd, name, opts)`** + matching `FakeOpenspecService.archive` with `setArchiveError` / `archiveCalls`.
- **Server handler** for `openspec:archive`. On success, the file watcher already fires `openspec:dirty` (the `archive/` move is a filesystem change under `openspec/`), so the pane refreshes naturally.
- **Client `OpenspecContext`**: add `archive(cwd, name, opts)` action.
- **SpecPane row**: when `c.status === 'complete'`, render a small `Archive` button next to the `Ready` badge. Click → `ArchiveChangeDialog` (Radix Dialog) with:
  - The change name + a warning "This moves the change to `openspec/changes/archive/` and updates the main specs."
  - A checkbox `Skip spec update (--skip-specs)` defaulting **off** (the common case is to propagate).
  - Cancel / Archive buttons. Archive is `variant="danger"`.
  - Submit → RPC → toast + dialog close + list refresh.

Explicitly out of scope:
- Showing the `Archive` button for non-`complete` changes — the CLI would reject (or warn) and we don't want to encourage premature archiving.
- Validate-only / dry-run preview before archive — `openspec validate` is a separate CLI surface; UX for that belongs to its own change.
- Restoring an archived change back to active — bidirectional flow, separate scope.

## Capabilities

- **spec-pane**: pair the existing `+ new` action with an in-pane `Archive` action so the change lifecycle (create → work → archive) is fully discoverable from the UI.
