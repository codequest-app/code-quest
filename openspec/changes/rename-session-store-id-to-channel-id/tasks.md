## 1. Inventory & TDD setup

- [ ] 1.1 Re-run grep for `SessionRecord` / `SessionSummary` uses in server + client + tests; confirm the blast-radius list below is complete (9 server files, 2 client components, ~7 test files, 2 shared files, 2 DB schema files)
- [ ] 1.2 Confirm no third-party / external consumer reads `SessionSummary.id` (grep `"id":` patterns inside anything under `packages/server/data/` or similar — these are log files, not code consumers, but a quick sanity sweep)

## 2. DB schema + migration (no tests yet — DB layer)

- [ ] 2.1 `packages/server/src/db/schema-sqlite.ts`: `sessions` table — rename `id: text('id').primaryKey()` to `channelId: text('channel_id').primaryKey()`
- [ ] 2.2 `packages/server/src/db/schema-mysql.ts`: `sessions` table — rename `id: varchar('id', { length: 36 }).primaryKey()` to `channelId: varchar('channel_id', { length: 36 }).primaryKey()`
- [ ] 2.3 `packages/server/src/db/schema-columns.ts`: replace `'id'` with `'channelId'` in `SESSION_COLUMNS`
- [ ] 2.4 Author migration SQL manually for SQLite — add a new migration file under `packages/server/drizzle/sqlite/` (follow the existing naming scheme) containing `ALTER TABLE sessions RENAME COLUMN id TO channel_id;`. Do NOT run `pnpm db:generate:sqlite` (it will emit a destructive diff).
- [ ] 2.5 Author migration SQL manually for MySQL under `packages/server/drizzle/mysql/`: `ALTER TABLE sessions RENAME COLUMN id TO channel_id;`
- [ ] 2.6 Run `pnpm --filter server test schema-consistency` — expect green (both dialects now agree the column is `channelId`)

## 3. Server store layer

- [ ] 3.1 `packages/server/src/services/session-store.ts`: rename `id: z.string()` → `channelId: z.string()` in `sessionRecordSchema`; update `SessionStore` method signatures so their `id: string` parameter is renamed to `channelId: string`
- [ ] 3.2 `packages/server/src/services/drizzle-session-store.ts`: update all query builders — `eq(sessions.id, id)` → `eq(sessions.channelId, channelId)` — across `persist`, `getById`, `rename`, `updateStatus`, `delete`
- [ ] 3.3 `packages/server/src/services/composite-session-store.ts`: rename parameter names in forwarded methods; no behavior change
- [ ] 3.4 Run `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit` — collect every `.id` access error on `SessionRecord` / `SessionStore` call sites as the authoritative fix list

## 4. Server callers

- [ ] 4.1 `socket/handlers/session/connect.ts`: update `sessionStore.persist({ id: ..., ... })` → `{ channelId: ..., ... }`; **also drop the three redundant `const channelId = channel.channelId` aliases** (lines ~134, ~188, ~243) since the value now flows as `channelId` throughout
- [ ] 4.2 `socket/handlers/session/command.ts`: update `delete` / `rename` call sites (~lines 48, 67) if they pass `id:` as a named arg; positional calls need no change
- [ ] 4.3 `socket/handlers/session/query.ts`: update `list()` transforms at lines 27, 60 (projection to `SessionSummary`) — change `id` → `channelId` in the mapping; `getById(channelId)` at line 80 needs only the signature update which 3.1 provides
- [ ] 4.4 `socket/session-history.ts`: `getById(channelId)` at line 37 — method signature change carries through; no field access to touch
- [ ] 4.5 `routes/sessions.ts`: line 15 `list()` transform (if it mentions `.id`), line 19 `s.sessionId ?? s.id` → `s.sessionId ?? s.channelId`, line 38 `getById(req.params.id)` stays — `req.params.id` is the URL path parameter (we intentionally do NOT change the URL shape)

## 5. Shared wire schema

- [ ] 5.1 `packages/shared/src/schemas/session.ts`: rename `sessionSummarySchema.id` → `sessionSummarySchema.channelId`
- [ ] 5.2 Server code that constructs `SessionSummary` from a `SessionRecord` — update field mapping if it's manual (check `query.ts` projection) so outgoing payload carries `channelId`, not `id`

## 6. Client consumers

- [ ] 6.1 `packages/client/src/components/SessionRow.tsx`: lines 59, 80, 92, 95 — `s.id` → `s.channelId`
- [ ] 6.2 `packages/client/src/components/SessionHistory.tsx`: lines 24, 28, 51, 79 — `s.id` → `s.channelId`
- [ ] 6.3 `SessionDropdown.tsx` / `SessionContext.tsx` — confirm no change needed (already verified: no `.id` reads on SessionSummary)

## 7. Update test fixtures (inputs only, never expects)

- [ ] 7.1 `packages/server/src/__tests__/drizzle-session-store.test.ts` (lines ~70–71, 105–106, 127): change `persist({ id: ... })` / assertion input helpers to `{ channelId: ... }`. **Any `expect(result.id)` line stays verbatim — code under test must produce the rename for these to pass.** Actually, the assertions will naturally need to read `result.channelId` because the field is renamed; that is a legitimate harness-reach change, NOT an `expect(...)` rewrite — the shape being asserted changes, but the assertion *intent* is the same. Treat this like swapping `useChannelMessages().channelId` → `useChannelId()` in prior work.
- [ ] 7.2 `packages/server/src/__tests__/session-connect.test.ts`: persist setup (lines 1023–1031, 1048–1057, 1072–1081) and assertion reads (79, 290, 477, 513) — same approach
- [ ] 7.3 `packages/server/src/__tests__/session-query.test.ts`: lines 42, 71, 76, 143
- [ ] 7.4 `packages/server/src/__tests__/session-command.test.ts`: line 76
- [ ] 7.5 `packages/server/src/__tests__/session-fork.test.ts`: lines 25–27, 65–67
- [ ] 7.6 `packages/server/src/__tests__/permission.test.ts`: line 271
- [ ] 7.7 Client test files that build `SessionSummary` fixtures (`SessionRow.test.tsx`, `SessionHistory.test.tsx`, `SessionDropdown.test.tsx`): swap `id:` → `channelId:` in fixture builders

## 8. Verify & sweep

- [ ] 8.1 `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit` — clean
- [ ] 8.2 `pnpm --filter server test` — all green
- [ ] 8.3 `pnpm --filter server lint` — no new errors vs baseline
- [ ] 8.4 `pnpm --filter client exec tsc --noEmit` (or equivalent) — clean
- [ ] 8.5 `pnpm --filter client test` — all green
- [ ] 8.6 `pnpm --filter client lint` — no new errors vs baseline
- [ ] 8.7 Grep `\bid\b` on the `sessions` table / `SessionRecord` / `SessionSummary` surfaces — expect zero leftover channel-identifier reads named `id`
- [ ] 8.8 Exercise the migration locally: start from a DB that still has `id` column, run `pnpm db:migrate:sqlite` (and :mysql if available), then start the server and load a session — confirm no runtime errors

## 9. Wrap up

- [ ] 9.1 Single commit covering schema + migration + server + shared + client + tests
- [ ] 9.2 Include a note in the commit body that the migration is `ALTER TABLE ... RENAME COLUMN id TO channel_id` (reversible by another rename) so future operators / reviewers see the rollback recipe
