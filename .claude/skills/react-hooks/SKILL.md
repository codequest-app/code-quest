---
name: react-hooks
description: React hooks and Context conventions for this project. Covers custom hook extraction rules, Context splitting (state vs actions), dependency management with biome useExhaustiveDependencies, and ref/callback patterns. Use when writing or reviewing custom hooks, Context providers, or component re-render optimization.
---

# React Hooks Best Practices

## Overview

Guidelines for writing custom hooks, choosing the right hook, and avoiding common pitfalls. Optimized for React 19 + biome `useExhaustiveDependencies`.

## When to Use

- Creating or modifying custom hooks
- Deciding whether to use `useEffect`, `useMemo`, `useCallback`
- Debugging stale closures, infinite loops, or unnecessary re-renders
- Fixing biome/eslint exhaustive-deps warnings

---

## Custom Hook Design

### When to Extract a Custom Hook

**Rule: only extract when there is actual duplication.** Two or more components must share the same stateful logic before a hook is worth creating. A single consumer → keep the logic inline. Extracting a hook "for organization" with only one caller is over-engineering.

```ts
// Good: reusable across components
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

### Naming & Return Values

- Always prefix with `use`
- Return **object** for 3+ values, **tuple** for 1-2 values
- Return stable references: actions via `useCallback`, derived data via `useMemo`

```ts
// Tuple for simple hooks
function useToggle(initial = false): [boolean, () => void] { ... }

// Object for complex hooks
function useChat(socket: TypedSocket) {
  return { sendMessage, abort, createSession };
}
```

### Composition Over Complexity

Build complex hooks by composing simpler ones. Each hook should have a single responsibility.

```ts
// Good: composed
function useChatPanel(socket: TypedSocket) {
  const chat = useChat(socket);
  const store = useChannel((s) => ({ messages: s.messages, status: s.status }));
  return { ...chat, ...store };
}
```

---

## You Might Not Need an Effect

Most `useEffect` calls fall into two categories — **only one needs useEffect**.

### Don't Need useEffect

| Pattern | Instead |
|---------|---------|
| Transform data for render | Compute during render (`const x = derive(props)`) |
| Cache expensive computation | `useMemo(() => compute(deps), [deps])` |
| Reset state when prop changes | Use `key` prop on component |
| Respond to user event | Handle in event handler directly |
| POST on form submit | Handle in `onSubmit`, not in effect |
| Initialize app once | Module-level code or `useRef` guard |

```ts
// Bad: useEffect to filter
const [filtered, setFiltered] = useState(items);
useEffect(() => {
  setFiltered(items.filter(predicate));
}, [items]);

// Good: derive during render
const filtered = useMemo(() => items.filter(predicate), [items]);
```

### Do Need useEffect

- Synchronize with **external systems** (DOM APIs, WebSocket, timers, third-party libs)
- Subscribe/unsubscribe to events (always return cleanup)

```ts
// Good: external system sync
useEffect(() => {
  socket.on('chat:event', onEvent);
  return () => { socket.off('chat:event', onEvent); };
}, [socket]);
```

---

## Context Best Practices — Split State and Actions

### Two-Context Pattern (Required for Complex Providers)

When a context has both state (changes frequently) and actions (stable functions), **split them into separate contexts**. This prevents components that only call actions from re-rendering when state changes.

```tsx
// ✅ Good: separate contexts
const StateContext = createContext<State | null>(null);
const ActionsContext = createContext<Actions | null>(null);

function Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Actions are stable — only depend on dispatch (which is stable)
  const actions = useMemo(() => ({
    sendMessage: (msg: string) => dispatch({ type: 'SEND', msg }),
    abort: () => dispatch({ type: 'ABORT' }),
  }), [dispatch]);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}

// Consumers pick what they need
function SendButton() {
  const { sendMessage } = useActions(); // stable — no re-render on state change
  return <button onClick={() => sendMessage('hi')}>Send</button>;
}

function MessageList() {
  const { messages } = useState(); // re-renders when messages change
  return <ul>{messages.map(m => <li key={m.id}>{m.content}</li>)}</ul>;
}
```

### When NOT to Split

- Simple contexts with <5 fields and few consumers
- Contexts where every consumer needs both state and actions
- Prototyping / early development (split when performance matters)

### UI state vs Data state

UI-only state (toggle 開關、dialog open、hover) 獨立放 UI context，不混進 data context。Data context 改動觸發的 re-render 不該影響「我剛打開一個 dropdown」這種純 UI 狀態。

### Component 職責

- Socket / RPC 呼叫走 Context action（handler），component 只呼叫 action — 不在 component 直接 `socket.emit(...)`
- Component 讀多個 context 只是為了把 props 橋接給子 component → 讓子 component 自己讀 context，父不必中介

### Don't Pass Class Instances

Avoid passing class instances directly as context values. Class methods lose `this` binding when destructured. Use `.bind()` or arrow functions in `useMemo`:

```tsx
// ❌ Bad: class instance — methods lose `this` on destructure
<Context.Provider value={handler}>

