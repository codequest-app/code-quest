## ADDED Requirements

### Requirement: Logger interface
shared/node SHALL export a `Logger` interface with methods: `fatal`, `error`, `warn`, `info`, `debug`, `trace`. Each method SHALL accept `(...args: unknown[]) => void`. The interface MUST be compatible with pino's Logger.

#### Scenario: pino instance satisfies Logger
- **WHEN** a pino logger is created with `pino()`
- **THEN** it satisfies the `Logger` interface without adapter

#### Scenario: NOOP_LOGGER satisfies Logger
- **WHEN** a no-op logger is needed (e.g. default for WsTransport)
- **THEN** a `NOOP_LOGGER` constant with empty implementations for all methods SHALL be available

### Requirement: parseLogConfig
shared/node SHALL export `parseLogConfig(env: Record<string, string | undefined>)` returning `{ level: string; pretty: boolean }`.

#### Scenario: default values
- **WHEN** no `LOG_LEVEL` or `LOG_PRETTY` env vars are set
- **THEN** level SHALL be `'info'` and pretty SHALL be `false`

#### Scenario: LOG_LEVEL set
- **WHEN** `LOG_LEVEL` is set to a valid pino level (fatal/error/warn/info/debug/trace/silent)
- **THEN** the returned level SHALL match the env value

#### Scenario: LOG_LEVEL invalid
- **WHEN** `LOG_LEVEL` is set to an invalid value
- **THEN** level SHALL fall back to `'info'`

#### Scenario: LOG_PRETTY enabled
- **WHEN** `LOG_PRETTY` is `'true'` or `'1'`
- **THEN** pretty SHALL be `true`

### Requirement: WsTransport uses Logger
`WsTransport` constructor SHALL accept `Logger` instead of `WsTransportLogger`. `WsTransportLogger` SHALL be removed.

#### Scenario: WsTransport with pino logger
- **WHEN** `new WsTransport(adapter, pinoLogger)` is called
- **THEN** WsTransport SHALL use the logger for warn-level messages

#### Scenario: WsTransport without logger
- **WHEN** `new WsTransport(adapter)` is called without a logger
- **THEN** WsTransport SHALL use `NOOP_LOGGER` as default

### Requirement: server config includes log settings
server `loadConfig()` SHALL include `log: { level: string; pretty: boolean }` parsed from env via `parseLogConfig`.

#### Scenario: server logger uses config
- **WHEN** server starts
- **THEN** `logger.ts` SHALL create pino with level and transport from `config.log`

### Requirement: summoner config includes log settings
summoner `loadConfig()` SHALL include `log: { level: string; pretty: boolean }` parsed from env via `parseLogConfig`.

#### Scenario: summoner has logger
- **WHEN** summoner starts
- **THEN** a `logger.ts` SHALL exist exporting a pino logger configured from `config.log`

### Requirement: env documentation
Both `packages/server/.env.example` and `packages/summoner/.env.example` SHALL document `LOG_LEVEL` and `LOG_PRETTY` with valid values and defaults.

#### Scenario: .env.example contains log vars
- **WHEN** a developer reads `.env.example`
- **THEN** they SHALL see `LOG_LEVEL` and `LOG_PRETTY` with descriptions
