## Why

目前 `DiffViewer` 使用 unified diff 格式（單欄 `---`/`+++`），不直觀。使用者希望像 GitHub 一樣支援左右兩欄（split）比較，讓改動更易讀。

## What Changes

- 替換 `DiffViewer` 的底層渲染從 `react-syntax-highlighter` 改為 `react-diff-view`
- 新增 unified / split 切換按鈕（預設 split）
- `DiffViewer` 對外 API（`content`, `editable`, `onAccept`, `onReject`）維持不變

## Capabilities

### New Capabilities

- `diff-viewer-split`: DiffViewer 支援 unified / split 兩種模式，並有切換按鈕

### Modified Capabilities

（無 spec-level 行為變更）

## Impact

- `apps/web/src/components/chat/renderers/DiffViewer.tsx` — 重寫渲染邏輯
- 新增依賴 `react-diff-view`、`diff` packages
- 影響所有使用 `DiffViewer` 的地方：`ContentRenderer`、`EditToolBody`、`EditStreamingPreview`
