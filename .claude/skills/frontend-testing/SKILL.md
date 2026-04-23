---
name: frontend-testing
description: >
  Frontend testing guide for React components, hooks, and stores using testing-library, vitest, and Storybook.
  Use when writing or refactoring component tests, hook tests, or choosing between test doubles.
  Covers six core principles (Testing Library first, Fake for external deps, Fake Component for isolation,
  test placement at smallest meaningful root, preserve-expect refactor discipline, unified fake file naming),
  query priority, userEvent patterns, and when to use Storybook play functions vs testing-library tests.
---

# Frontend Testing Guide

> 相關 skill 分工：
> - 五型經典定義（Dummy/Stub/Fake/Spy/Mock）→ `test-doubles`
> - Server 測試 pattern（DB / socket.io server-side）→ `vitest-testing` (server)
> - TDD 流程 → `tdd-guidelines`
> - Socket + pipeline test harness → `fake-summoner-client`
> - Hook / Context 慣例 → `react-hooks`
> - Storybook play function / 視覺回歸 → `storybook-component`
> - 共通慣例（RTL query、userEvent）→ `testing-best-practices`

## Core Principles

這六條依序優先，後條在前條同時成立時才考慮。

### 1. Testing Library first; no unit/integration split

使用者視角撰寫測試，render 有意義的最小 tree；**只有一種檔名** `*.test.ts` / `*.test.tsx`，不再有 `*.integration.test.*` 或其他變體。

- ✅ 用 `render()` + testing-library query，不用 shallow render
- ✅ 斷言使用者可觀察到的結果（DOM、callback、store 狀態），不斷言實作細節
- ❌ 不在 `vitest.config.ts` 區分 unit / integration glob

### 2. Fake first — when the real external dependency is hard to use in tests

當測試對象依賴「外部系統」（網路、Socket.IO、瀏覽器 API、時間、CLI）且真實依賴不易在測試中使用時，**Fake 是首選替代品**。對「內部 module」的觀察仍用 Spy；完全替換整個內部 module（`vi.mock`）是最後手段。

