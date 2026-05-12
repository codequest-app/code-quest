## 1. Production code — 加語意屬性（先改 source，讓測試有東西 query）

- [x] 1.1 `Expandable.tsx` — 加 `data-expanded` attribute（`"true"` / `"false"`）到 inner content div
- [x] 1.2 `CollapsibleTimeline.tsx` — dot span 加 `aria-label="timeline-dot"`；line span 加 `aria-label="timeline-line"`；`hidden` 狀態改用 `aria-hidden` 或 conditional render
- [x] 1.3 `NodeContent.tsx` diff renderer — 各 diff 行加 `data-diff-type="added" | "removed" | "context" | "header"`
- [x] 1.4 `MessageList.tsx` `spotlightElement` — 高亮時設 `element.dataset.highlighted = 'true'`；animationend 時移除

## 2. Expandable.test.tsx — 修正所有違規

- [x] 2.1 修正失效測試 `shows "Show more" button when content overflows`（`expect(c2).toBeInTheDocument()` → 驗 `screen.getByText('Show more')`）
- [x] 2.2 `applies maxHeight style when not expanded` → 改驗 `screen.queryByText('Show more')` 存在
- [x] 2.3 `removes maxHeight style when expanded` → 改驗 `screen.queryByText('Show less')` 存在（點擊後）
- [x] 2.4 `defaults to expanded when defaultOpen={true}` → 改驗 `screen.queryByText('Show more')` 不在 document
- [x] 2.5 `defaults to collapsed when defaultOpen not set` → 改驗 `screen.queryByText('Show more')` 在 document

## 3. CollapsibleTimeline.test.tsx — 改 renderWithChannel + 修正 query

- [x] 3.1 改用 `renderWithChannel` + emit tool_use/tool_result segments 準備資料（取代直接 render + props）
- [x] 3.2 `renders a dot span` → 改用 `screen.getByLabelText('timeline-dot')`
- [x] 3.3 `renders a line span` → 改用 `screen.getByLabelText('timeline-line')`
- [x] 3.4 `hides line when position is only` → 改驗 `screen.getByLabelText('timeline-line')` 有 `aria-hidden="true"` 或 not.toBeVisible()
- [x] 3.5 `renders children inside relative pl-7 container` — 刪除（layout class，不測）
- [x] 3.6 `tool group chevron is next to chips` — 刪除（layout position，不測）

## 4. AssistantTurnContent.test.tsx — 改 renderWithChannel + 修正 query

- [x] 4.1 改用 `renderWithChannel` + emit assistant turn（含 text block）取代直接 render
- [x] 4.2 `Expandable is expanded when isLastTurn={true}` → 改驗 `screen.queryByText('Show more')` 不在 document
- [x] 4.3 `Expandable is collapsed when isLastTurn={false}` → 改驗 `screen.getByText('Show more')` 在 document

## 5. Highlight.test.tsx — 刪除 Prism class 測試，改驗內容

- [x] 5.1 `applies language class when lang is provided` → 改驗 `screen.getByText(codeContent)` 在 document；刪除 `[class*="language-bash"]` assertion
- [x] 5.2 `renders plain pre when no lang or filePath` → 改驗 `screen.getByText(codeContent)` 在 document；刪除 CSS class assertions
- [x] 5.3 `infers language from filePath` → 改驗內容顯示；刪除 `[class*="language-tsx"]` assertion
- [x] 5.4 `filePath with unknown extension falls back` → 改驗內容顯示；刪除 CSS class assertions

## 6. ContentRenderer.test.tsx — 刪除 CSS class 斷言

- [x] 6.1 `applies text-danger class when isError is true` → 加 `role="alert"` 到 ContentRenderer error 狀態，測試改驗 `screen.getByRole('alert')`
- [x] 6.2 `does not apply text-danger when isError is false` → 改驗 `screen.queryByRole('alert')` 不在 document
- [x] 6.3 `bare mode` 三個測試 → 刪除 CSS class assertions，只驗內容存在

## 7. NodeContent.test.tsx — 修正 CSS class 斷言

- [x] 7.1 `user typed input gets whitespace-pre-wrap class` → 改驗換行保留效果（`screen.getByText(/line1/)` 存在）或直接刪除（layout class 不測）
- [x] 7.2 `user skill-body does not get whitespace-pre-wrap class` → 改驗 markdown 解析效果（`screen.getByRole('strong')` 或 `getByText`）
- [x] 7.3 `renders diff content with colored lines` → 改用 `container.querySelector('[data-diff-type="added"]')` 等 attribute query
- [x] 7.4 `renders diff with line numbers` → 改驗數字文字出現（`screen.getAllByText('1')`）；刪除 CSS class selector
- [x] 7.5 `does not render chips when attachments is absent` → 改用 text content 驗無 attachment 文字
- [x] 7.6 修正失效測試 `falls back to content when no diagnostics in meta`（移除 `?? document.body` fallback）

## 8. MessageList.test.tsx — 修正 spotlight 測試

- [x] 8.1 `adds spotlight-highlight` → 改驗 `element.dataset.highlighted === 'true'`
- [x] 8.2 `removes spotlight-highlight after animationend` → `fireEvent('animationend', element)` 後驗 `dataset.highlighted` 不存在
- [x] 8.3 `re-triggers animation when called twice` → 同上，驗 dataset attribute
- [x] 8.4 `jumpTo highlights` → 改驗 `dataset.highlighted`
- [x] 8.5 `message content wrapper has pb-32` → 刪除（layout class 不測）

## 9. session-history.test.tsx — 修正命名/邏輯矛盾

- [x] 9.1 審查「B sees task Done」測試的 intent，修正命名與 assertion 一致

## 10. assistant-turn.test.ts — 清理 debug 遺留物

- [x] 10.1 刪除 `console.log(...)` 遺留
- [x] 10.2 釐清「目前行為可能是錯的」那個 case 的 intent，補正確 assertion 或加 TODO comment 說明
