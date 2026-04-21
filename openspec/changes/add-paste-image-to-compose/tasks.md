## 1. Implement paste handler

- [x] 1.1 Add `onPaste: ClipboardEventHandler<HTMLTextAreaElement>` wiring on the `<textarea>` in `ComposeInput.tsx`
- [x] 1.2 Inside the handler, iterate `e.clipboardData.items` and collect items where `kind === 'file'` and `type.startsWith('image/')` via `getAsFile()`
- [x] 1.3 If the collected list is non-empty: `e.preventDefault()` and call `compose.addAttachments(files)` from the existing `useChannelCompose()` hook
- [x] 1.4 If no image items were collected: do nothing, let default paste occur

## 2. Tests

- [x] 2.1 Add a `PasteImage` Storybook story in `ComposeInput.stories.tsx` with a play function that dispatches a paste event carrying a fake `File` and asserts the attachment chip renders
- [x] 2.2 Add a `PasteText` story that pastes plain text and asserts the textarea value updated (default behavior) and no attachment chip appears
- [x] 2.3 If existing `ComposeInput.test.tsx` is the canonical place, mirror both cases there using `fireEvent.paste` with a stub `clipboardData`

## 3. Verification

- [x] 3.1 `pnpm --filter client exec tsc --noEmit` passes
- [x] 3.2 Biome / lint passes (pre-commit hooks)
- [x] 3.3 `pnpm --filter client test` passes (unit + storybook tests)
- [x] 3.4 Manual: screenshot → Cmd+V in Storybook dev → chip appears, textarea unchanged
- [x] 3.5 Manual: copy plain text → Cmd+V → text inserted at cursor, no chip
- [x] 3.6 Git diff is confined to `ComposeInput.tsx`, its tests/stories, and openspec — no other production changes
