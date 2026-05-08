## ADDED Requirements

### Requirement: Config SHALL produce an ordered unique database URL array

`config.database` SHALL be a `string[]` containing unique database URLs in priority order (first = primary).

#### Scenario: No env vars set
- **WHEN** neither `DATABASE_URL` nor `DATABASE_SQLITE_URL` is set
- **THEN** `config.database` SHALL be `['file:./data/code-quest.db']`

#### Scenario: Only DATABASE_URL set (mysql)
- **WHEN** `DATABASE_URL=mysql://root@localhost/db`
- **THEN** `config.database` SHALL be `['mysql://root@localhost/db', 'file:./data/code-quest.db']`

#### Scenario: Only DATABASE_SQLITE_URL set
- **WHEN** `DATABASE_SQLITE_URL=file:./custom.db`
- **THEN** `config.database` SHALL be `['file:./custom.db']`

#### Scenario: Both set with different values
- **WHEN** `DATABASE_URL=mysql://root@localhost/db` and `DATABASE_SQLITE_URL=file:./custom.db`
- **THEN** `config.database` SHALL be `['mysql://root@localhost/db', 'file:./custom.db']`

#### Scenario: DATABASE_URL same as sqlite → no duplicate
- **WHEN** `DATABASE_URL=file:./data/code-quest.db`
- **THEN** `config.database` SHALL be `['file:./data/code-quest.db']`

### Requirement: createDatabaseFromUrl SHALL resolve driver by URL protocol

`createDatabaseFromUrl(url)` SHALL return a `DatabaseEntry` with the correct driver and schema based on URL protocol.

#### Scenario: MySQL URL
- **WHEN** URL starts with `mysql://` or `mysql2://`
- **THEN** SHALL return `{ db: MySql2Database, schema: mysqlSchema }`

#### Scenario: SQLite URL
- **WHEN** URL starts with `file:` or is a bare path
- **THEN** SHALL return `{ db: DrizzleDatabase, schema: sqliteSchema }`

#### Scenario: Unsupported protocol
- **WHEN** URL starts with `postgres://`
- **THEN** SHALL throw with a clear error message

### Requirement: Container SHALL accept databases array

`StoreConfig.databases` SHALL be a `DatabaseEntry[]`. All store builders SHALL iterate the array to build composite stores.

#### Scenario: Single database
- **WHEN** `databases` has one entry
- **THEN** stores SHALL use that entry directly (no composite wrapper)

#### Scenario: Multiple databases
- **WHEN** `databases` has two entries
- **THEN** composite stores SHALL read from `databases[0]` and write to all

### Requirement: Composite stores SHALL use a shared base class

A `CompositeStore<T>` base class SHALL provide `primary` (read) and `fanOut` (write) abstractions.

#### Scenario: Read operation
- **WHEN** a read method is called on a composite store
- **THEN** it SHALL delegate to `stores[0]` only

#### Scenario: Write operation
- **WHEN** a write method is called on a composite store
- **THEN** it SHALL execute on all stores, logging errors for secondary stores without throwing