// ✅ Good: bind once in useMemo
const actions = useMemo(() => ({
  send: handler.send.bind(handler),
  abort: handler.abort.bind(handler),
}), [handler]);
```

### `useReducer` dispatch is Stable

`useReducer` returns a stable `dispatch` — React guarantees it never changes. No need for `useCallback` or `useMemo` around dispatch.

```tsx
const [state, dispatch] = useReducer(reducer, init);
// dispatch is stable — safe to use in deps without causing re-creation
```

### Context Value Stability

With React Compiler, no manual memoization needed:

```tsx
// ✅ Good (React Compiler handles it)
<Ctx.Provider value={{ count, increment }}>
```

---

## useCallback & useMemo — Don't Use (React Compiler)

**This project uses React Compiler.** Manual `useCallback`/`useMemo` is NOT needed and should NOT be added.

### React Compiler handles memoization automatically

React Compiler auto-memoizes components, hooks, and values at build time. Writing `useMemo` or `useCallback` is **redundant** and adds unnecessary noise. The compiler does it better because it memoizes at a granular level that manual hooks cannot achieve.

### Rules

1. **Never add `useMemo` or `useCallback`** — write plain functions and values
2. **Never add `React.memo()`** — compiler handles component memoization
3. **Context Provider values** — no need to memoize; compiler optimizes re-renders
4. **If you see existing `useMemo`/`useCallback`** — remove them during refactoring
5. **Derive during render** — `const filtered = items.filter(pred)` is correct and optimal

### Examples

```tsx
// ✅ Correct (React Compiler project)
function Provider({ children }) {
  const [state, setState] = useState(init);
  const actions = createActions(setState);  // no useMemo needed
  return (
    <Ctx.Provider value={{ ...state, ...actions }}>  {/* no useMemo needed */}
      {children}
    </Ctx.Provider>
  );
}

// ❌ Wrong (unnecessary manual memoization)
const actions = useMemo(() => createActions(setState), [setState]);
const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
```

---

## Refs and Dependency Arrays

### Biome `useExhaustiveDependencies` Rules

Biome treats **any component-scoped variable** as a potential dependency. Only these are recognized as stable (excluded from deps):

- `useRef()` return value
- `useState()` setter (second element)
- `useReducer()` dispatch (second element)
- `useTransition()` startTransition (second element)

### Avoiding False Positives

```ts
// Problem: component-scoped function flagged by biome
function useChat(socket) {
  const ref1 = useRef(false);
  const ref2 = useRef(false);

  // Bad: biome flags resetAll as missing dep
  const resetAll = () => { ref1.current = false; ref2.current = false; };
  useEffect(() => { resetAll(); }, [socket]); // warning!

  // Good: module-level function, takes refs as params
  // (defined OUTSIDE the hook)
  useEffect(() => { resetRefs(ref1, ref2); }, [socket]); // no warning
}

// Module-level — invisible to biome's dep analysis
function resetRefs(...refs: MutableRefObject<boolean>[]) {
  for (const ref of refs) ref.current = false;
}
```

### Zustand `getState()` in Hooks

`useChannel.getState()` inside callbacks is fine — it reads latest state without subscribing. No need to add store values to dependency arrays.

```ts
const sendMessage = useCallback((message: string) => {
  const { sessionId, addMessage } = useChannel.getState();
  if (!sessionId) return;
  addMessage(msg({ role: 'user', type: 'text', content: message }));
  socket.emit('chat:send', { sessionId, message });
}, [socket]); // only socket needed
```

---

## Testing Custom Hooks

**Always use `@testing-library/react` as the first choice** — either `renderHook` for isolated hook testing, or `render` + `screen` when testing the hook through a component. Do not call hook functions directly, do not mock React internals.

Use `renderHook` from `@testing-library/react`:

```ts
import { renderHook, act } from '@testing-library/react';

it('toggles value', () => {
  const { result } = renderHook(() => useToggle(false));
  expect(result.current[0]).toBe(false);

  act(() => { result.current[1](); });
  expect(result.current[0]).toBe(true);
});
```

For hooks with external dependencies (socket, API), inject via parameters — avoid `vi.mock` when possible.

---

## Quick Reference

| Rule | Rationale |
|------|-----------|
| Prefix with `use` | React's hook detection relies on naming |
| No conditional hooks | Hooks must be called in same order every render |
| Cleanup in useEffect | Prevent memory leaks, stale subscriptions |
| Derive during render | Avoids unnecessary state + effect cycles |
| Module-level helpers | Avoids biome exhaustive-deps false positives |
| `useRef` for mutable flags | Stable identity, no re-renders, biome-safe |
| `getState()` for store reads in callbacks | No subscription, always fresh, no deps needed |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `useEffect` + `setState` for derived data | Compute during render or `useMemo` |
| Missing cleanup in useEffect | Always return cleanup for subscriptions/timers |
| Component-scoped helper in dep array | Move to module level or inline |
| Wrapping every function in `useCallback` | Only when passed to memoized children or in deps |
| `ref.current` in dep array | Refs are mutable — biome ignores them; use event-based updates |
| Effect runs on every render | Check dependency array; empty `[]` for mount-only |

## 相關 skill

- Context 測試 / socket 互動 → `fake-summoner-client`
- Hook / component 測試 RTL 慣例 → `frontend-testing` / `testing-best-practices`
- Store pattern（zustand 當 state 替代）→ `zustand-state`
- Tailwind class + axis 影響 render → `tailwind-v4`
