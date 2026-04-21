---
name: react-compiler
description: >
  React Compiler 1.0 的實際行為與邊界 — 哪些 pattern 會被自動 memo（不要手動 useMemo），哪些是架構限制必須手動處理（React.memo / prop capture / DOM refs）。以 babel-plugin-react-compiler 實際編譯結果為依據。用於判斷「這個 pattern 要不要加 useMemo/useCallback/React.memo」、解讀 profiler 結果、或效能除錯。
---

# React Compiler 1.0 — 實際行為與邊界

**This project uses React Compiler.** 不亂加 `useMemo` / `useCallback` 才對，但也不是全部自動。

> 本 skill 的結論以 `babel-plugin-react-compiler` 實際編譯輸出為準，不依賴推論。有疑問時用下面的 probe script 跑看。

## What Compiler DOES auto-memoize（不要再加 useMemo）

以下所有情境 Compiler 都會插入 cache slots（`if ($[0] !== dep)` 形式）自動 memo。手動 `useMemo` 是純冗餘：

### 1. Component 內部的 JSX / callback / 物件字面值

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount((n) => n + 1);  // auto-memo
  const meta = { count, isZero: count === 0 };     // auto-memo on [count]
  return <Button onClick={increment}>{count}</Button>;  // JSX auto-memo
}
```

### 2. Hook 回傳值的 spread

```tsx
export function useSession() {
  const state = useContext(StateCtx);
  const actions = useContext(ActionsCtx);
  if (!state || !actions) throw new Error('...');
  return { ...state, ...actions };  // auto-memo on [state, actions]
}
```

### 3. Hook 內的 filter / map / reduce / sort

```tsx
export function useVisibleItems() {
  const { items, filter } = useContext(ListContext);
  return items.filter((item) => item.status === filter);  // auto-memo on [items, filter]
}
```

### 4. 合併預設值

```tsx
export function useConfig(overrides?: Partial<Config>) {
  return { ...DEFAULT_CONFIG, ...overrides };  // auto-memo on [overrides]
}
```

### 5. Provider value inline object

```tsx
return <Ctx.Provider value={{ socket }}>{children}</Ctx.Provider>;  // auto-memo on [socket]
// 跟以下寫法編譯後完全一樣：
const value = useMemo(() => ({ socket }), [socket]);
return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
```

---

## What Compiler does NOT do（這 3 件必須手動）

這是架構限制，Compiler 沒辦法替你處理：

### 邊界 1：Component boundary memoization

Compiler 不會自動把 child component 包成 `React.memo`。Parent render → child 被呼叫，即使 child 自己 context 沒變。

**手動處理時機：**

- 渲染成本高的 leaf component（Markdown / syntax highlight / 大型表格 row）
- 深 provider tree 的邊界（memo 一次 short-circuit 整片 subtree）
- 吃 props 但 props 多半穩定的 container

**不值得 memo：**

- 本來就輕量的 component（overhead > benefit）
- props 每次都在變的 component（淺比較永遠 fail）

```tsx
export const FeedItem = memo(function FeedItem({ post }: { post: Post }) {
  const html = useMarkdownToReact(post.body);
  const highlighted = useSyntaxHighlight(html);
  return <article>{highlighted}</article>;
});
```

### 邊界 2：「這個 prop 不要納入 identity」的意圖

當 action function 內部要讀 prop 的當前值，但你不希望 action identity 隨 prop 變動，Compiler 會保守地把 prop 納入 actions 的 dep → prop 一變 actions 就換 identity → 下游 memo 全部失效。

這是意圖層面的資訊，code 本身表達不出來。

**修法：`useState` initializer 鎖定 actions identity，prop 走 ref 在 call time 讀最新值。**

```tsx
export function TabProvider({ cwd, children }) {
  const cwdRef = useRef(cwd);
  cwdRef.current = cwd;  // 每次 render 同步

  const [actions] = useState(() => ({
    createNewTab: () => {
      const tabCwd = cwdRef.current;  // 呼叫時讀最新值
      // ...
    },
  }));

  return <TabActionsContext.Provider value={actions}>{children}</TabActionsContext.Provider>;
}
```

**適用情境：**

- action identity 下游有 memo consumer（`React.memo` props 比對、`useEffect` deps）
- prop 變動頻率 ≫ action 呼叫頻率（例如 `cwd` 常變，`createNewTab` 少呼叫）

**不適用：**

- prop 本身就很穩定（不需要繞）
- action identity 下游沒人在比較

### 邊界 3：高頻 setState 打爆 commit 頻率

Compiler 不改變 commit 頻率。`setInterval` 每 120ms `setState` 就是每秒 8 次 commit，即使所有 parent bail out，fiber tree walk 本身就有成本，累積起來持續燒 CPU。

**修法：視覺動畫走 ref + DOM，不經過 React state。**

```tsx
// ❌ 每秒 8 次 commit
const [iconIndex, setIconIndex] = useState(0);
useEffect(() => {
  const id = setInterval(() => setIconIndex((i) => (i + 1) % ICONS.length), 120);
  return () => clearInterval(id);
}, []);

