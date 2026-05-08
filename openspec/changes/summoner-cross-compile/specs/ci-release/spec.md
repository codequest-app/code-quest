## ADDED Requirements

### Requirement: Push to main SHALL trigger summoner release build

A GitHub Actions workflow SHALL run when code is pushed to `main` and files under `apps/summoner/` or `packages/shared/` have changed.

#### Scenario: Summoner code changed
- **WHEN** a commit is pushed to `main` that modifies files in `apps/summoner/`
- **THEN** the release workflow SHALL trigger

#### Scenario: Shared package changed
- **WHEN** a commit is pushed to `main` that modifies files in `packages/shared/`
- **THEN** the release workflow SHALL trigger

#### Scenario: Unrelated changes
- **WHEN** a commit is pushed to `main` that only modifies files outside `apps/summoner/` and `packages/shared/`
- **THEN** the release workflow SHALL NOT trigger

### Requirement: Workflow SHALL produce executables for 5 platforms

The workflow SHALL build summoner executables for: `darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `windows-x64`.

#### Scenario: All 5 executables are produced
- **WHEN** the release workflow completes successfully
- **THEN** the following files SHALL be produced:
  - `summoner-darwin-arm64`
  - `summoner-darwin-x64`
  - `summoner-linux-x64`
  - `summoner-linux-arm64`
  - `summoner-windows-x64.exe`

### Requirement: Obfuscation SHALL be performed once before cross-compilation

The workflow SHALL run `build.ts` (bundle + obfuscation) once to produce `dist/main.js`, then cross-compile that single obfuscated JS file to 5 platform targets.

#### Scenario: Single obfuscation step
- **WHEN** the build runs
- **THEN** `javascript-obfuscator` SHALL execute exactly once
- **AND** all 5 platform executables SHALL contain the same obfuscated code

### Requirement: Executables SHALL be uploaded to GitHub Releases

The workflow SHALL create or update a GitHub Release with tag `latest` and attach all 5 executables.

#### Scenario: Release created on first run
- **WHEN** the workflow runs and no `latest` release exists
- **THEN** a new release with tag `latest` SHALL be created with all 5 executables

#### Scenario: Release updated on subsequent runs
- **WHEN** the workflow runs and a `latest` release already exists
- **THEN** the existing release SHALL be updated with new executables

### Requirement: build.ts SHALL support cross-compile targets

`build.ts` or a companion script SHALL accept target parameters to produce platform-specific executables from the obfuscated `dist/main.js`.

#### Scenario: Compile for specific target
- **WHEN** `bun build dist/main.js --compile --target=bun-linux-x64 --outfile dist/summoner-linux-x64` is executed
- **THEN** a Linux x64 executable SHALL be produced
