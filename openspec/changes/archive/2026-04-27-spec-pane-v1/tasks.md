## 1. Shared schema

- [x] 1.1 Add `packages/shared/src/schemas/spec.ts` — `specListPayload/Result`, `specReadPayload/Result` schemas.
- [x] 1.2 Re-export from `schemas/index.ts`.
- [x] 1.3 Add `EVENTS.spec = { list: 'spec:list', read: 'spec:read' }` + ClientToServerEvents entries in `socket-events.ts`.
- [x] 1.4 `pnpm --filter @code-quest/shared exec tsc --noEmit` — clean.

## 2. Server-side openspec reader + handler (TDD)

- [x] 2.1 Red: add `apps/server/src/services/__tests__/openspec-reader.test.ts` — list returns changes/specs from a fake fs tree; non-existent dir returns empty.
- [x] 2.2 Green: implement `apps/server/src/services/openspec-reader.ts` (delegates to `FilesystemService.browseEntries` + `readFileAbsolute`).
- [x] 2.3 Red: add handler test covering `spec:list` + `spec:read` (path-traversal guard, missing-dir empty result).
- [x] 2.4 Green: implement `apps/server/src/socket/handlers/spec.ts` + register in `server.ts`.
- [x] 2.5 Run server tests — green.

## 3. Client hook + SpecPane (TDD)

- [x] 3.1 Red: `apps/web/src/components/__tests__/SpecPane.test.tsx` — null cwd → empty state, populated → list rendered, click → modal opens.
- [x] 3.2 Green: `useSpecList(cwd)` hook + `<SpecPane>` component.
- [x] 3.3 Run tests — green.

## 4. SpecModal (TDD)

- [x] 4.1 Red: `__tests__/SpecModal.test.tsx` — three tabs for changes (Proposal/Design/Tasks), single body for spec, content fetch, copy path, close actions.
- [x] 4.2 Green: implement `<SpecModal>`.
- [x] 4.3 Run tests — green.

## 5. Wire into RightPane

- [x] 5.1 Red: update `RightPane.test.tsx` — Spec tab renders SpecPane.
- [x] 5.2 Green: swap placeholder.
- [x] 5.3 Run tests — green.

## 6. Verify

- [x] 6.1 `pnpm --filter @code-quest/client exec tsc --noEmit` clean.
- [x] 6.2 `pnpm --filter @code-quest/client exec vitest run` — all pass.
- [x] 6.3 `pnpm --filter @code-quest/server exec vitest run` — all pass.
- [x] 6.4 biome check on touched files.

## 7. Finalize

- [x] 7.1 Commit: `feat(spec-pane): list openspec changes/specs + per-artifact modal`.
