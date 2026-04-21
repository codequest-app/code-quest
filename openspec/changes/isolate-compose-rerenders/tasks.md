## 1. Red test

- [x] 1.1 Add `re-render isolation` describe block to `packages/client/src/contexts/__tests__/ChannelComposeProvider.test.tsx` with a `Typer` + `SiblingSpy` harness. Assert `SiblingSpy` render count stays at initial after 5 keystrokes. Confirm test fails against current code.

## 2. Context split

- [x] 2.1 In `packages/client/src/contexts/channel/ChannelComposeContext.tsx`, add `useChannelComposeActions()` that only calls `useContext(ComposeActionsContext)` and throws when used outside the provider.
- [x] 2.2 Re-export `useChannelComposeActions` from `packages/client/src/contexts/channel/index.ts`.
- [x] 2.3 Do NOT export `useChannelComposeState`; only the actions hook has a real consumer.

## 3. Provider stabilization

- [x] 3.1 Move `registerFocus` / `registerMentionTrigger` callbacks into the `useState(() => …)` initializer that already builds `actionsBlock`. Result: `ComposeActionsContext` value is constructed once per provider mount.
- [x] 3.2 Keep `stateValue` as an inline object literal; rely on React Compiler (no `useMemo`).

## 4. Migrate action-only consumers

- [x] 4.1 `packages/client/src/components/ChatPanel.tsx`: swap `useChannelCompose()` → `useChannelComposeActions()` for the `focusTextarea` destructure.
- [x] 4.2 `packages/client/src/components/ChatInputArea.tsx`: swap `useChannelCompose()` → `useChannelComposeActions()` for the `focusTextarea, addAttachments` destructure.

## 5. Mention insertion dedupe

- [x] 5.1 Extract `insertAtMentionSite(text, pos, slashToken)` helper inside `createComposeActions`.
- [x] 5.2 Replace the three inline `@`-insertion string expressions inside `mentionFile()` with calls to the helper.

## 6. Verification

- [x] 6.1 `pnpm --filter @code-quest/client exec vitest run src/contexts/__tests__/ChannelComposeProvider.test.tsx src/components/__tests__/ComposeInput.test.tsx` — all green.
- [x] 6.2 Full client suite green (`pnpm --filter @code-quest/client exec vitest run`).
- [x] 6.3 Confirm no `expect(...)` in existing tests was modified.
