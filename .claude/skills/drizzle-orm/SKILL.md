---
name: drizzle-orm
description: >
  Drizzle ORM and drizzle-kit patterns for multi-dialect setup (SQLite + MySQL).
  Use when creating or modifying DB schemas, writing migrations, implementing repositories,
  adding tables or relations, or writing database tests.
---

# Drizzle ORM

## File Structure

```
apps/server/
├── src/db/
│   ├── schema-sqlite.ts        # sqliteTable() definitions
│   ├── schema-mysql.ts         # mysqlTable() definitions
│   ├── schema-columns.ts       # Shared column name constants
│   ├── sqlite-client.ts        # drizzle(better-sqlite3) factory
│   └── mysql-client.ts         # drizzle(mysql2) factory
├── src/services/
│   ├── drizzle-session-store.ts    # Session CRUD
│   ├── drizzle-raw-store.ts        # Raw event append/query
│   ├── composite-raw-store.ts      # Multi-backend wrapper
│   └── composite-session-store.ts
├── src/scripts/
│   ├── migrate-sqlite.ts
│   └── migrate-mysql.ts
├── drizzle-sqlite.config.ts
├── drizzle-mysql.config.ts
└── drizzle/
    ├── sqlite/    # 10 migration files
    └── mysql/     # 10 migration files
```

## Schema Pattern

Both dialects share column names via `schema-columns.ts`:

```typescript
// schema-columns.ts
export const SESSION_COLUMNS = { id, provider, command, args, cwd, mode, role, parentId, sessionId, title, status, createdAt };
export const RAW_ENTRY_COLUMNS = { id, sessionId, promptId, dir, raw, seq, createdAt };
```

Schema consistency is verified by `src/__tests__/schema-consistency.test.ts` using `getTableColumns()`.

## Connection Setup

**SQLite** (`sqlite-client.ts`): `drizzle(new Database(path), { schema })` — WAL mode + foreign keys enabled.
**MySQL** (`mysql-client.ts`): `drizzle(mysql.createPool(url), { schema, mode: 'default' })`.

## Query Patterns

```typescript
// Select with pagination
db.select().from(sessions).where(ne(sessions.status, 'deleted')).orderBy(desc(sessions.createdAt)).limit(limit).offset(offset)

// Insert
db.insert(rawEntries).values({ sessionId, raw, seq, createdAt })

// Update
db.update(sessions).set({ title }).where(eq(sessions.id, id))

// Delete
db.delete(sessions).where(eq(sessions.id, id))

// Count
db.select({ count: count() }).from(sessions)
```

Operators: `eq()`, `ne()`, `desc()`, `asc()`, `count()`.

## Migration Workflow

```bash
pnpm db:generate:sqlite   # drizzle-kit generate
pnpm db:generate:mysql
pnpm db:migrate:sqlite     # Run migrations
pnpm db:migrate:mysql
pnpm db:studio:sqlite      # Drizzle Studio
```

## Testing

In-memory SQLite with migrations:

```typescript
const db = createDatabase(':memory:');
migrate(db, { migrationsFolder: 'drizzle/sqlite' });
```

Test container (`src/test/create-test-container.ts`) provides DI container with pre-migrated in-memory DB.

## Dependencies

```
drizzle-orm: ^0.45.1, drizzle-zod: ^0.8.3, mysql2: ^3.17.4
better-sqlite3: ^12.6.2 (dev), drizzle-kit: ^0.31.9 (dev)
```
