## 1. Implementation

- [x] 1.1 Import `flushSync` from `react-dom` in `packages/client/src/contexts/channel/ChannelComposeContext.tsx`
- [x] 1.2 In `submit`, wrap the `setState({ value: '', slashOpen: false })` call with `flushSync(() => ...)` before the `if (files.length > 0) { ... } else { ... }` branch
- [x] 1.3 Leave `sendMessage` / `setChannelState` at default React priority (no `startTransition`)
- [x] 1.4 Leave socket emit unchanged

## 2. Tests

- [x] 2.1 Existing `ComposeInput.test.tsx` (15 tests) continues to pass — covers Enter-to-clear, multi-line, processing state, and mention/slash interactions unchanged by this change

## 3. Verification

- [x] 3.1 `pnpm --filter client exec tsc --noEmit` passes
- [x] 3.2 `pnpm exec vitest run src/components/__tests__/ComposeInput.test.tsx` passes (15/15)
- [x] 3.3 Biome / lint clean via pre-commit hook
- [ ] 3.4 Manual: on a long conversation, press Enter → textarea clears instantly, new message appears promptly on the next commit (no empty-then-pop lag)
- [x] 3.5 Git diff: only `ChannelComposeContext.tsx` + openspec artifacts
