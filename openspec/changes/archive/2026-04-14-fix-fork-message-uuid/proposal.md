# Proposal: fix-fork-message-uuid

## Why

Fork dialog passes `selected.message.id` as `resumeSessionAt` to the server, which forwards it as CLI argv `--resume-session-at <uuid>`. CLI 2.1.104 expects the JSONL row's `uuid` field; passing anything else returns "No message found with message.uuid of: ...".

cc-office's `Message.id` field conflates two unrelated identities:

- **Local id**: assigned by `msg()` helper as `crypto.randomUUID()` when user types a message. Used as React key and dedup anchor. Exists immediately.
- **CLI uuid**: assigned by CLI/JSONL when it processes the message. Server-canonical. Arrives via the `message:user` echo event after a network round-trip.

The dedup logic in `applyUserContent` (handlers/message.ts:21) tries to swap the local id for the CLI uuid when the echo arrives — but only matches against `last.content === incoming.content` and only on the LATEST message. If anything happens between submit and echo (auth notification, system event, fast follow-up message), the dedup misses, leaving the message with its local id. Fork from such a message fails immediately.

CLI does NOT permit server-supplied message uuids (no `--message-uuid` flag), so we cannot eliminate the dual-identity nature. The honest fix is to model both identities explicitly.

This is verified empirically — `--resume-session-at` accepts the JSONL `uuid` field for both user and assistant messages, rejects `promptId`, rejects any uuid not present in the JSONL.

## What Changes

Client (`apps/web/src/types/ui.ts`):

- `MessageBase` SHALL grow a new optional field `cliUuid?: string`. It SHALL be set if and only if the CLI/server has assigned a JSONL-canonical uuid to this message. `id` retains its existing semantics (React key, dedup anchor, locally assigned).

Client (`apps/web/src/contexts/channel/handlers/message.ts`):

- `applyUserContent` SHALL set `cliUuid` (NOT `id`) from the incoming `p.uuid`. The dedup branch (last-message-content match) SHALL set `cliUuid` on the matched message; the new-message branch SHALL set `cliUuid` on the newly pushed message. `id` SHALL never be mutated post-creation.

Client (`apps/web/src/components/RewindDialog.tsx`):

- `getRewindableMessages` SHALL filter to messages with non-empty `cliUuid`. Messages without a `cliUuid` (echo not yet received, or echo missed) SHALL NOT appear in the picker.
- `onConfirm` SHALL pass `selected.message.cliUuid` (NOT `id`) as the `messageId` argument.

No server / shared schema changes.

## Scope — out of scope

- Reworking `chat:send` to await CLI uuid synchronously (would require CLI protocol changes; CLI does not support server-supplied message uuids).
- Removing the local id entirely (would lose optimistic UI; degenerate to current bug under different naming).
- Smarter dedup heuristics (treats symptom, not category error).
- Handling the historical case where existing UI sessions have messages without `cliUuid` — those messages remain non-forkable until the next reload (acceptable; reload re-derives from rawEventStore which carries CLI uuids).
- **Assistant `cliUuid`**: One CLI assistant turn produces multiple cc-office messages (text + thinking + tool_use blocks). Mapping a single CLI uuid to N messages requires UX decisions (which message owns it? duplicate? expose at turn level?). Fork picker only filters user messages today, so this is decorative. The official VS Code extension also restricts fork to user messages (verified: `main.js:238701` filters `type !== "user"`; assistant messages render without a fork affordance). Deferred to a follow-up change if/when an "edit-from-assistant" feature is added.

## Impact

- Affected specs: `client` (Message identity model + fork picker eligibility).
- Affected code: `apps/web/src/types/ui.ts`, `apps/web/src/contexts/channel/handlers/message.ts`, `apps/web/src/components/RewindDialog.tsx`, plus tests for each.
- Risk: low — purely additive field; `id` semantics unchanged; fork picker becomes stricter (better UX than silent CLI failure).
- Rollout: direct merge after TDD green.
