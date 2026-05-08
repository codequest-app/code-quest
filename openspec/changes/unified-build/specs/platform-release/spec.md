## ADDED Requirements

### Requirement: GitHub Actions SHALL produce per-platform release zips

A `release.yml` workflow SHALL build and upload platform-specific zip archives to GitHub Releases.

#### Scenario: Matrix build on push to main
- **WHEN** a commit is pushed to `main` with relevant path changes
- **THEN** GitHub Actions SHALL run builds on linux-x64, linux-arm64, darwin-arm64, windows-x64

#### Scenario: Release zip contains server, web, and summoner
- **WHEN** a platform build completes
- **THEN** the zip SHALL contain `server/` directory with bin, migrations, public, package.json, and node_modules
- **AND** the zip SHALL contain the summoner binary for that platform

#### Scenario: Release zip is self-contained
- **WHEN** a user extracts the zip on the matching platform
- **THEN** `node server/bin/server.js` SHALL start the application without requiring `npm install`
- **AND** web UI SHALL be served from `server/public/`

#### Scenario: Native modules match target platform
- **WHEN** `npm install` runs on a GitHub Actions runner
- **THEN** better-sqlite3 SHALL use prebuilt binaries for that runner's platform
- **AND** the resulting `node_modules/` SHALL be included in the zip

### Requirement: Server code in release SHALL be obfuscated

Release builds SHALL use `build:release` to produce obfuscated server code.

#### Scenario: Release uses build:release
- **WHEN** the release workflow builds the server
- **THEN** it SHALL run `pnpm --filter server build:release`
- **AND** dist JS files SHALL be obfuscated
