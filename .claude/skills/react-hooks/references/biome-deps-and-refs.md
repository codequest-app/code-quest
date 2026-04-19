# React Hooks — Biome useExhaustiveDependencies & Refs

> 此檔案是 `react-hooks` skill 的補充，涵蓋 biome linter `useExhaustiveDependencies` 的判斷規則、常見 false positive 修法，以及在 callback 裡讀 zustand store 的模式。主要 hook / Context 原則在 SKILL.md。

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

