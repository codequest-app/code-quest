## Context

目前 `DiffViewer` 接受 unified diff string，用 `react-syntax-highlighter` 以單欄格式渲染。使用者希望支援 GitHub 風格的左右兩欄（split）比較，並可切換到 unified 模式。

`DiffViewer` 的對外 props 是 `content`（unified diff string）、`editable`、`onAccept`、`onReject`，這些不會改變。

## Goals / Non-Goals

**Goals:**
- `DiffViewer` 支援 split（左右兩欄）和 unified（單欄）兩種顯示模式
- 預設 split 模式
- 有切換按鈕
- `editable` / `onAccept` / `onReject` 功能維持不變

**Non-Goals:**
- 不支援 inline comment
- 不支援三方合併（three-way merge）

## Decisions

### 使用 `react-diff-view`

`react-diff-view` 直接接受 parsed hunks，支援 unified 和 split 兩種 `viewType`，API 穩定，樣式可完全自訂。

替代方案 `diff2html` 輸出 HTML 字串，客製化困難，捨棄。

### 解析流程

unified diff string → `parseDiff` (from `react-diff-view`) → hunks → `<Diff viewType="split">` 或 `<Diff viewType="unified">`

`diff` package 已在 `generateUnifiedDiff` 使用，不需新增解析工具。

### 切換按鈕位置

放在 `DiffViewer` header 右側，icon-only（`SplitSquareHorizontal` / `AlignLeft`）。

## Risks / Trade-offs

- `react-diff-view` 需要引入額外 CSS（token 顏色）— 用 Tailwind 覆寫或引入其 theme CSS
- Split 模式在極窄螢幕可能擠壓 — 可接受，工具結果預設展開寬度夠用

## Migration Plan

1. 安裝 `react-diff-view`
2. 重寫 `DiffViewer` 內部，對外 API 不變
3. 現有 snapshot/tests 更新
4. 無需 rollback 策略（純 UI 改動）
