## Why

The `sessions` table and the `SessionStore` interface expose a field called `id` that actually holds the server `Channel.channelId`. After the recent `Channel.id → Channel.channelId` rename (commit `e26cb2ce`), every producer site writes `channel.channelId` into this `id` field, and every consumer site then passes it around as `channelId`. The mismatch is noisy at the callsites and misleading on the DB surface.

The same identifier bleeds through `sessionSummarySchema.id` on the wire, where the client's session history components read `s.id` to key rows that are semantically channel identifiers.

This change renames the field end-to-end so the name reflects what the value is.

## What Changes

- **DB schema (SQLite + MySQL)**: rename the `sessions.id` column (SQL `id`) to `sessions.channel_id` (SQL `channel_id`); field name in Drizzle schema becomes `channelId`.
- **Schema consistency check**: update `SESSION_COLUMNS` in `schema-columns.ts` (`'id'` → `'channelId'`).
- **DB migration**: add a migration per dialect using `ALTER TABLE sessions RENAME COLUMN id TO channel_id`. No data rewrite; no index recreation required beyond the primary key.
- **Server store layer (`sessionRecordSchema`)**: rename the `id: z.string()` field to `channelId: z.string()`. The `SessionRecord` type follows.
- **Server store methods**: method *names* stay (`getById`, `rename`, `updateStatus`, `delete`) — "Id" is generic enough — but their parameter names become `channelId: string`. The underlying Drizzle `where(eq(sessions.channelId, ...))` queries are updated.
- **All server callers** (`connect.ts`, `command.ts`, `query.ts`, `session-history.ts`, `routes/sessions.ts`): pass / read `channelId` instead of `id`. Drop the `const channelId = channel.channelId` aliases that become redundant (the three leftovers in `connect.ts`).
- **Shared wire schema (`sessionSummarySchema`)**: rename the `id: z.string()` field to `channelId: z.string()`. **BREAKING** for any client reading `SessionSummary.id` — those sites migrate to `.channelId` in this change.
- **Client consumers** (`SessionRow.tsx`, `SessionHistory.tsx`): replace `s.id` with `s.channelId`.
- **Tests**: update harness setup code that builds `SessionRecord` / `SessionSummary` fixtures with `id:` to use `channelId:`. Never modify `expect(...)` assertions.

## Capabilities

### New Capabilities
<!-- None; this change modifies an existing behavior surface -->

### Modified Capabilities
<!-- None at spec-repo level — `sessions` table and `SessionStore` are server-internal, and no existing capability doc covers them. We file an ADDED requirement under a new `server-session-store-identity` capability so the contract is recorded going forward. -->

### New Capabilities
- `server-session-store-identity`: Documents that the session store row's channel-identifying field, and the matching wire field on `SessionSummary`, are named `channelId` (matching the in-memory `Channel.channelId`), end-to-end from DB column to client type.

## Impact

- **DB**: `sessions.id` column renamed to `sessions.channel_id` (both SQLite and MySQL). Existing rows preserved via `ALTER TABLE ... RENAME COLUMN`.
- **Server code**: `session-store.ts`, `drizzle-session-store.ts`, `composite-session-store.ts`, `schema-columns.ts`, `schema-sqlite.ts`, `schema-mysql.ts`, plus 5 caller files.
- **Shared schemas**: `packages/shared/src/schemas/session.ts` (`sessionSummarySchema`).
- **Client code**: `SessionRow.tsx`, `SessionHistory.tsx`. (`SessionDropdown.tsx` doesn't read `.id`; `SessionContext.tsx` only types, no field access.)
- **Tests**: ~7 test files (server store + handlers + client SessionRow/SessionHistory stories).
- **Protocol**: REST GET `/api/sessions` and `/api/sessions/:id` responses change shape — `id` field becomes `channelId`. The URL parameter name (`:id`) is a path segment, not a payload field, and is left alone unless the user wants path alignment too.
- **Dependencies**: none new.
- **Raw event store / settings store**: untouched; their `id` columns are not channel identifiers.
