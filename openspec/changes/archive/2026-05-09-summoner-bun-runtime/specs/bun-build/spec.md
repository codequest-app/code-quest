## ADDED Requirements

### Requirement: Summoner SHALL build with bun build

`pnpm build` in `apps/summoner` SHALL execute `bun build src/main.ts --outdir dist --target bun --minify` and produce a single bundled output file in `dist/`.

#### Scenario: Production build produces runnable bundle
- **WHEN** `pnpm build` is executed in `apps/summoner`
- **THEN** `dist/main.js` SHALL be produced
- **AND** `bun run dist/main.js` SHALL start the summoner process without errors

#### Scenario: Workspace dependencies are bundled
- **WHEN** the build runs
- **THEN** `@code-quest/shared` and other workspace dependencies SHALL be inlined into the bundle
- **AND** no external `@code-quest/*` imports SHALL remain in the output

### Requirement: Summoner dev mode SHALL use bun runtime

The `dev` script SHALL execute `bun run --env-file=.env src/main.ts` to run summoner in development mode with TypeScript support and env file loading.

#### Scenario: Dev mode starts successfully
- **WHEN** `pnpm dev` is executed in `apps/summoner`
- **THEN** summoner SHALL start using bun runtime
- **AND** environment variables from `.env` SHALL be loaded

### Requirement: tsup and tsx dependencies SHALL be removed

`tsup`, `tsx`, and their related config files SHALL be removed from `apps/summoner`.

#### Scenario: No tsup artifacts remain
- **WHEN** the migration is complete
- **THEN** `tsup.config.ts` SHALL NOT exist in `apps/summoner`
- **AND** `tsup` and `tsx` SHALL NOT appear in `package.json` dependencies

### Requirement: Vitest SHALL remain as test runner

Tests SHALL continue to use vitest, executed via `bun run vitest run`.

#### Scenario: All existing tests pass under bun runtime
- **WHEN** `pnpm test` is executed in `apps/summoner`
- **THEN** all 546+ tests SHALL pass
- **AND** vitest SHALL be the test framework
