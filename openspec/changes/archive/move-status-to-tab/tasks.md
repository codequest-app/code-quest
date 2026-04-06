## 1. Type changes

- [x] 1.1 Change `ChannelChangeUpdate.status` type from `'default' | 'pending' | 'done'` to `SessionStatus` in `types/chat.ts`
- [x] 1.2 Change `TabMeta.tabStatus` from `'default' | 'pending' | 'done'` to `SessionStatus` in `TabContext.tsx`
- [x] 1.3 Change `TabInfo.status` from `'default' | 'pending' | 'done'` to `SessionStatus` in `TabBar.tsx`

## 2. Wire SessionStatus through onChange

- [x] 2.1 Update `ChannelMessagesContext` onChange to pass real `SessionStatus` instead of mapping to `'default'`
- [x] 2.2 Update `WorkspaceLayout` onChange handler to pass `SessionStatus` to `setTabStatus`

## 3. Update TabBar status display

- [x] 3.1 Replace `statusDot` mapping in `TabBar.tsx` with 6-state `SessionStatus` color mapping
- [x] 3.2 Remove `'done'` checkmark rendering — use dot for all states

## 4. Simplify HeaderBar

- [x] 4.1 Remove status dot and status label from `HeaderBar.tsx`
- [x] 4.2 Remove `statusConfig` and `SessionStatus` import from HeaderBar

## 5. Clean up dead code

- [x] 5.1 Remove `setTabStatus` default value logic and `'pending'`/`'done'` references in `TabContext`
- [x] 5.2 Remove the `useEffect` in `ChannelMessagesContext` that mapped status to `'default'`

## 6. Update tests

- [x] 6.1 Update `TabBar.test.tsx` — test all 6 SessionStatus dot colors
- [x] 6.2 Update `HeaderBar.test.tsx` — verify no status dot/label, keep model/title/Raw tests
- [x] 6.3 Update `TabContext` tests if any reference old tri-state
- [x] 6.4 Update stories for TabBar and HeaderBar

## 7. Integration verification

- [x] 7.1 Run full test suite — all tests pass
