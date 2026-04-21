## ADDED Requirements

### Requirement: MCP request handlers share a single factory

Handlers in `packages/server/src/socket/handlers/mcp.ts` that follow the pattern "validate payload → `ch.sendRequest` → translate CLI response → callback" SHALL be constructed via the shared `createRequestHandler` factory, not hand-written. The factory SHALL support at minimum:

- `schema` — Zod schema used to validate the incoming payload.
- `event` — CLI request event name to dispatch.
- `errorMessage` — prefix used when wrapping thrown exceptions.
- `mapParsed?` — transform the parsed payload before sending (optional).
- `mapSuccess?` — transform the CLI response before callback; when set, success path wraps the result in `ok(mapSuccess(response))` and failure path wraps in `err(result.error ?? errorMessage)`.

#### Scenario: Authentication handler uses the factory

- **WHEN** the `mcp:authenticate` handler receives a valid payload and the CLI returns `{ success: true, response: { authUrl } }`
- **THEN** the callback receives `ok({ authUrl })` with the same URL (or `undefined` when not present), identical to the pre-refactor behaviour

#### Scenario: Authentication failure path preserved

- **WHEN** the CLI returns `{ success: false, error }` for an auth-style MCP request
- **THEN** the callback receives `err(error)` (or `err('Authentication failed')` when no error message is present)

#### Scenario: Invalid payload continues to short-circuit

- **WHEN** the handler receives a payload that fails Zod validation
- **THEN** the callback receives `err('Invalid payload')` and `ch.sendRequest` is not called
