## Tasks

### 1. Shared schemas
- [ ] Add `openspecArchivePayloadSchema` (`{cwd, name, skipSpecs?: boolean}`) and `openspecArchiveResultSchema` (`{ok:true} | {error}`).
- [ ] Add `openspec:archive` to `EVENTS.openspec` and `ClientToServerEvents`.

### 2. Summoner — LocalOpenspecService.archive (TDD)
- [ ] Test: spawns `openspec archive <name> -y` in cwd; returns `{ok:true}` on exit 0.
- [ ] Test: with `skipSpecs:true`, args become `archive <name> -y --skip-specs`.
- [ ] Test: non-zero exit → `{error: <stderr>}`.
- [ ] Test: invalid slug → `{error:'invalid-name'}`, no spawn.
- [ ] Test: missing ProcessProvider → `{error:'process-runner-unavailable'}`.
- [ ] Implementation: extend `OpenspecService` interface, `LocalOpenspecService`, `FakeOpenspecService` (with `archiveCalls` + `setArchiveError`).

### 3. Server handler (TDD via FakeSummoner)
- [ ] Test: handler delegates to `openspecService.archive` with parsed payload + cwd guard.
- [ ] Implementation: register `openspec:archive` in `openspec.ts` handler.

### 4. Client OpenspecContext (TDD)
- [ ] Test: `archive(cwd, name)` round-trips and returns `{ok:true}`.
- [ ] Test: `archive(cwd, name, {skipSpecs:true})` forwards the flag.
- [ ] Implementation: add `archive` action to `useOpenspecActions()`.

### 5. ArchiveChangeDialog (TDD)
- [ ] New component `ArchiveChangeDialog` (Radix Dialog): name, warning copy, `Skip spec update` checkbox (off by default), Cancel + Archive (`variant="danger"`).
- [ ] Test: Cancel closes dialog without firing RPC.
- [ ] Test: Archive submits with default `skipSpecs:false`.
- [ ] Test: toggling checkbox forwards `skipSpecs:true`.
- [ ] Test: server error keeps dialog open.

### 6. SpecPane integration (TDD)
- [ ] Test: complete change row renders `Archive` button alongside `Ready` badge.
- [ ] Test: in-progress / no-tasks rows do not render `Archive`.
- [ ] Test: clicking Archive opens dialog scoped to that change name.
- [ ] Implementation: add the button + dialog wiring in `SpecPane.tsx`.

### 7. Verification
- [ ] Full vitest run green across summoner / server / client.
- [ ] `openspec validate spec-pane-archive-action --strict`.
- [ ] Manual smoke: archive a complete change in this repo with and without skip-specs.
