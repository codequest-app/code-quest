## 1. Inventory

- [x] 1.1 Grep `apps/server/src` and `apps/web/src` for project-defined event-name literals (pattern: `['"][a-z]+:[a-z_]+['"]` in `emit`, `on`, `broadcastAll`, `broadcast`, `sendRequest` calls). Produce a list of unique names.
- [x] 1.2 Cross-reference the list with the typed signatures already declared in `packages/shared/src/socket-events.ts` — every literal must map to an existing signature entry.

## 2. Shared constant

- [x] 2.1 Add `export const EVENTS = { … } as const satisfies Record<string, Record<string, string>>` to `packages/shared/src/socket-events.ts`, grouped by namespace, wire-identical to the inventory.
- [x] 2.2 Re-export `EVENTS` from `packages/shared/src/index.ts`.
- [x] 2.3 Type-check shared package (`pnpm --filter @code-quest/shared exec tsc --noEmit`).

## 3. Server migration

- [x] 3.1 Replace literals in `apps/server/src/socket/handlers/**/*.ts` with `EVENTS.<ns>.<name>`.
- [x] 3.2 Replace literals in `apps/server/src/socket/channel-emitter.ts` and any other server socket plumbing.
- [x] 3.3 `pnpm --filter @code-quest/server exec vitest run` — all green, no `expect` modified.

## 4. Client migration

- [x] 4.1 Replace literals in `apps/web/src/contexts/**/*.ts(x)` (socket router + handlers).
- [x] 4.2 Replace literals in `apps/web/src/hooks/**/*.ts(x)` and component-level `socket.emit` call sites.
- [x] 4.3 `pnpm --filter @code-quest/client exec vitest run` — all green.

## 5. Verification

- [x] 5.1 Grep: no remaining `['"][a-z]+:[a-z_]+['"]` literal in `packages/{client,server}/src/**` outside the shared module. (Except documented exemptions — record them in the PR description.)
- [x] 5.2 Run `pnpm -w test` (or equivalent workspace-wide test runner) and confirm everything green.
- [x] 5.3 Skim a high-traffic event round-trip (e.g. `chat:message` or `session:list`) end-to-end and confirm observable behaviour is unchanged.
