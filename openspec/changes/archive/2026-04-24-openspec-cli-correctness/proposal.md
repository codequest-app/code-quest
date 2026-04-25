## Why

Shipped `spec-pane-f-html-alignment` invokes the OpenSpec CLI with **wrong command names**, and one command that doesn't exist at all:

| What we call | Reality |
|---|---|
| `openspec change new <name>` | Not a real subcommand. The correct form is `openspec new change <name>` — our `changeNew` RPC fails with a help dump on every attempt. |
| `openspec sync` | No such command in OpenSpec CLI. F.html's "sync" button was a mock (`this.toast('Sync', 'openspec sync')`); we wired a real RPC that can only fail. |
| `openspec list` / `openspec status` | Not used — `LocalOpenspecService.list` hand-rolls `readdir + parse tasks.md`, duplicating logic the CLI exposes via `--json`. |

`openspec list --json` returns richer, canonical data:
```json
{ "name": "…", "completedTasks": 3, "totalTasks": 8, "status": "in-progress", "lastModified": "…" }
```

`status` is `"in-progress" | "complete"` — first-class and replaces our derived "Ready" badge logic.

## What Changes

- **Fix `changeNew`**: `LocalOpenspecService.changeNew` spawns `openspec new change <name>` (not `openspec change new <name>`). Zod payload unchanged.
- **Remove fake `sync`**: delete `LocalOpenspecService.sync`, the `openspec:sync` socket event, the `useOpenspecActions().sync` action, and the `sync` button on the Specs section header. Update the openspec-service interface + FakeOpenspecService + server handler.
- **Adopt `openspec list --json` for `list`**: `LocalOpenspecService.list` shells out to the CLI instead of scanning directories. Keeps the existing `OpenspecListResult` schema shape — we just populate it from the CLI output (and gain `status` / `lastModified` as richer fields).
- **Expose `status` in the schema**: extend `OpenspecChangeSummary` with `status: 'in-progress' | 'complete'`. SpecPane's "Ready" badge reads `status === 'complete'` instead of deriving from `tasks.done === tasks.total`.
- **Keep `toggleTask` as-is**: no CLI equivalent; file-level read/write stays correct.
- **Fallback**: if the CLI is missing (`ENOENT`), `list` returns `{ error: 'openspec-cli-not-found' }` so the pane can surface a helpful empty-state.

Explicitly out of scope (future changes):
- `openspec status --change <id>` for per-change artifact detail — our current summary already has what the pane needs.
- `openspec validate` integration — separate lint/check UX.
- `openspec archive <name>` button — separate destructive-action UX.
- Removing the tests that covered `sync` RPC logic (they'll be deleted with the code, not preserved).

## Capabilities

- **spec-pane**: fix CLI command name, drop fake `sync`, adopt native `openspec list --json` + its `status` field.
