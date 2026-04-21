## Context

`ChannelComposeProvider` exposes two Contexts — `ComposeStateContext` (typing-frequent: `value`, `cursorPos`, `hasText`, `slashOpen`, `mentionOpen`, …) and `ComposeActionsContext` (submit, focus, attachment ops, slash helpers). The only public hook, `useChannelCompose()`, calls `useContext(state) + useContext(actions)` and spreads the result, so every consumer subscribes to both. Keystrokes mutate state → every consumer re-renders, including ones that only care about actions.

React Compiler is enabled (`vite.config.ts` via `@rolldown/plugin-babel` + `reactCompilerPreset()`), so inline Context values and derived objects are auto-memoized when their deps are unchanged. But Context subscription semantics still dictate that any `useContext(ComposeStateContext)` consumer re-renders on state change — Compiler cannot change that.

Two consumers (`ChatPanel`, `ChatInputArea`) use `useChannelCompose()` purely for `focusTextarea` / `addAttachments` and pay the full re-render cost. Typing in long messages becomes visibly laggy because the whole right-side tree recomputes.

## Goals / Non-Goals

**Goals:**
- Components that only use compose actions do not re-render per keystroke.
- Keep `useChannelCompose()` working unchanged for the remaining consumers (`ComposeInput`, `ComposeToolbar`, `CommandMenu`).
- Prove the isolation with a regression test that counts sibling renders during typing.
- Make the refactor small and mechanical; no behavioural change beyond re-render cadence.

**Non-Goals:**
- Moving `value` / `cursorPos` out of Context entirely (would require restructuring `ComposeToolbar` and `CommandMenu`, which both legitimately read typing-derived state).
- Introducing Zustand or an external state manager.
- Adding selector APIs to the compose context.
- Changing the compose protocol, slash-command behaviour, mention-dropdown behaviour, or any public API.

## Decisions

### Split the subscription surface: add `useChannelComposeActions()`

Expose a hook that only calls `useContext(ComposeActionsContext)`. Action-only consumers switch to this hook and stop observing state.

- Alternative 1 — **move `value` to local `useState` in `ComposeInput`**. Rejected: `ComposeToolbar` reads `hasText` and `CommandMenu` reads `slashFilter` / `hasTextBeforeSlash`, all derived from `value`; either they keep re-rendering (no win) or we introduce a broadcast channel inside the component, which is extra machinery.
- Alternative 2 — **adopt a store with selectors (Zustand)**. Rejected: larger migration and unnecessary for the two consumers that actually benefit.
- Alternative 3 — **wrap the existing `useChannelCompose()` in `useMemo`/`useCallback`**. Rejected: Compiler already memoizes; the re-render cause is Context subscription, not object identity.

### Stabilize `ComposeActionsContext` value with a `useState` initializer

Previously `registerFocus` / `registerMentionTrigger` were inline arrow functions recreated every render, and the Provider value was `{ registerFocus, registerMentionTrigger, ...actionsBlock }` — a fresh object every render. Now the full actions object (including the two `register*` callbacks, which only write to refs) is built once in `useState(() => …)`.

This makes the actions Context value referentially stable across re-renders, so consumers that subscribe only via `useChannelComposeActions()` never see a new reference from this Context.

- Alternative — wrap each callback in `useCallback` individually. Rejected: more boilerplate; the one-time initializer is equivalent and matches how `actionsBlock` was already created.

### Keep `stateValue` as an inline object (no `useMemo`)

React Compiler stabilizes inline objects automatically; an explicit `useMemo` is redundant.

### Extract `insertAtMentionSite(text, pos, slashToken)` in `ChannelComposeContext`

`mentionFile()` constructed the `@`-insertion string in three places with identical logic. Extract a single helper that returns the inserted string given a text, cursor position, and optional slash token. Reduces the function's branching noise without changing behaviour.

## Risks / Trade-offs

- [Hook proliferation] New `useChannelComposeActions()` hook adds surface area to the channel contexts barrel. → Mitigated by mirroring the existing `useChannelMessagesActions` convention, and by not exporting an unused `useChannelComposeState` hook (YAGNI).
- [Silent regression on other consumers] If a future edit adds a per-keystroke field to `ComposeActionsContext`, action-only consumers lose isolation. → Mitigated by the re-render regression test: any reference churn in the actions Context fails the test.
- [Compiler reliance] `stateValue` inline-object stability depends on React Compiler being enabled. → Already the project default (`vite.config.ts`); if the Compiler is ever removed, add `useMemo` back.

## Migration Plan

Internal refactor — no data migration, no protocol change, no flag. Two-step rollout:

1. Land `useChannelComposeActions()` + the Provider stabilization + the regression test. Ship.
2. Opportunistically migrate any future action-only consumers to the new hook. Not required for this change.

## Open Questions

None. Scope is intentionally narrow.
