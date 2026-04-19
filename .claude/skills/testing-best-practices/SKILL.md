---
name: testing-best-practices
description: >
  Testing conventions for Vitest + React Testing Library + MSW stack covering query priority, test double selection, async patterns, and component vs Storybook split. Use when setting up test infrastructure or utilities, discussing overall testing strategy or conventions, or choosing between testing approaches such as unit vs integration or RTL vs Storybook.
---

# Testing Best Practices

## Stack

| Package | Version |
|---|---|
| vitest | ^3.2.4 |
| @testing-library/react | ^16.0.0 |
| @testing-library/user-event | ^14.5.2 |
| msw | ^2.x |
| Storybook | ^10.3.5 |

## Query Priority

1. `getByRole` — first choice (accessibility tree)
2. `getByLabelText` — form fields
3. `getByPlaceholderText` — fallback when no label
4. `getByText` — non-interactive content
5. `getByDisplayValue` — pre-filled inputs
6. `getByAltText` — images
7. `getByTestId` — last resort

## Test Double Selection Order

1. **Fake** (e.g., FakeSummoner, in-memory DB) — real behavior, controlled I/O
2. **Spy** (`vi.spyOn`) — observe without replacing
3. **Stub** (`vi.fn().mockReturnValue(...)`) — replace single function
4. **Mock** (`vi.mock('module')`) — replace entire module; last resort

## userEvent over fireEvent

```typescript
const user = userEvent.setup();
await user.click(button);      // full interaction sequence
await user.type(input, 'text'); // focus → keydown → keyup → input → change
```

`fireEvent` 保留給 userEvent 不支援的情境（custom DOM event、scroll 等）。

## Async Patterns

| Pattern | Use when |
|---|---|
| `findByRole(...)` | Element appears after async work |
| `waitFor(() => expect(...))` | Condition becomes true after re-renders |
| `waitForElementToBeRemoved(...)` | Loading spinner disappears |
| `queryByRole(...)` | Assert something is NOT in DOM |

Async 斷言用 `findBy*` 或 `queryBy*` + `waitFor`；`getBy*` 保留給同步檢查。

## Component Test vs Storybook Play Function

| Aspect | Vitest + RTL | Storybook Play |
|---|---|---|
| Purpose | Logic, state, integration, errors | Visual states, a11y, interaction demos |
| Environment | jsdom (Node) | Real browser |
| Speed | Fast, CI-first | Slower, visual regression |

Test **behavior** in Vitest；Storybook 用於 **visual snapshot** 和 **a11y audit**。不重複兩邊都寫。

**覆蓋慣例**：每個 component 一個 `.stories.tsx`（primitive component 還可多寫 gallery/matrix 展示所有 variant）。

## Vitest Patterns

| API | When |
|---|---|
| `vi.fn()` | Standalone mock function |
| `vi.spyOn(obj, 'method')` | Watch/override method (`.mockRestore()` available) |
| `vi.mock('module')` | Hoisted; replaces entire module |
| `vi.mocked(fn)` | Type-safe access to mock methods |
| `beforeEach(() => vi.clearAllMocks())` | Reset call counts |
| `afterEach(() => vi.restoreAllMocks())` | Restore originals (pairs with spyOn) |

## Asserting className

專案 `cn()` 包了 `twMerge` 自動解決衝突。斷言 className 時：

- ✅ **斷言 semantic token**（行為契約）
  ```ts
  expect(el.className).toMatch(/\bz-modal\b/);
  expect(button).toHaveClass('bg-accent');
  ```
- ⚠️ **避免斷言精調 utility**（易被視覺微調破）
  ```ts
  expect(el).toHaveClass('p-4 text-sm w-5');  // 微調 padding 時 fail
  ```

Semantic token 當 behavior assertion 合理；任意 utility 值（`p-4`、`text-sm`）當 implementation detail 不斷言。

## 專案測試規則

- **TDD first**：先寫測試，再寫 code
- **重構階段 expect 不變**：要改 expect = 行為變更，走 RED → GREEN
- **直接組合測試工具**：FakeClaude + testing-library 直接用，不再包 `setupPipeline` / `synthesizeStore` wrapper
- **Hook 抽取確認 2+ component 共用**；測試用 `renderHook`
