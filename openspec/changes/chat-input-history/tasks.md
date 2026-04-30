## 1. Extract module-level history functions

- [x] 1.1 In `ComposeInput.tsx`, add module-level `cycleUp`, `cycleDown`, `push`, `reset` functions that operate on a `{ history: string[]; index: number }` ref value

## 2. Inline history into ComposeInput

- [x] 2.1 Replace `useInputHistory()` call with `useRef<{ history: string[]; index: number }>({ history: [], index: -1 })` and `useRef(false)` for init guard
- [x] 2.2 Add `useEffect` to initialize history from `messages` (filter `role === 'user'`, `content.trim()` non-empty) once when messages first become non-empty
- [x] 2.3 Update `handleHistoryKeyDown` to use module-level functions and add multiline ArrowUp guard (`selectionStart <= value.indexOf('\n')`)
- [x] 2.4 Update submit handler to call module-level `push` instead of `inputHistory.push`

## 3. Delete useInputHistory hook

- [x] 3.1 Delete `packages/client/src/hooks/useInputHistory.ts`
- [x] 3.2 Delete `packages/client/src/hooks/__tests__/useInputHistory.test.ts`

## 4. Tests

- [x] 4.1 Update `ComposeInput.test.tsx` to cover: ArrowUp on single-line triggers history, ArrowUp on multiline non-first-line does not, history initializes from messages prop
