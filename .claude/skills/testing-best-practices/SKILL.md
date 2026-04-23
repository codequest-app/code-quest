---
name: testing-best-practices
description: >
  Cross-cutting testing conventions (async patterns, vitest API cheatsheet, className assertion)
  shared across client and server tests. Frontend-specific rules (6 core principles, test double
  decision flow, Fake Component, test placement) live in `frontend-testing`; server-specific
  patterns (DB / socket.io server) live in `vitest-testing (server)`. Use for general test hygiene
  not tied to a specific package.
---

# Testing Best Practices (Cross-Cutting)

> 核心原則 / test double 決策 / Fake Component / 測試放置 — 詳見 `frontend-testing`
> Server 測試（DB / socket.io server-side）— 詳見 `vitest-testing (server)`
> TDD 流程 — 詳見 `tdd-guidelines`
> Socket + pipeline harness — 詳見 `fake-summoner-client` / `fake-summoner-server`

## Stack

| Package | Version |
|---|---|
| vitest | ^3.2.4 |
| @testing-library/react | ^16.0.0 |
| @testing-library/user-event | ^14.5.2 |
| msw | ^2.x |
| Storybook | ^10.3.5 |

## Async Patterns

| Pattern | Use when |
|---|---|
| `findByRole(...)` | Element appears after async work |
| `waitFor(() => expect(...))` | Condition becomes true after re-renders |
| `waitForElementToBeRemoved(...)` | Loading spinner disappears |
| `queryByRole(...)` | Assert something is NOT in DOM |

Async 斷言用 `findBy*` 或 `queryBy*` + `waitFor`；`getBy*` 保留給同步檢查。

## Vitest API Cheatsheet

| API | When |
|---|---|
| `vi.fn()` | Standalone mock function |
| `vi.spyOn(obj, 'method')` | Watch/override method（`.mockRestore()` 可用） |
| `vi.mock('module')` | Hoisted，替換整個 module（最後手段） |
| `vi.mocked(fn)` | Type-safe 存取 mock methods |
| `beforeEach(() => vi.clearAllMocks())` | Reset call counts |
| `afterEach(() => vi.restoreAllMocks())` | Restore originals（與 `vi.spyOn` 搭配） |

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

Semantic token 作為 behavior assertion 合理；任意 utility 值（`p-4`、`text-sm`）是 implementation detail，不斷言。

## Vitest vs Storybook Play Function

| Aspect | Vitest + RTL | Storybook Play |
|---|---|---|
| Purpose | Logic / state / integration / errors | Visual states / a11y / interaction demos |
| Environment | jsdom (Node) | Real browser |
| Speed | Fast, CI-first | Slower, visual regression |

Test **behavior** in Vitest；Storybook 用於 **visual snapshot** 和 **a11y audit**。不重複兩邊都寫。

**覆蓋慣例**：每個 component 一個 `.stories.tsx`（primitive 還可加 gallery / matrix）。

## 專案測試紀律

- **TDD first**：先寫測試，再寫 code
- **重構階段 expect 不變或等價**：要改 expect = 行為變更，走 RED → GREEN（細節見 `tdd-guidelines`）
- **直接組合測試工具**：FakeSummoner + testing-library 直接用，不包 wrapper
- **Hook 抽取門檻**：2+ component 共用才抽（見 `react-hooks`）

## 相關 skill

- 前端 6 原則 / test double 決策 / Fake Component / 測試放置 → `frontend-testing`
- Server 測試 pattern → `vitest-testing (server)`
- Socket + pipeline harness → `fake-summoner-client` / `fake-summoner-server`
- TDD 流程 → `tdd-guidelines` / `tdd`
- Test double 五型理論 → `test-doubles`
- Storybook play function → `storybook-component`
- MSW 網路 fake → `msw-fetch-mock`
