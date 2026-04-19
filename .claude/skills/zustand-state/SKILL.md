---
name: zustand-state
description: >
  Zustand state management patterns including stores, slices, selectors, and middleware.
  Use when creating or modifying zustand stores, optimizing re-renders,
  integrating socket events with state, or testing stores.
---

# Zustand State Management

## Store Creation

Prefer `create` for React-bound stores. Use `createStore` (vanilla) only when sharing state outside React (e.g., initializing from a socket listener module).

```ts
// stores/useCounterStore.ts
import { create } from 'zustand';
import { devtools, immer } from 'zustand/middleware';

interface CounterState {
  count: number;
  increment: () => void;
}

export const useCounterStore = create<CounterState>()(
  devtools(
    immer((set) => ({
      count: 0,
      increment: () => set((state) => { state.count += 1; }),
    })),
    { name: 'CounterStore' }
  )
);
```

## Slice Pattern (Large Stores)

Split domains into slices; apply middleware only at the root.

```ts
// stores/slices/chatSlice.ts
import { StateCreator } from 'zustand';
import { RootStore } from '../useRootStore';

export interface ChatSlice {
  messages: string[];
  addMessage: (msg: string) => void;
}

export const createChatSlice: StateCreator<RootStore, [['zustand/immer', never]], [], ChatSlice> = (set) => ({
  messages: [],
  addMessage: (msg) => set((state) => { state.messages.push(msg); }),
});

// stores/useRootStore.ts
export type RootStore = ChatSlice & OtherSlice;

export const useRootStore = create<RootStore>()(
  devtools(immer((...a) => ({ ...createChatSlice(...a), ...createOtherSlice(...a) })))
);
```

## Selectors and Re-render Optimization

Subscribe to the minimal shape needed. Use `useShallow` for object/array selections; use atomic selectors for primitives.

```ts
// Primitive — no useShallow needed
const count = useCounterStore((s) => s.count);

// Multiple fields — use useShallow to avoid identity churn
import { useShallow } from 'zustand/react/shallow';
const { name, role } = useUserStore(useShallow((s) => ({ name: s.name, role: s.role })));

// Stable action reference — select once outside render or memoize
const addMessage = useRootStore((s) => s.addMessage);
```

## Middleware Stack Order

```
devtools( persist( subscribeWithSelector( immer( ... ) ) ) )
```

- `devtools` outermost for full time-travel visibility
- `persist` before `subscribeWithSelector` to hydrate before subscriptions fire
- `immer` innermost so mutating syntax works inside all middleware

## Async Actions

Keep async logic inside the store action; no thunks or sagas needed.

```ts
fetchUser: async (id) => {
  set({ loading: true });
  try {
    const user = await api.getUser(id);
    set({ user, loading: false });
  } catch (err) {
    set({ error: String(err), loading: false });
  }
},
```

## Socket.io Real-time Integration

Initialize subscriptions outside React; push to store via actions.

```ts
// lib/socketSync.ts
import { socket } from './socket';
import { useRootStore } from '../stores/useRootStore';

socket.on('message', (msg) => useRootStore.getState().addMessage(msg));
socket.on('connect', () => useRootStore.setState({ connected: true }));
```

Use `subscribeWithSelector` middleware when a non-React module needs to react to store changes.

```ts
useRootStore.subscribe(
  (s) => s.connected,
  (connected) => { if (connected) socket.emit('ready'); }
);
```

## Testing Stores

Test store logic directly without React; reset state between tests.

```ts
import { useCounterStore } from '../stores/useCounterStore';

beforeEach(() => useCounterStore.setState({ count: 0 }));

it('increments', () => {
  useCounterStore.getState().increment();
  expect(useCounterStore.getState().count).toBe(1);
});
```

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Selecting entire store object | Use individual or `useShallow` selectors |
| Inline selector `(s) => ({ a: s.a })` without `useShallow` | Wrap with `useShallow` |
| Calling async socket setup inside component | Move to module-level init |
| Applying middleware inside a slice | Apply only at root `create()` call |
| Forgetting `devtools` name option | Always set `{ name: 'StoreName' }` for DevTools clarity |

Sources:
- [Working with Zustand – TkDodo](https://tkdodo.eu/blog/working-with-zustand)
- [Zustand Best Practices – projectrules.ai](https://www.projectrules.ai/rules/zustand)
- [Slices Pattern – DeepWiki](https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern)
- [Immer Middleware – DeepWiki](https://deepwiki.com/pmndrs/zustand/3.6-immer-middleware)
- [useShallow vs selectors – GitHub Discussion](https://github.com/pmndrs/zustand/discussions/2541)
- [Slice-Based Store for Next.js 14 + TypeScript – Atlys Engineering](https://engineering.atlys.com/a-slice-based-zustand-store-for-next-js-14-and-typescript-6b92385a48f5)
