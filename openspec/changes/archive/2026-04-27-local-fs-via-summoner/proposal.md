## Why

Server is supposed to delegate **all** "user-local" operations (filesystem, git, Claude CLI spawn, file watching) to summoner — that's the boundary that makes future remoting (server in cloud, summoner as local agent) a service-binding swap rather than a rewrite.

Audit found **two leaks** still in `apps/server` that touch `node:fs` / `node:child_process` directly against user-local resources:

1. **`apps/server/src/socket/claude/cli.ts`** — uses `spawnSync('claude', ['plugin', ...])` and `execFile` for Claude CLI plugin operations, plus `mkdtempSync` / `readFileSync` / `rmSync` against `os.tmpdir()` to bypass the CLI's stdout-pipe truncation.
2. **`apps/server/src/socket/handlers/permission.ts`** — uses `readFile` to load `originalPath` / `newPath` from `control_request/open_diff`, which the Claude CLI delivers (paths can be commit blobs, scratch files, etc., NOT necessarily inside `fsRoots`).

If server moves to cloud while these remain, both immediately break: `spawn('claude')` ENOENTs in the cloud, and the diff paths refer to the user's local filesystem the cloud server cannot see.

These cannot reuse `FilesystemService` — its `fsRoots` boundary check would (correctly, for its purpose) reject `os.tmpdir()` and arbitrary diff paths. The fix is **two new dedicated summoner services** with explicitly different security models.

## What Changes

### New summoner services

**`PluginCliService`** (`apps/summoner/src/claude/plugin-cli.ts`)
- `run(args: string[]): Promise<{ stdout: string; stderr: string; ok: boolean }>` — async-only. All current sync (`spawnSync`) and async (`execFile` + tmpdir scratch) callers get migrated to this single method.
- The tmpdir-scratch trick (used to bypass Claude CLI's stdout-pipe truncation) becomes the default behavior — every call writes to a temp file and reads back.
- Sync API is intentionally dropped: it forces blocking on the Node event loop and is incompatible with future remoting (ws roundtrip is inherently async).
- Wired through DI like other summoner services. Default impl uses `node:child_process` + `node:fs` + `os.tmpdir()`. A `FakePluginCliService` lives in `summoner/test` for server tests.

**`DiffFileReader`** (`apps/summoner/src/filesystem/diff-reader.ts`)
- `read(path: string): Promise<string>` — reads any absolute path, returns `''` on error (matches current behavior in `permission.ts`).
- Explicitly **bypasses** `fsRoots` validation. Documented as "for IPC-supplied paths only (Claude CLI control_request); never expose to client RPC."
- Default impl uses `node:fs/promises`. `FakeDiffFileReader` for tests.

### Server changes

- `apps/server/src/socket/claude/cli.ts`: delete file. Move call sites in `slash-command-plugins` (or wherever it's used) to consume `PluginCliService` from DI.
- `apps/server/src/socket/handlers/permission.ts`: replace direct `readFile` import with injected `DiffFileReader`. The two `readFileOrEmpty` calls in `onOpenDiff` go through the service.
- DI container (`apps/server/src/container.ts`): bind both new services to their summoner-default implementations.

### Out of scope

- No protocol change yet. This is purely "move local-touching code into summoner so it's swappable."
- ws-based remote agent (the Phase 1–6 plan from earlier discussion) is a separate, larger change. This proposal is the **prerequisite** that makes server's local-dependency surface area zero.
- `bin/server.ts` `existsSync` and `db/sqlite-client.ts` `mkdirSync` stay — those are server's own infra (config check, DB dir), not user-local resources.

## Impact

**Affected specs:** none new — existing summoner spec gains two services.

**New files:**
- `apps/summoner/src/claude/plugin-cli.ts` — `PluginCliService` interface + `LocalPluginCliService` impl
- `apps/summoner/src/filesystem/diff-reader.ts` — `DiffFileReader` interface + `LocalDiffFileReader` impl
- `apps/summoner/src/test/fake-plugin-cli-service.ts`
- `apps/summoner/src/test/fake-diff-file-reader.ts`

**Modified:**
- `apps/summoner/src/index.ts` — re-export new services
- `apps/server/src/socket/handlers/permission.ts` — inject `DiffFileReader`
- `apps/server/src/socket/handlers/<plugins-handler>.ts` — inject `PluginCliService`
- `apps/server/src/container.ts` — bind both
- `apps/server/src/types.ts` (`HandlerContext`) — add fields for both services

**Deleted:**
- `apps/server/src/socket/claude/cli.ts`

**Tests:**
- `apps/summoner/src/__tests__/claude/plugin-cli.test.ts` — local impl smoke
- `apps/summoner/src/__tests__/filesystem/diff-reader.test.ts` — local impl reads + returns `''` on missing
- Server handler tests: switch from real `spawn` / real `readFile` to `Fake*` from summoner

**Risk:** low.
- Pure relocation + DI seam. No behavior change for the user.
- Server tests get faster + more deterministic (no more shelling out to `claude plugin`).
- After this lands, `grep -rn "node:fs\|node:child_process" apps/server/src` returns only `bin/server.ts` and `db/sqlite-client.ts` — both server-infra, both expected.
