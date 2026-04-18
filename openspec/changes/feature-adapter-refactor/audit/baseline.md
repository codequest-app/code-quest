# Pre-refactor baseline

Branch: `feat/feature-adapter-refactor` (based on `feat/command-registry-unification` 的 reset 狀態)
Date: 2026-04-18

## vitest

- Test files: **158 total**, 156 passed, 2 flaky under parallel load（單跑 PASS）
- Tests: **1211 total**, 1209 passed + 2 flaky
- Flaky:
  - `CommandPalette.test.tsx > calls onClose when Esc pressed`（Escape event 跨 test 洩漏）
  - （第二個似乎是相關的，單跑 file 全 PASS）
- **單檔跑全通** → flaky 非此 refactor 引入，視為 baseline 已知狀態

## typecheck
- Clean（無 error）

## test-storybook
- 未跑（TBD）

## 驗證條件
- 重構後 tests 數應 `>= 1211`，failed **不超過** baseline 的 2 flaky
