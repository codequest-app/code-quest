# CLAUDE.md

## Project Overview

Code Quest — RPG-style Claude Code experience. pnpm monorepo with two packages:

- **`packages/server`**: Node.js backend (Express + Socket.io + node-pty), manages terminal sessions, AI chat sessions (Claude/Gemini CLI wrappers), and orchestrator
- **`packages/client`**: React frontend (Vite + xterm.js + Zustand)

## Tech Stack

- **Runtime**: Node.js ≥ 20, pnpm ≥ 8
- **Language**: TypeScript (strict mode, `verbatimModuleSyntax`, `.ts` import extensions with `rewriteRelativeImportExtensions`)
- **Server DI**: Inversify 7 — all dependencies resolved through container, no hard `new` for domain services
- **Linter/Formatter**: Biome (single quotes, semicolons, 2-space indent, 100 line width)
- **Git Hooks**: lefthook — pre-commit runs biome + tsc; pre-push runs vitest
- **Test**: Vitest

## Commands

```bash
pnpm lint                  # biome check entire project
pnpm lint:fix              # biome check --write
pnpm test:server           # vitest (server)
pnpm test:client           # vitest (client)
pnpm test:e2e              # playwright (requires real CLI)
pnpm test:e2e:mock         # playwright with MOCK_CLI=true

# Per-package
pnpm --filter server exec tsc --noEmit   # type check server
pnpm --filter server exec vitest run     # run server tests once
pnpm --filter client exec tsc --noEmit   # type check client
```

## Code Style

- Biome enforces all formatting and lint rules — do NOT use ESLint or Prettier
- `noExplicitAny: error`, `noNonNullAssertion: error`
- Use `import type { ... }` for type-only imports (`verbatimModuleSyntax`)
- Use `.ts` extensions in relative imports (e.g., `./types.ts`, not `./types`)

## Server DI Conventions

All factory dependencies go through the Inversify container (`src/container.ts`). Key patterns:

- **Singletons**: `container.bind(TYPES.X).to(XImpl).inSingletonScope()`
- **Factories**: `toDynamicValue` returning a factory function; resolve deps **lazily inside** the returned function (not in the outer callback) so `rebindSync` takes effect immediately
- **No per-instance override**: `ChatSessionOptions` has no factory fields; factories are injected by the container into `ChatSessionDeps`
- **Binding tokens**: defined in `src/types.symbols.ts` as `Symbol.for(...)` constants

### Test DI Pattern

```typescript
// Setup: create container with overrides via createTestContainer
const container = createTestContainer({ processFactory: mockFactory });
const factory = container.get<ChatSessionFactory>(TYPES.ChatSessionFactory);

// Swap dependencies mid-test: rebindSync on the shared container
container.rebindSync<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(newFactory);
// No need to re-resolve — lazy resolution picks up the new binding automatically
```

## Project Structure (server)

```
packages/server/src/
├── chat/           # Chat session, parsers (Claude/Gemini stream-json)
├── terminal/       # Terminal session (node-pty)
├── orchestrator/   # Multi-agent orchestration
├── socket/         # Socket.io handler
├── http/           # Express HTTP server
├── container.ts    # DI container setup
├── types.symbols.ts # Inversify binding tokens
├── server.ts       # Server entry (wires HTTP + Socket.io)
└── test/           # Test helpers (createTestContainer, MockProcess)
```
