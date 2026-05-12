## 1. fs/list + fs/read root guard

- [ ] 1.1 Add `this.guardPath(cwd)` as first line of `listFiles(cwd, pattern)` in `local.ts`
- [ ] 1.2 Add `this.guardPath(cwd)` (return error on violation) to `readFile(cwd, filePath)` in `local.ts`
- [ ] 1.3 Write security tests: `listFiles` with outside-roots cwd, `../../` cwd, valid cwd; `readFile` with outside-roots cwd, filePath escape, valid case

## 2. Symlink escape detection in LocalRootGuard

- [ ] 2.1 Add async `isWithinRootsReal(path: string): Promise<boolean>` to `LocalRootGuard` using `fs.realpath()` before the relative-path check; deny on realpath error
- [ ] 2.2 Add async `guardPathReal(path: string): Promise<string>` to `LocalFilesystemService` that calls `isWithinRootsReal`
- [ ] 2.3 Replace `this.guardPath()` with `await this.guardPathReal()` in `readFileAbsolute`, `readFile`, and `listFiles`
- [ ] 2.4 Write symlink tests: symlink-inside-root-pointing-outside is denied; normal path inside root passes; non-existent path denied

## 3. git diff untracked path guard

- [ ] 3.1 In `git/commands.ts diff()`, before `readFile(resolve(cwd, filePath))`, compute `relative(cwd, resolve(cwd, filePath))` and return empty diff if it starts with `..`
- [ ] 3.2 Write tests: `diff` with `../../etc/passwd` filePath returns `{ diff: '' }`; normal untracked file returns pseudo-diff

## 4. Wire LocalWatchService in summoner daemon

- [ ] 4.1 In `summoner/main.ts`, construct `new LocalWatchService()` and pass as third argument to `new LocalFilesystemService(config.fsRoots, rootGuard, watchService)`
- [ ] 4.2 Verify existing `LocalFilesystemService` tests still pass (cache invalidation tests use injected watcher)

## 5. Reject duplicate sessionId in Agent

- [ ] 5.1 In `agent.ts` spawn handler, check `this.spawned.has(p.sessionId)` before spawning; if true, abort new handle and return `{ ok: false, error: 'sessionId already active' }`
- [ ] 5.2 Write lifecycle tests: duplicate spawn returns error and leaves original running; after process exit, same sessionId can be reused

## 6. Verification

- [ ] 6.1 All existing summoner tests pass (`pnpm --filter @code-quest/summoner test --run`)
- [ ] 6.2 All server tests pass (`pnpm --filter @code-quest/server test --run`)
