## MODIFIED Requirements

### Requirement: Frontend tests use Testing Library style and a single file-name convention

前端 (`apps/web`) 測試 MUST 以 React Testing Library 的「使用者視角」風格撰寫；檔名 MUST 為 `*.test.ts` 或 `*.test.tsx`，**不得**引入 `*.integration.test.*` 等變體。測試環境 MUST 使用 `happy-dom`（取代 jsdom）。

#### Scenario: single file-name suffix

- **WHEN** 新增或重命名前端測試檔
- **THEN** 檔名僅允許 `*.test.ts` / `*.test.tsx`
- **AND** `apps/web/vitest.config.ts` `include` 只保留 `src/**/*.test.{ts,tsx}` 一條 glob

#### Scenario: test environment is happy-dom

- **WHEN** 執行 client package 的測試
- **THEN** `apps/web/vitest.config.ts` 的 `environment` MUST 為 `happy-dom`
- **AND** `jsdom` 不存在於 client package 的 devDependencies

#### Scenario: test renders meaningful user tree

- **WHEN** 測試一個有使用者可見行為的元件
- **THEN** 使用 `render()` + testing-library query（優先序 `getByRole > getByLabelText > getByPlaceholderText > getByText > getByDisplayValue > getByAltText > getByTestId`）
- **AND** 不使用淺層渲染 / shallow render

#### Scenario: setup.ts does not polyfill happy-dom native APIs

- **WHEN** happy-dom 原生支援某個瀏覽器 API（requestAnimationFrame、scrollIntoView、ResizeObserver、IntersectionObserver、matchMedia）
- **THEN** setup.ts MUST NOT 包含該 API 的 polyfill
- **AND** 僅保留 layout measurement 相關的 mock（react-resizable-panels、@tanstack/react-virtual）

#### Scenario: test assertions are environment-agnostic

- **WHEN** 測試斷言 inline style 值
- **THEN** MUST NOT 依賴特定 DOM 環境對 CSS 值的序列化行為（如 `calc()` expression 的保留與否）
