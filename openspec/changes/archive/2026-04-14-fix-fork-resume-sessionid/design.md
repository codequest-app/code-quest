# Design: fix-fork-resume-sessionid

## CLI fork semantics (verified against claude 2.1.104)

### Flag combo we adopt

```
claude --print --output-format stream-json --input-format stream-json --verbose \
  --permission-prompt-tool stdio --include-partial-messages --include-hook-events \
  --resume <parentSessionId> \
  --fork-session \
  --session-id <serverPreGeneratedSessionId> \
  [--resume-session-at <messageUuid>]
```

### Verified behaviors

1. **CLI accepts `--session-id X --resume Y --fork-session` together.** `system:init` emits `session_id = X` (our preset), not a CLI-generated one. Confirmed empirically 2026-04-14.
2. **CLI auto-copies parent history into the new JSONL.** We spawn with `--session-id e5abb62b…`; CLI created `e5abb62b….jsonl` and pre-populated it with parent's messages up to fork point (rewriting each row's `sessionId` to the preset). No client-side JSONL manipulation needed.
3. **`system:init` still only fires after the first user message hits stdin.** This matches launch/resume. However, because we know the sessionId before spawn, we pre-set `ch.sessionId` in `onBeforeSpawn` — eliminating the null-window that previously blocked `session:join` and resume lookups.

### Why we diverge from the extension's JSONL copy

The VS Code extension (`main.js:58022-58148`) performs a client-side JSONL copy because extension reads JSONL as its history source. cc-office reads `rawEventStore` (DB) as history source. The DB-layer equivalent is `cloneEvents(from, to)` — same idea, different storage.

CLI's own JSONL work is a separate concern: CLI auto-copies into the new JSONL (verified above), so JSONL-based clients (other CLI users) also see the history. cc-office DB + CLI JSONL both end up with parent lineage — via independent mechanisms.

## History truncation (`resumeSessionAt`) — scoped out

When `resumeSessionAt = <msgUuid>`, CLI truncates its JSONL to that message. Our `cloneEvents` for v1 copies ALL parent rawEventStore rows — meaning DB history can be longer than CLI JSONL when fork point is mid-conversation. Acceptable:

- UI accuracy is preserved (user sees everything they had in parent)
- CLI's context sent to model is truncated (matches user intent for "fork from here")
- Mismatch is one-directional (DB ≥ JSONL), never misleading

Follow-up change can parse raw entries, find the row whose content has `uuid === msgUuid`, and cap the clone there.

## Why pre-set `ch.sessionId`

Previously fork couldn't pre-set because CLI generated sessionId. With `--session-id <preset>`, we own the sessionId from birth. Pre-setting means:

- `session:join` on the forked channel finds events immediately (no race with `system:init`)
- Resume of the fork works the instant spawn begins — no "user must send a first message" precondition
- fork/resume paths become structurally symmetric (both pre-set; only launch leaves it null)

## Clone cost

`cloneEvents` implementation is a single `INSERT INTO raw_events (...) SELECT ... FROM raw_events WHERE session_id = ?` with sessionId rewrite and seq re-sequencing. For a conversation with N events, this is one round-trip + O(N) inserts — typically milliseconds even for multi-thousand-event conversations. Acceptable per-fork cost.

## Schema / contract decisions

- **Payload unchanged**: `{ forkedFromChannelId, resumeSessionAt?, newChannelId }`. Client still supplies the channel-side UUID.
- **Ack `events` field deprecated but retained**: response schema still allows `events` for backwards compatibility, but server no longer populates it for fork. Client drops the code path that consumes it (follow-up cleanup).
- **`newSessionId` is server-generated, not client-supplied**: keeping payload surface minimal; client has no reason to dictate the fork's DB sessionId.

## Test strategy

TDD-driven. FakeClaude intercepts spawn and inspects argv. Server-level tests assert:

1. argv contains `--resume <realParentSid> --fork-session --session-id <newGenerated>`
2. cwd passed to spawn matches parent's cwd
3. After handleFork returns, `rawEventStore.getBySession(newSessionId)` returns the parent's events
4. After handleFork returns, `channel.sessionId === newSessionId` (pre-set confirmed)
5. Unknown parent channel → callback rejects without spawning
6. `resumeSessionAt` is forwarded to argv unchanged