決策流程見 [Test Double Decision Flow](#test-double-decision-flow)。

### 3. Fake Component for subcomponent isolation

隔離子元件（不想連動其 deps）時，MUST 撰寫 `Fake<Name>` React 元件**共用原 prop 型別**，勝過 `vi.mock('./X', () => ({ X: () => null }))`。

```tsx
// ❌ BAD — 失去型別檢查，重構脆弱
vi.mock('./ComposeToolbar', () => ({ ComposeToolbar: () => null }));

// ✅ GOOD — Fake Component 契約對齊
// src/test/fake-compose-toolbar.tsx
import type { ComposeToolbarProps } from '../components/ComposeToolbar';

export function FakeComposeToolbar(props: ComposeToolbarProps) {
  return <div data-testid="fake-toolbar" data-mode={props.mode} />;
}

// test
vi.mock('./ComposeToolbar', () => ({ ComposeToolbar: FakeComposeToolbar }));
// 或 test helper 透過 props 注入
```

好處：
- 維持 prop 型別檢查（重構 real component 時，fake 編譯錯誤提醒更新）
- 可 `data-testid` 斷言 parent 傳進去的 prop
- 明確可見「這是測試替身」

### 4. Tests live at the smallest meaningful render root

用 testing-library 時，測試 render 的是**對使用者有意義的最小單位**，不是對原始碼檔案一檔對一檔。

| 情境 | 要不要建專屬 `.test`？ |
|---|---|
| 純 util / store / hook | ✅ 建（`.test.ts` / `renderHook`） |
| 有自身邏輯 / state / 複雜渲染的元件（如 `EffortSwitch`） | ✅ 建 |
| 簡單 presentational primitive（Badge / IconButton / PaletteEmpty） | ❌ 不建；透過 consumer 測試覆蓋 |
| Context / Provider | ✅ 建（測 provider 本身），但簡單 state passthrough 可由 consumer 覆蓋 |

### 5. Refactor preserves assertions (expect unchanged or equivalent)

重構測試時：
- 每個原 `expect(` 的意義 MUST 在重構後找到對應（可移位、可合併語意相同的多個斷言）
- 重構後 `grep -c 'expect(' <file>` ≥ 原數
- **允許**：rename、arrange 抽進 helper、fake 代替 mock、新增更強 assertion
- **禁止**：刪 assertion 而未遷移、弱化 assertion（`toBe(5)` → `toBeGreaterThan(0)` 等）

#### 重構時同時檢查的品質項

a. **可讀性優先**：名字取對比少寫幾行重要。含糊變數（`tmp` / `result`）→ 貼近行為的名字（`thumbLeft` / `onFinalTranscript`）。magic number / string 有被命名的價值就抽常數

b. **不使用 inline type assertion** — `as { foo: string }` / `as unknown as X` 都 MUST 不出現於測試碼（test harness 合理特例另議）。改用：
  - 從 zod schema `infer` 型別（`z.infer<typeof schema>`）
  - 明確的 `interface` / `type alias`
  - 若值來自網路 / CLI / 外部 I/O 邊界，在**進入測試前**用 zod `parse()` / `safeParse()` 擋

c. **zod 用於邊界而非 inline mock shape** — 不要用 zod 現場宣告一個「just for this test」的小 schema 來做 mock payload；mock payload 用符合真實 schema 的 fixture（例如 `segments.assistant(...)` 這類 helper）。測試對象是元件行為，不是 schema 驗證本身。

d. **Import 整理**：refactor 後跑 `biome check --write` 處理 organizeImports；測試檔 import 應跟著分類（第三方 → 專案絕對路徑 → 相對路徑）

### 6. Fake files — unified naming and placement

所有測試用 Fake 檔案 MUST 放於 `packages/client/src/test/` 平鋪層級，**不使用 `fakes/` 子目錄**。

- 檔名：`fake-<kebab>.ts[x]`
- Exported class / function：`Fake<PascalCase>`
- Setup helper：`setup<PascalCase>()`（beforeEach/afterEach 安裝與清理 window API 等）

```
src/test/
├── fake-summoner.ts         # Socket + pipeline
├── fake-raf.ts              # requestAnimationFrame
├── fake-speech-recognition.ts  # window.SpeechRecognition
└── fake-compose-toolbar.tsx # React component fake
```

### 6.5. Refactoring — extend existing tests before creating new files

新增測試前先 grep 既有 `.test` 檔，若新行為屬同一 render root / unit，MUST 在該檔加 `it()` / `expect()`；只有 scope 明顯不同時才建新檔。

---

## Test Double Decision Flow

```
測試對象有依賴嗎？
│
├─ 無 → No Double（純函式、純元件、Zustand store）
│
└─ 有 → 外部 or 內部？
    │
    ├─ 外部（程序外 / 網路 / 瀏覽器 API / 時間 / CLI）
    │   │
    │   ├─ 真依賴在測試環境便宜可用？
    │   │   ├─ YES → 用真的（e.g., in-memory SQLite）
    │   │   └─ NO  ↓
    │   │
    │   └─ Fake 首選
    │       ├─ HTTP/fetch → MSW handlers（proxy fake）
    │       ├─ Socket + CLI → FakeSummoner / renderWithChannel / renderWithWorkspace
    │       ├─ 瀏覽器 API（SpeechRecognition 等）→ Fake<API> + setup<API>()
    │       └─ 時間 → vi.useFakeTimers()
    │
    └─ 內部（自家 repo 的 module / 元件）
        │
        ├─ 想觀察呼叫（真實代碼仍跑）→ Spy (vi.spyOn)
        ├─ 想隔離子元件（不連動 deps）→ Fake Component（原則 3）
        ├─ 想替換一個方法 → Partial Mock (vi.spyOn + mockReturnValue)
        └─ 想完全替換整個 module → vi.mock（**最後手段**，重構脆弱；通常代表設計耦合）
```

### Double 類型對照

| # | Type | 真實程度 | 典型場景 | 範例 |
|---|---|---|---|---|
| 1 | **No Double** | 100% | Pure 程式 | Zustand store、pure components |
| 2 | **Fake**（外部） | 高 | 外部系統替身 | FakeSummoner、FakeSpeechRecognition、MSW |
| 3 | **Fake Component** | 高 | 子元件隔離 | FakeComposeToolbar |
| 4 | **Spy** | 99% | 觀察內部呼叫 | `vi.spyOn(service, 'method')` |
| 5 | **Partial Mock** | 中 | 替一個方法 | `vi.spyOn + mockReturnValue` |
| 6 | **vi.mock** | 低 | 最後手段 | 整個 module 替換 |
| 7 | **Mock/Stub callback** | 低 | 純 UI callback | `onClose={vi.fn()}`（無 data flow） |

### Why this order matters

每進一階，被替換的真實行為就多一分：
- **No Double / Fake**：保留原行為面向（介面不變時測試穩）
- **Spy**：只加觀察，行為不變
- **Mock / Stub**：失去真實行為 — 重構時脆弱，容易掩蓋 bug

> **關鍵規則**：若一個 prop callback 封裝了 `socket.emit()`（如 `onFetch` / `listSessions`），**不要** `vi.fn()` 取代 — 使用 FakeSummoner 走完整 socket 通道。

---

## Query Priority (Testing Library)

使用者怎麼找元素，測試就怎麼 query：

### Tier 1 — 可及性樹
| Query | 用途 |
|---|---|
| `getByRole('button', { name: /send/i })` | **預設首選** |
| `getByLabelText('Email')` | 有 label 的表單欄位 |
| `getByPlaceholderText('Search...')` | 無 label 時的 fallback |
| `getByText('Submit')` | 非互動文字內容 |
| `getByDisplayValue('pre-filled')` | 已填值的 input |

### Tier 2 — 語意
| Query | 用途 |
|---|---|
| `getByAltText('Logo')` | 圖片 |
| `getByTitle('Close')` | `title` 屬性（不穩定，慎用） |

### Tier 3 — 最後手段
| Query | 用途 |
|---|---|
| `getByTestId('complex-widget')` | 語意查詢真的無解時 |

### Variants
| Variant | 行為 | 時機 |
|---|---|---|
| `getBy` | 找不到就 throw | 元素必須存在 |
| `queryBy` | 找不到回 null | 斷言不存在 |
| `findBy` | async，等元素出現 | async state 更新後 |

---

## Testing Strategy Split (Vitest vs Storybook)

| 測什麼 | 放哪裡 | 工具 |
|---|---|---|
| 視覺變體 | Storybook stories | `args` |
| 互動（click / type / hover） | Storybook `play` functions | `userEvent` + `expect` |
| 元件輸出正確 | Vitest + testing-library | `render` / `screen` |
| Hook 邏輯 | Vitest + `renderHook` | `@testing-library/react` |
| Store 邏輯 | Vitest（不用 React） | `store.getState()` |
| Socket ↔ UI 整合 | Vitest + FakeSummoner | `claude.emit(segment)` + `screen` |
| 跨元件完整頁面 | Storybook composite story | decorators + providers |

**Rule of thumb**：
- Storybook = 視覺文件 + 互動 demo（team 會看）
- Vitest = 正確性保證 + edge case + 回歸防止（CI 會跑）
- 不重複：storybook play 已覆蓋的互動，vitest 不再重複

---

## Socket Testing with FakeSummoner

詳細 API → `fake-summoner-client` skill；常用 pattern（state injection / full pipeline / observable effect）+ legacy anti-pattern 清單 → **`references/fake-patterns.md`**。

速查：
- State injection（不經管線）
- Full pipeline 用 `renderWithWorkspace` 或 `renderWithChannel`（`skipInit: true` 取得未 init 狀態）
- Verify action 用 observable side effect，**不用** `socket.emit` spy

## userEvent vs fireEvent

永遠先 `userEvent`（模擬真實 focus / keydown / keyup / input）：

```tsx
const user = userEvent.setup();
await user.type(screen.getByRole('textbox'), 'hello');
await user.click(screen.getByRole('button'));
await user.keyboard('{Enter}');
```

`fireEvent` 只保留給 userEvent 不支援的事件：`contextMenu` / `scroll` / `paste clipboardData` / `mouseUp` 文字選取。

## Templates & Packages

- Component / Fake<BrowserAPI> / Fake Component templates → **`references/templates.md`**
- Framework-specific（React Hook Form + Zod / React Query / Error Boundary / ky）→ **`references/framework-patterns.md`**
- Packages cheatsheet → `references/templates.md` 尾段
