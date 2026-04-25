## 1. LiveSessionPopover (TDD)

- [x] 1.1 Red: `__tests__/LiveSessionPopover.test.tsx` — renders project/branch + state, Open click fires onOpen, Stop click fires onStop only when busy, popover closes on backdrop click.
- [x] 1.2 Green: `<LiveSessionPopover>`.

## 2. Wire ⋯ into TopbarLiveSessions

- [x] 2.1 Red: extend `TopbarLiveSessions.test.tsx` — pill has visible-on-hover ⋯ button; click ⋯ opens popover.
- [x] 2.2 Green: extend pill markup + popover overlay state.
- [x] 2.3 Wire onOpen → existing onActivate; onStop → toast (cancel RPC wired in WorkspaceLayout).

## 3. Verify + commit
