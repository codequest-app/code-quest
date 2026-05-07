## Context

Previous naming chain:

```
RAW_EVENTS_DRIVERS=sqlite,mysql         ← implies "raw-events-specific" (lie: controls all 4 tables)
RAW_EVENTS_SQLITE_PATH=./data/...       ← same lie
DATABASE_URL=mysql://...                ← industry-standard mysql URL
```

Two redundant sources of truth:
- driver list says "use sqlite"
- path / URL tells you HOW to reach sqlite

If a URL is supplied, "is this backend active" is already answerable. The list is duplication.

## Goals / Non-Goals

**Goals:**
- One env var per backend: its URL.
- URL presence = backend active (no separate driver list).
- Fail-fast at boot when no backend configured, with message pointing at `.env.example`.
- `DATABASE_URL` stays as MySQL (industry convention kept).
- Internal config shape becomes `config.database.{url, sqliteUrl}`; `rawEvents.drivers / sqlitePath` removed.
- Loose URL parser for sqlite: accept `file:./data.db` AND bare `./data.db`.

**Non-Goals:**
- Adding new DB backends (postgres, redis) — URL pattern is now ready for them but not part of this PR.
- Auto-migrating data between backends.
- Removing `DATABASE_URL` in favour of `DATABASE_MYSQL_URL` — keeping industry convention trumps naming symmetry.

## Decisions

### Decision 1: URL presence ⇒ backend active

```ts
const mysqlActive  = !!env.DATABASE_URL;
const sqliteActive = !!env.DATABASE_SQLITE_URL;
if (!mysqlActive && !sqliteActive) {
  throw new Error(
    'No database backend configured.\n' +
    'Set DATABASE_URL and/or DATABASE_SQLITE_URL in .env. ' +
    'See .env.example for a working default.'
  );
}
```

No separate list, no ambiguity.

### Decision 2: Loose SQLite URL parser

```ts
function resolveSqlitePath(url: string): string {
  if (url === 'file::memory:') return ':memory:';
  if (url.startsWith('file:')) return url.slice(5);
  return url;   // tolerate bare path
}
```

**Why loose**: users migrating from `RAW_EVENTS_SQLITE_PATH=./data/code-quest.db` can paste the value verbatim into `DATABASE_SQLITE_URL` and it works. Docs and `.env.example` show the canonical `file:` form so new users learn the right convention.

### Decision 3: Config shape

```ts
// Before
config = {
  databaseUrl: process.env.DATABASE_URL,
  rawEvents: {
    drivers: [...],
    sqlitePath: '...',
    persistDeltas: false,
  },
  ...
}

// After
config = {
  database: {
    url:       env.DATABASE_URL        ?? undefined,
    sqliteUrl: env.DATABASE_SQLITE_URL ?? undefined,
  },
  rawEvents: {
    persistDeltas: false,   // only genuinely raw-event-scoped flag remains
  },
  ...
}
```

`rawEvents` shrinks to what actually belongs to it.

### Decision 4: `StoreConfig` rework

```ts
// Before
interface StoreConfig {
  sqlite?: boolean;
  mysql?: { database: MysqlDatabase };
}

// After
interface StoreConfig {
  sqliteDatabase?: SqliteDatabase;   // undefined = disabled
  mysqlDatabase?: MysqlDatabase;     // undefined = disabled
}
```

Both fields become "handles the caller already opened" — makes `buildStores` trivial:

```ts
if (config.sqliteDatabase) {
  eventStores.push(new DrizzleRawEventStore(config.sqliteDatabase, sqliteSchema.rawEvents));
  ... // all 4 store families follow
}
if (config.mysqlDatabase) { ... }
if (eventStores.length === 0) throw ...;
```

### Decision 5: `.env.example` is the default, not code

```bash
# .env.example (committed, canonical)
DATABASE_URL=mysql://user:password@localhost:3306/dbname
DATABASE_SQLITE_URL=file:./data/code-quest.db
RAW_EVENTS_PERSIST_DELTAS=false
CLI_AUTO_MODE=true
# ...
```

Onboarding: `cp apps/server/.env.example apps/server/.env && pnpm db:migrate && pnpm dev`. Works out of the box because the template supplies both backends (use what you want — dual-write, mysql only by commenting the sqlite line, etc.).

### Decision 6: Fail-fast with pointer to fix

Error message is actionable:

```
No database backend configured. Set DATABASE_URL (MySQL) and/or
DATABASE_SQLITE_URL (e.g. file:./data/code-quest.db) in .env.
See apps/server/.env.example for a working default.
```

Solving your own error should never require searching docs.

## Risks / Trade-offs

- **[Risk]** Existing dev machines with old `.env` containing `RAW_EVENTS_*` will fail to boot after upgrade. **Mitigation**: documented migration (one-time paste into `.env`); commit updates `apps/server/.env` on this dev machine in the same PR.
- **[Risk]** "Boot fails if DB not configured" is stricter than before (old default silently used SQLite). **Mitigation**: that strictness is the goal; the new error message tells users exactly what to do.
- **[Risk]** Loose parser means `./data.db` and `file:./data.db` both work — someone might think they're different things. **Mitigation**: `.env.example` shows `file:` canonically; docs call this out.

## Migration Plan

1. Update `apps/server/.env` on dev machines (new variable names).
2. Ship `.env.example` as canonical template.
3. Old env names are not read — any leftover `RAW_EVENTS_DRIVERS` is silently ignored (user sees boot fail because no URL set → fixed by env update).
4. Follow-up `normalize-env-naming` change can be archived after this lands; it was the stepping stone.
