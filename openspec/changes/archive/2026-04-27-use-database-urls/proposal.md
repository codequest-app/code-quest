## Why

`RAW_EVENTS_DRIVERS` turned out to control **every** persistent table (raw_events, raw_deltas, sessions, settings) — not just raw events. Its name misleads. `RAW_EVENTS_SQLITE_PATH` similarly claims to be raw-events-specific, but it's actually the one SQLite file every table shares. The `raw-events` namespace was never the right home for these app-wide DB selection decisions.

The current model also duplicates intent: set a URL/path AND list it in a separate "which drivers" env. Two sources of truth for the same thing.

A simpler model: **each backend has a URL; if the URL is set, the backend is enabled**. Setting `DATABASE_URL` enables MySQL; setting `DATABASE_SQLITE_URL` enables SQLite. Both set → dual-write. Neither set → boot fails with a clear message pointing to `.env.example`.

This aligns with the `file:./data.db` convention used by Drizzle/Prisma/SQLAlchemy, keeps the industry-standard `DATABASE_URL` for MySQL (Heroku/Docker/ORM compatibility), and makes `RAW_EVENTS_*` truly scoped to raw-event behaviour (just `RAW_EVENTS_PERSIST_DELTAS` remains).

## What Changes

- **New env**: `DATABASE_SQLITE_URL` (canonical form `file:./data/code-quest.db`, loose parser accepts bare paths too).
- **Repurpose**: `DATABASE_URL` stays as MySQL URL (unchanged semantics).
- **Remove**: `RAW_EVENTS_DRIVERS` and `RAW_EVENTS_SQLITE_PATH` — fully replaced by URL-presence detection.
- **Behaviour**: URL set → backend active; both unset → fail-fast at boot with message pointing at `.env.example`.
- **Internal config shape** refactored:
  - `config.rawEvents.{drivers, sqlitePath}` → `config.database.{url, sqliteUrl}`
  - `config.rawEvents.persistDeltas` stays (genuinely raw-event-scoped)
- **StoreConfig interface** simplifies: `{ sqlite, mysql }` booleans → `{ sqliteDatabase?, mysqlDatabase? }` handles (undefined = disabled).
- **container.ts** no longer pre-builds a SQLite handle unconditionally; sqlite handle is only created when `DATABASE_SQLITE_URL` is set.
- `.env.example` becomes the single source of truth for defaults; onboarding is `cp .env.example .env`.

## Capabilities

### New Capabilities

(none — internal config / env plumbing, no product behaviour change)

### Modified Capabilities

(none)

## Impact

- `apps/server/src/config.ts` — env schema + loadConfig shape.
- `apps/server/src/container.ts` — StoreConfig interface, buildStores logic, boot-time DB handle creation.
- `apps/server/src/bin/server.ts` — construct StoreConfig from new env shape, surface fail-fast error.
- `apps/server/src/scripts/migrate-sqlite.ts`, `migrate-mysql.ts` — read the new config fields, error out if required URL missing.
- `apps/server/.env` and `.env.example` — rewrite to new shape.
- Tests: `config.test.ts` covers URL-presence + fail-fast; any existing fixture using `rawEvents.drivers` / `rawEvents.sqlitePath` updates to `database.url` / `database.sqliteUrl`.
- No DB schema change. No client change. No protocol change.
