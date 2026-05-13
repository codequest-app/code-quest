## MODIFIED Requirements

### Requirement: Summoner SHALL build with bun build targeting node

`pnpm build` in `apps/summoner` SHALL execute `bun build` with `target: 'node'` and produce a JS bundle executable by Node.js.

#### Scenario: Production build produces node-runnable bundle
- **WHEN** `pnpm build` is executed in `apps/summoner`
- **THEN** `dist/main.js` SHALL be produced
- **AND** `node dist/main.js` SHALL start the summoner process without errors

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

## ADDED Requirements

### Requirement: Summoner SHALL have a separate compile script for bun binary

A `compile` script SHALL exist in `apps/summoner` for users who want to produce a native bun binary.

#### Scenario: Compile produces platform binary
- **WHEN** `pnpm compile` is executed in `apps/summoner`
- **THEN** `bun build dist/main.js --compile --outfile dist/summoner` SHALL run
- **AND** a native executable SHALL be produced for the current platform
