# Design: fix-fork-message-uuid

## Why two fields, not one

CLI does NOT permit server-supplied message uuids — there is no `--message-uuid` flag and CLI generates uuids when writing JSONL. This means the CLI uuid for any user message is only knowable AFTER the CLI processes it and echoes back. We can never have the CLI uuid at message-send time, so any single-field design must handle the "id is sometimes local, sometimes canonical" duality somehow.

Three single-field designs were considered and rejected:

1. **Lose optimistic UI**: don't render until echo arrives. Adds 1-2s perceived latency. Modern chat UX cannot accept this.
2. **Pending id with prefix sentinel** (e.g. `local-xxx`): magic-string discrimination, fragile, every consumer must know the convention.
3. **Pending flag** (`isPending: boolean`): equivalent to having two fields, just with worse ergonomics — every read site does `if (!isPending) use id`. Two fields is the same information with clearer types.

Two fields is the honest model: `id` is locally-anchored UI identity; `cliUuid` is server-canonical identity. They have different lifecycles and different consumers.

## Why dedup-by-content stays

The dedup logic at handlers/message.ts:21 still serves a purpose: collapse the user's typed message with CLI's echo into one rendered message. The fix is to make the swap target be `cliUuid` instead of `id`. If dedup misses (echo not the latest), we get a duplicate render — a separate UX bug, not in scope here. The fork eligibility filter (`cliUuid` exists) at least prevents the duplicate from being non-functional.

Future cleanup: walk the message list (not just `last`) when echo arrives, finding any text-content match without a `cliUuid` yet. Out of scope; track separately.

## Why filter the picker

Without the filter, fork picker would display messages that look forkable but fail server-side. The user already hit this UX. Filtering by `cliUuid` makes the picker honest: only messages CLI knows about can be forked from. Messages still streaming or echo-pending temporarily disappear from the picker — acceptable, because the picker is for HISTORICAL fork points, not in-flight ones.

## Why assistant messages don't get cliUuid

Verified against the official VS Code extension (`main.js`):

- Fork picker filter (line 238701): `if (_0347.type !== "user" || _0347.isSynthetic || !_0347.uuid || _0347.parentToolUseId) continue;` — explicit `type !== "user"` exclusion.
- `MessageActionMenu` containing "Fork conversation from here" (line 232270) is rendered only inside `userMessageContainer` (line 240165).
- Assistant messages render via a different component (`_8778`, line 240212) with no fork affordance.

cc-office's `RewindDialog.getRewindableMessages` already filters `role === 'user'` for the same reason. Adding `cliUuid` to assistant messages would be dead weight — never read by any consumer in either codebase. The CLI's `--resume-session-at` does technically accept assistant uuids, but neither UI exposes it. If a future change adds an "edit/regenerate from assistant turn" feature, that work can introduce assistant `cliUuid` plumbing alongside its own UX decisions (one-uuid-to-N-messages mapping).

## Alternative considered: server-side reverse lookup

Server could accept the local UI id and reverse-lookup the CLI uuid via rawEventStore content match. Rejected:

- rawEventStore doesn't index by content
- Heuristic match is fragile (whitespace, multi-block content, attachments)
- Couples server to a UI-internal id that has no meaning in CLI's world
- Doesn't fix the underlying category error in client state
