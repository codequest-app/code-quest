## MODIFIED Requirements

### Requirement: Server SHALL run in a Docker container

A Dockerfile SHALL produce a production image containing the built server with embedded web static files. The image SHALL support build-arg to control obfuscation and sourcemap.

#### Scenario: Docker build succeeds (default — debug)
- **WHEN** `docker compose build` is executed
- **THEN** a production image SHALL be built with unobfuscated server code and web assets in `dist/public/`

#### Scenario: Docker build with release profile
- **WHEN** `docker build --build-arg BUILD_TARGET=build:release` is executed
- **THEN** server code SHALL be obfuscated

#### Scenario: Docker build with sourcemap
- **WHEN** `docker build --build-arg BUILD_SOURCEMAP=true` is executed
- **THEN** dist/ SHALL contain `.js.map` source map files

#### Scenario: Container starts and serves HTTP
- **WHEN** the server container starts
- **THEN** Express SHALL listen on port 3000
- **AND** WebSocket endpoints `/ws` and `/summoner` SHALL be accessible
- **AND** static files SHALL be served from `dist/public/` without requiring `PUBLIC_DIR` env var

#### Scenario: No separate prod-deps stage needed
- **WHEN** the Dockerfile builds
- **THEN** production node_modules SHALL come from tsup onSuccess's `npm install` inside `dist/`
- **AND** there SHALL be no separate prod-deps stage
