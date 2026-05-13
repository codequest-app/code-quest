## ADDED Requirements

### Requirement: server.sh SHALL auto-download Node.js on first launch

`server/server.sh` SHALL detect the platform and download the correct Node.js binary if `runtime/node` does not exist.

#### Scenario: Node binary missing on Linux x64
- **WHEN** `server.sh` is executed and `runtime/node` does not exist
- **THEN** it SHALL detect `linux-x64` and download from nodejs.org
- **AND** the binary SHALL be placed at `runtime/node` and made executable

#### Scenario: Node binary missing on macOS arm64
- **WHEN** `server.sh` is executed and `runtime/node` does not exist
- **THEN** it SHALL detect `darwin-arm64` and download the correct binary
- **AND** subsequent launches SHALL skip the download

#### Scenario: Node binary already present
- **WHEN** `server.sh` is executed and `runtime/node` already exists
- **THEN** it SHALL skip the download and proceed directly to startup

### Requirement: server.sh SHALL auto-download better-sqlite3 prebuilt on first launch

`server/server.sh` SHALL download the platform-specific `better_sqlite3.node` if it does not exist.

#### Scenario: better-sqlite3 binary missing
- **WHEN** `server.sh` is executed and `better_sqlite3.node` does not exist
- **THEN** it SHALL read the NAPI version from the downloaded node binary
- **AND** download the matching prebuilt from GitHub releases
- **AND** place it at `server/node_modules/better-sqlite3/build/Release/better_sqlite3.node`

#### Scenario: better-sqlite3 binary already present
- **WHEN** `server.sh` is executed and `better_sqlite3.node` already exists
- **THEN** it SHALL skip the download

### Requirement: summoner.sh SHALL auto-download Node.js on first launch

`summoner/summoner.sh` SHALL detect the platform and download Node.js if `runtime/node` does not exist.

#### Scenario: Node binary missing
- **WHEN** `summoner.sh` is executed and `runtime/node` does not exist
- **THEN** it SHALL download the correct Node.js binary for the current platform
- **AND** subsequent launches SHALL skip the download

### Requirement: server.bat and summoner.bat SHALL auto-download on Windows

Windows batch scripts SHALL perform equivalent download logic using `curl` and `powershell`.

#### Scenario: Windows first launch
- **WHEN** `server.bat` is executed on Windows x64 and runtime is missing
- **THEN** it SHALL download Node.js win-x64 zip and extract `node.exe`
- **AND** download better-sqlite3 win32-x64 prebuilt
