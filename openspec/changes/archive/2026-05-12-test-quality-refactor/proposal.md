## Why

這個 branch 改動了大量測試，根本原因是原有測試與 production 路徑耦合太深（直接 render component、手動注入 store state），導致 source 重構時測試必須跟著大幅改動，失去了測試保護重構的意義。同時測試斷言大量使用 CSS class、`style.*`、`classList` 等實作細節，而非用戶可見行為。

## What Changes

- **移動測試位置**：`getGroupKey.test.ts` 已從 `conversation/__tests__/` 合併至 `utils/__tests__/renderable-groups.test.ts`（已完成）
- **修正失效測試**：Expandable 的 overflow test 永遠 pass；NodeContent 有 `?? document.body` fallback 使斷言無效
- **替換 CSS class 斷言**：改用 `getByRole`/`getByText`/`getByLabelText` 等 Testing Library 標準 query，加 `aria-label` / `data-*` 語意屬性
- **替換 `style.*` 斷言**：Expandable/AssistantTurnContent 的展開狀態改以「Show more / Show less 按鈕存在性」表達
- **改用 FakeSummoner pipeline**：CollapsibleTimeline、AssistantTurnContent 等有 store 依賴的 component 改用 `renderWithChannel` + `claude.emitSegment` 而非手動 render + 直接 props
- **刪除無意義 layout 測試**：`pb-32`、`ml-auto` 等 layout class 測試直接刪除，不補
- **Highlight 測試策略改寫**：不再測 Prism 內部 class，改測「內容正確顯示」的行為

## Capabilities

### New Capabilities
- `test-query-conventions`: Testing Library query 使用規範與語意屬性（`aria-label`、`data-*`）的 contract

### Modified Capabilities
（無 spec-level 行為改變，只改測試實作）

## Impact

- `apps/web/src/components/chat/renderers/Expandable.tsx` — 加 `data-expanded` 屬性供測試用
- `apps/web/src/components/chat/conversation/CollapsibleTimeline.tsx` — dot/line 加 `aria-label`
- `apps/web/src/components/chat/conversation/NodeContent.tsx` — diff 行加 `data-diff-type`；attachment chip 加 `aria-label`
- `apps/web/src/components/chat/conversation/MessageList.tsx` — spotlight 改用 `data-highlighted`
- 所有測試檔案：改用 Testing Library 標準 API
