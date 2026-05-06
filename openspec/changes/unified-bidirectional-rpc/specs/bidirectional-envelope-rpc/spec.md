## ADDED Requirements

### Requirement: Envelope protocol SHALL support server-initiated requests to any peer

The Envelope union SHALL be extended so that either side (server or client/summoner) can send `kind: 'request'` and receive `kind: 'response'`. The server SHALL be able to call methods on a connected peer and await a typed response, using the same Envelope framing used for client → server requests.

Request IDs SHALL be unique per direction per connection. The receiver SHALL route incoming requests to a registered handler map and send back a `kind: 'response'` with matching `id`.

#### Scenario: server sends request to summoner and receives response

- **WHEN** server sends `{ kind: 'request', id: 'r-1', event: 'fs/readFileAbsolute', data: { absolutePath: '/tmp/a.txt' } }` to a summoner peer
- **THEN** the summoner SHALL process the request and reply with `{ kind: 'response', id: 'r-1', ok: true, data: { content: '...' } }`

#### Scenario: server request to summoner times out

- **WHEN** server sends a request to a summoner peer and no response arrives within the configured timeout (default 30s)
- **THEN** the pending promise SHALL reject with a timeout error
- **AND** the pending entry SHALL be cleaned up

#### Scenario: summoner returns error for unknown method

- **WHEN** server sends a request with an unknown `event` to a summoner peer
- **THEN** the summoner SHALL reply with `{ kind: 'response', id: '...', ok: false, error: 'Unknown method: ...' }`

### Requirement: Peers SHALL register request handlers via a handler map

Each Envelope-speaking peer (browser client, summoner daemon) SHALL maintain a handler map keyed by event name. When an incoming `kind: 'request'` envelope arrives, the peer SHALL look up the handler by `event`, invoke it with `data`, and send back a `kind: 'response'` with the result or error.

If no handler is registered for the event, the peer SHALL respond with `{ ok: false, error: 'Unknown method: <event>' }`.

#### Scenario: summoner registers fs/readFileAbsolute handler

- **GIVEN** a summoner daemon has registered a handler for `fs/readFileAbsolute`
- **WHEN** an incoming request envelope with `event: 'fs/readFileAbsolute'` arrives
- **THEN** the handler SHALL be invoked with the request's `data` as params
- **AND** the handler's return value SHALL be sent back as `{ kind: 'response', ok: true, data: <result> }`

#### Scenario: handler throws returns error response

- **GIVEN** a registered handler that throws an Error
- **WHEN** the handler is invoked via an incoming request
- **THEN** the peer SHALL respond with `{ kind: 'response', ok: false, error: <error message> }`

### Requirement: Notification events SHALL be fire-and-forget without response

The Envelope `kind: 'event'` SHALL continue to serve as fire-and-forget notification from either direction. Server-to-peer events (e.g., `process/stdout` notifications from summoner to server) SHALL use `kind: 'event'` with no `id` and no expected response.

#### Scenario: summoner sends process/stdout notification to server

- **WHEN** a spawned process on the summoner emits a stdout line
- **THEN** the summoner SHALL send `{ kind: 'event', seq: N, event: 'process/stdout', data: { sessionId, line } }` to the server
- **AND** the server SHALL NOT send a response envelope for this event
