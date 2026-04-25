## 1. PluginCliService in summoner (TDD, async-only)
- [ ] 1.1 Red: `packages/summoner/src/__tests__/claude/plugin-cli.test.ts` — `run(args)` resolves with stdout/stderr/ok; cleans up tmpdir on success and on error.
- [ ] 1.2 Green: implement `PluginCliService` interface (single `run` method) + `LocalPluginCliService`. Always use the tmpdir-scratch flow (no sync path).
- [ ] 1.3 Add `FakePluginCliService` in `packages/summoner/src/test/` — programmable per-args responses.
- [ ] 1.4 Re-export from `packages/summoner/src/index.ts` and `summoner/test`.

## 2. DiffFileReader in summoner (TDD)
- [ ] 2.1 Red: `packages/summoner/src/__tests__/filesystem/diff-reader.test.ts` — reads any absolute path; returns `''` when file missing; explicitly does NOT consult fsRoots.
- [ ] 2.2 Green: implement `DiffFileReader` interface + `LocalDiffFileReader`.
- [ ] 2.3 Add `FakeDiffFileReader` in `packages/summoner/src/test/`.
- [ ] 2.4 Re-export from index + test barrel.

## 3. Server: inject PluginCliService
- [ ] 3.1 Identify all consumers of `runPluginCommand` / `runPluginCommandAsync`. Known: `socket/claude/plugin.ts:62, 122` (sync); audit for others.
- [ ] 3.2 Update `HandlerContext` (`packages/server/src/types.ts`) to include `pluginCli: PluginCliService`.
- [ ] 3.3 DI container (`packages/server/src/container.ts`): bind `PluginCliService` to `LocalPluginCliService`.
- [ ] 3.4 Refactor each consumer to `await ctx.pluginCli.run(...)`. Sync call sites in `socket/claude/plugin.ts` become async — propagate `await` outward (the enclosing handler is already async).
- [ ] 3.5 Existing server tests (`__tests__/plugin-command.test.ts`, `__tests__/plugin.test.ts`): swap real impl + `vi.spyOn(claudeCli, ...)` for `FakePluginCliService` via container override.
- [ ] 3.6 Delete `packages/server/src/socket/claude/cli.ts` and its test `plugin-command.test.ts` (covered by summoner's plugin-cli test).

## 4. Server: inject DiffFileReader
- [ ] 4.1 Update `HandlerContext` to include `diffReader: DiffFileReader`.
- [ ] 4.2 DI container: bind to `LocalDiffFileReader`.
- [ ] 4.3 `permission.ts`: drop `import { readFile } from 'node:fs/promises'`; replace `readFileOrEmpty` with `ctx.diffReader.read(path)` (the service already returns `''` on error).
- [ ] 4.4 Existing permission test: use `FakeDiffFileReader` to seed diff content.

## 5. Verify zero regression
- [ ] 5.1 `grep -rn "node:fs\|node:child_process" packages/server/src` — only matches: `bin/server.ts` (existsSync), `db/sqlite-client.ts` (mkdirSync). Document this as the expected residual.
- [ ] 5.2 `pnpm test` — all packages green.
- [ ] 5.3 `pnpm lint` clean.

## 6. Finalize
- [ ] 6.1 Commit: `refactor(summoner): move plugin CLI + diff reader from server`
