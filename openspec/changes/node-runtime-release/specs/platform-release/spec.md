## MODIFIED Requirements

### Requirement: Release SHALL be distributed via git push to release repo

The release repo `codequest-app/release` SHALL contain `server/` and `summoner/` directories pushed by CI after each successful build. GitHub Releases and release.yml workflow are removed.

#### Scenario: CI pushes to release repo after build
- **WHEN** CI completes a successful build on main
- **THEN** it SHALL push updated `server/` and `summoner/` bundles to the release repo
- **AND** each directory SHALL include its own start script (`server.sh`, `server.bat`, `summoner.sh`, `summoner.bat`)

#### Scenario: Release repo does not contain runtime binaries
- **WHEN** a user clones the release repo
- **THEN** `runtime/` SHALL NOT be present
- **AND** `better_sqlite3.node` SHALL NOT be present
- **AND** the start scripts SHALL download them on first launch

#### Scenario: server and summoner are independently deployable
- **WHEN** a user only needs the server
- **THEN** they SHALL only need the `server/` directory and `server.sh`
- **AND** summoner SHALL NOT be required to run server

### Requirement: Server code in release SHALL be obfuscated

Release builds SHALL use `build:release` to produce obfuscated server code.

#### Scenario: Release uses build:release
- **WHEN** CI builds the server
- **THEN** it SHALL run `pnpm --filter server build:release`
- **AND** dist JS files SHALL be obfuscated
