## ADDED Requirements

### Requirement: Full Storybook coverage for components and features

`apps/web/src/components` 下所有非 `.stories.tsx` / `.test.tsx` 的 `.tsx` 檔 MUST 有對應 `*.stories.tsx`。`apps/web/src/features/*/*.tsx` 具 UI 輸出的元件同樣 MUST 有 story。

補齊清單（26 個）：
- components（22）：`ActionsTab`, `ActivityBar`, `AddProjectDialog`, `ChatInputArea`, `CollapsibleTimeline`, `CommandPalette`, `EditorArea`, `EmptyState`, `FileTree`, `FilterPopover`, `MessageNodeList`, `ProjectCard`, `ProjectContextMenu`, `ProjectList`, `QuestionContent`, `RawEventFilterBar`, `ResumeSessionsDialog`, `SessionDropdown`, `SideQuestionDialog`, `SubagentChildren`, `ToolbarDialogs`, `VisibilityGroupRow`
- features（4）：以 `features/` 下目前缺漏的 UI 元件為準（實際清單於實作時確認）

#### Scenario: Every component has a default story

- **WHEN** 執行 `pnpm -C apps/web build-storybook`
- **THEN** build 成功且每個上述檔案皆有至少一個 default export variant

#### Scenario: Stories render without errors

- **WHEN** 執行 `pnpm -C apps/web test-storybook`
- **THEN** 所有 story 的 smoke test 通過（render 不 throw、無 a11y critical violation）

### Requirement: Storybook test-runner with Playwright

專案 SHALL 導入 `@storybook/test-runner`，透過 Playwright 對所有 stories 跑：
- Smoke：render 不 crash
- a11y：critical level 不可有違規
- Visual snapshot：Playwright `toHaveScreenshot()`，snapshot 檔存於 repo

新增 npm script：`test-storybook`（本地互動）、`test-storybook:ci`（CI 使用）。

#### Scenario: Snapshot baseline established

- **WHEN** 首次在 `main` 分支跑 `test-storybook:ci`
- **THEN** 所有 stories 產生基準 snapshot 並 commit 進 repo

#### Scenario: Refactor verifies against baseline

- **WHEN** Phase 1 完成後跑 `test-storybook:ci`
- **THEN** 所有 snapshot 與 baseline 一致，無 visual diff

### Requirement: New components must ship with stories

從此 change merge 起，新增的 UI component / feature 元件 MUST 同時新增對應 `*.stories.tsx`。CI 的 `test-storybook:ci` 必須通過才能 merge。

#### Scenario: PR adds component without story

- **WHEN** PR 新增 `src/components/Foo.tsx` 但無 `Foo.stories.tsx`
- **THEN** CI coverage check（或 review 規約）阻擋 merge
