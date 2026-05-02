## Why

Four handler sites (`command.ts` delete + rename, `message.ts` title rename, `connect.ts` dead-status update) repeat the same two-step dance:

```ts
const record = await sessionStore.getByChannelId(cid);
if (record) await sessionStore.X(record.id, ...);
```

The pattern is both noisy and bug-prone — every caller must remember to null-check, and any missed `if (record)` becomes an unhandled promise rejection. It also leaks the channelId → sessionId bridge up out of the store, which is the layer that "owns" both identifiers.

## What Changes

- Add three convenience methods on `SessionStore`:
  - `deleteByChannelId(channelId: string): Promise<boolean>`
  - `renameByChannelId(channelId: string, title: string): Promise<boolean>`
  - `updateStatusByChannelId(channelId: string, status: string): Promise<boolean>`
- Each returns `false` when no record matches the channelId (mirrors the existing `delete/rename/updateStatus` return contract).
- Implement on `DrizzleSessionStore` by composing the existing `getByChannelId` + `<op>(id, ...)` methods — no new queries required.
- Keep `getByChannelId` (needed for read paths like `query.ts`, `session-history.ts`).
- Collapse the 4 handler sites:
  - `packages/server/src/socket/handlers/session/command.ts:48-49` (`handleDelete`)
  - `packages/server/src/socket/handlers/session/command.ts:68-69` (`handleRename`)
  - `packages/server/src/socket/handlers/message.ts:242-244` (`generateTitleIfNeeded`)
  - `packages/server/src/socket/handlers/session/connect.ts:173-177` (dead-status update on "No conversation found")

## Capabilities

### Modified Capabilities
- `server-session-store-identity` — add contract for the three `*ByChannelId` helpers.

## Impact

- Non-breaking: existing `getByChannelId` and the per-id methods stay. Callers migrate one-for-one.
- Test impact: update server fake `SessionStore` implementations (if any) to implement the three new methods. Handler tests stay green because the externally observable behavior (`{ success: true/false, error }`) is identical.
- No wire / client impact.
