## MODIFIED Requirements

### Requirement: Browser WebSocket route includes resumable middleware
The browser WebSocket route SHALL include the `resumable()` middleware in its middleware pipeline, after `auth` and `heartbeat`.

#### Scenario: browser route has resumable middleware
- **WHEN** the server starts with WebSocket transport enabled
- **THEN** the browser route (`/ws`) SHALL be configured with `[auth(...), heartbeat(...), resumable()]` middleware