// ✅ 0 commit（DOM 直接寫）
const iconRef = useRef<HTMLSpanElement | null>(null);
useEffect(() => {
  let i = 0;
  const id = setInterval(() => {
    i = (i + 1) % ICONS.length;
    if (iconRef.current) iconRef.current.textContent = ICONS[i];
  }, 120);
  return () => clearInterval(id);
}, []);
return <span ref={iconRef}>{ICONS[0]}</span>;
```

**適用情境：**

- 視覺動畫（icon cycle、scramble、typing effect）
- 高頻事件處理（mousemove、scroll、resize）
- 倒數顯示（純 UI，沒 render 分支依賴）

**判斷標準：這個值有沒有影響 React 的 render 邏輯？如果只是視覺呈現、沒有任何 component 分支要根據它決定畫什麼，那就適合繞過 React。**

---

## 驗證方法：直接看 Compiler 編譯輸出

不確定某個 pattern 要不要加 `useMemo` 時，用 `babel-plugin-react-compiler` 編譯 probe 檔看輸出。看到 `if ($[0] !== dep)` 就代表 Compiler 已經 memo 了。

### Setup

```bash
pnpm --filter client add -D @babel/core @babel/preset-typescript
# babel-plugin-react-compiler 已在 devDependencies
```

### Probe script

```js
// probe.mjs — 放在 packages/client/
import { transformAsync } from '@babel/core';
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const source = readFileSync(file, 'utf8');

const result = await transformAsync(source, {
  filename: file,
  presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
  plugins: [['babel-plugin-react-compiler', {}]],
  babelrc: false,
  configFile: false,
});

console.log(result.code);
```

### 使用

```bash
cd packages/client
node probe.mjs path/to/file.tsx
```

看輸出：

- 有 `import { c as _c } from "react/compiler-runtime"` + `const $ = _c(N)` → Compiler 編譯成功
- `if ($[0] !== dep) { t0 = ...; } else { t0 = $[2]; }` → 這塊有 memo，不用自己加
- 沒看到 cache check → Compiler 沒 memo（可能 bail out，或不是 component/hook）

---

## 其他 Compiler 盲區（知道就好）

除了上面 3 個主要邊界，以下情境 Compiler 一樣沒辦法，遇到要自己處理：

- **Render 階段 mutate props / 物件**：偵測到 mutation 整段 bail out，因為安全性無法保證
- **Render 階段讀 ref**：`ref.current` 的值 Compiler 不追蹤，不能當 memo 依賴
- **跨 component 共享昂貴計算**：Compiler 的 memo 是 per-component 的。同一組 input 在三個不同 component 各跑一次各 memo 一次 — 要跨用得自己 `useMemo` + 外部 cache 或把計算推到上層
- **列表虛擬化**：架構決策，Compiler 不會因為你有 10000 筆就自動幫你 virtualize
- **事件 debouncing / throttling**：行為決策，Compiler 不管 call 頻率

---

## Quick Reference

| Compiler 自動做                       | 不自動做                                     |
| ------------------------------------- | -------------------------------------------- |
| Component 內部運算 / JSX / callback   | 把 child component 包成 `React.memo`         |
| Hook 回傳值 spread / filter / 合併    | 表達「某個 prop 不要納入 identity」的意圖    |
| Provider value inline object          | 替你決定哪些動畫該走 DOM 而不是 React state  |
| Props / context value 穩定化          | 跨 component 共享昂貴計算的快取              |
| 單一 component 重算跳過               | 改變 commit 頻率                             |

**一句話：Compiler 省掉單個 component 內部 90% 的手寫 memo，但 component 邊界、意圖表達、架構層級的優化還是要自己做。**

---

## 相關 skill

- `react-hooks` — hook 抽取規則、Context state/actions 拆分、biome useExhaustiveDependencies
- `tdd-guidelines` — 重構期間 expect 不變或等價的黃金法則
- `code-review` — 審查時避免加冗餘 `useMemo`
