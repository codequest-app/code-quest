## 1. Decouple `cwd` from `launchOnMount` (TDD — must come first)

The current `cwd === undefined` sentinel for "do not launch" must be replaced before populating cwd, otherwise resume + fork double-spawn channels.

- [x] 1.1 Red: `TabContext` test — `createNewTab({cwd})` produces `tabs[id].launchOnMount === true`; sessions-sync `addTab` produces `tabs[id].launchOnMount === false`.
- [x] 1.2 Green: add `launchOnMount: boolean` to `TabMeta` (default false). `createNewTab` sets it true; sync path leaves it false.
- [x] 1.3 Red: `ChannelProvider` test — given `<ChannelProvider cwd="/x" launchOnMount={false}>`, NO `session:launch` is emitted; given `launchOnMount={true}`, exactly one is emitted.
- [x] 1.4 Green: change `ChannelProvider` launch gating from `if (!cwd) return` to `if (!launchOnMount) return`. Initial state derives from `launchOnMount` (not cwd).
- [x] 1.5 Wire `TabContainer` → pass `launchOnMount={meta.launchOnMount}` to `<TabContent>` → `<ChannelProvider>`.

## 2. Populate cwd in TabContext sync (TDD)

Now safe to flip the existing two tests that codified the bug.

- [x] 2.1 Update existing test `creates tab without cwd from session (cwd only for new sessions via createNewTab)`: rename + flip expect to `'/my/project'`. Document why this was wrong.
- [x] 2.2 Update existing test `session sync does not store cwd (cwd only for createNewTab)`: rename + flip expect to `'/projects/app'`.
- [x] 2.3 Both should now FAIL (RED).
- [x] 2.4 Green: change `actions.addTab(s.channelId)` → `actions.addTab(s.channelId, s.cwd)` at TabContext.tsx:194 and check `replaceActiveTab` branch (line 191) for the same drop.
- [x] 2.5 Add fork integration test: parent `/projA` → `forkSession()` → new tab carries `/projA` AND launchOnMount=false.

## 2. ChannelMetaContext (TDD)
- [x] 2.1 Red: `ChannelMetaContext.test.tsx` — `useChannelMeta()` returns `{channelId, cwd}`; throws when used outside provider.
- [x] 2.2 Green: implement provider + hook in `apps/web/src/contexts/channel/ChannelMetaContext.tsx`.
- [x] 2.3 Wire into `ChannelProvider`: replace `<ChannelIdProvider channelId={...}>` with `<ChannelMetaProvider channelId={...} cwd={cwd}>`. Keep `useChannelId()` working (read from meta).
- [x] 2.4 Decision: keep `useChannelId()` as a thin selector over `useChannelMeta()`, or deprecate. Prefer keep — many existing call sites only need channelId and don't need to re-render on cwd change.

## 3. Migrate streaming open_file (TDD)
- [x] 3.1 Red: streaming handler test — `open_file` tool with `file_path: '/repo/src/foo.ts'` triggers `fs:read` (not `file:read`); response sets `fileContent`.
- [x] 3.2 Green: `streaming.ts:166` — replace `EVENTS.file.read` + `{channelId, filePath}` with `EVENTS.fs.read` + `{path: filePath}`. Replace `fileReadResponseSchema` with `fsReadResponseSchema`.
- [x] 3.3 Regression test: out-of-cwd absolute path (e.g. `/tmp/x.txt`) inside fsRoots succeeds (was rejected by old `..` traversal check).

## 4. Migrate file:list → fs:search (TDD)
- [x] 4.1 Red: `searchFiles` test — calling `searchFiles('foo')` emits `fs:search` with `{cwd, pattern: 'foo'}`.
- [x] 4.2 Green: `channel/handlers/file.ts` — drop `channelId` from `FileActionsDeps`, take `cwd` (or read from `useChannelMeta` at the consumer). `searchFiles` uses `EVENTS.fs.search` + `{cwd, pattern}`.
- [x] 4.3 Update `ChannelMessagesContext.tsx` callsite of `createFileActions` to pass `cwd` (from `useChannelMeta()`).

## 5. Delete server file handler + protocol surface
- [x] 5.1 Delete `apps/server/src/socket/handlers/file.ts`.
- [x] 5.2 Drop `file.create(ctx)` from `socket/server.ts`.
- [x] 5.3 Drop `'file:read'` / `'file:list'` from `socket-events.ts` (`EVENTS.file.*`, `ClientToServerEvents` interface).
- [x] 5.4 Delete `packages/shared/src/schemas/file.ts`. Remove re-exports from `shared/schemas/index.ts`.
- [x] 5.5 Move any non-redundant assertions from `__tests__/file.test.ts` into `__tests__/fs.test.ts` (if they aren't already covered). Delete the old test file.

## 6. Verify
- [x] 6.1 `pnpm test` — server, client, summoner all green.
- [x] 6.2 `pnpm lint` clean.
- [x] 6.3 `grep -rn "EVENTS.file\." packages` returns nothing in production code.
- [x] 6.4 Manual smoke: open a chat, trigger Read tool on a `/tmp` path inside fsRoots, confirm preview renders (was broken before).

## 7. Finalize
- [x] 7.1 Commit in 4 logical chunks:
  - `fix(tabs): preserve cwd from session sync (resume + fork)`
  - `feat(channel): ChannelMetaContext exposes {channelId, cwd}`
  - `refactor(channel): use cwd-scoped fs:read / fs:search; drop file:* protocol`
  - `chore(server): delete duplicate file handler + schemas`
- [x] 7.2 PR description references this proposal.
