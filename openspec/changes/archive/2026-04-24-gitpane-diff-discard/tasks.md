# tasks

## Phase 1 — shared schemas + events

- [ ] `shared/schemas/git.ts`: `gitDiscardFilePayloadSchema` (cwd, file),
  `gitDiscardFileResultSchema` (`{ ok: true } | { error }`).
- [ ] Export from `schemas/index.ts`.
- [ ] Register `git:discardFile` in `shared/socket-events.ts` +
  `EVENTS.git.discardFile` map key.

## Phase 2 — Summoner GitService

- [ ] Add `discardFile(cwd, file)` to `GitService` interface.
- [ ] `LocalGitService`: shell `git checkout -- <file>`; propagate
  stderr on non-zero exit.
- [ ] `FakeGitService`: `setDiscardError(err | null)` knob;
  `discardFile` returns `{ ok }` or `{ error }`.

## Phase 3 — Server handler

- [ ] Red test `git.test.ts`: `git:discardFile` happy path.
- [ ] Red test: payload validation fails on missing file.
- [ ] Red test: `ensureWithinRoots` rejection surfaces as error.
- [ ] Implement handler.

## Phase 4 — Client

- [ ] `useGitActions()`: add `discardFile(cwd, file)` RPC wrapper.
- [ ] `DiffModal`: new prop `onDiscard?: () => void | Promise<void>` +
  new prop `canDiscard: boolean` (false for untracked files).
  - Two-click confirm: first click swaps button label to `Confirm?`
    for 3s, second click within window actually calls `onDiscard`.
  - Disabled (with title hint) when `canDiscard === false`.
- [ ] `GitPane`: pass `onDiscard` that calls
  `discardFile(cwd, file.file)` + toast; pass `canDiscard` derived
  from the clicked file's status (not `'??'`).
- [ ] Red test `DiffModal.test.tsx`: Discard button renders, two-click
  confirms.
- [ ] Red test `GitPane.test.tsx`: clicking through Discard calls
  `git.discardFile` with the right cwd + file path.
- [ ] Red test: untracked file (`'??'`) shows Discard as disabled.

## Phase 5 — verify

- [ ] Full client vitest + tsc green.
- [ ] Full server vitest + tsc green.

## Out (not this change)

- `gitpane-stage-hunk`: hunk selection UI + sub-patch generation +
  `git apply --cached`. Needs a design round for multi-hunk files.
