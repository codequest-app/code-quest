## Context

現有測試分三層：
1. **Pure component tests**（Expandable、Highlight、ContentRenderer）— 不需 store/context，直接 `render()`
2. **Store-aware component tests**（CollapsibleTimeline、AssistantTurnContent、NodeContent）— 依賴 Zustand store，但目前用直接 render + 手動 props，與 production 路徑脫節
3. **Integration tests**（MessageList、session-history）— 已正確用 `renderWithChannel` + FakeSummoner

問題核心：層次 2 的測試沒有走 FakeSummoner pipeline，導致重構 store/handler 時測試不能保護。

## Goals / Non-Goals

**Goals:**
- 所有有 store 依賴的 component 測試改用 `renderWithChannel` + `claude.emitSegment`
- Query 統一遵守 Testing Library 優先序：`getByRole` > `getByLabelText` > `getByText` > `getByTestId`
- 展開/折疊狀態用按鈕存在性（Show more/Show less）表達，不用 `style.maxHeight`
- CSS class/classList 斷言全部替換或刪除
- 失效測試修正（永遠 pass 的 assertion）

**Non-Goals:**
- 不補 visual regression test（layout class 測試刪掉就刪掉）
- 不改 pure state handler 測試（streaming.test.ts、task.test.ts 等已正確）
- 不測第三方 library 行為（Prism class、Radix DOM structure）

## Decisions

**1. CollapsibleTimeline / AssistantTurnContent 改 renderWithChannel**

> 現況：直接 render + props。問題：store 資料不從 pipeline 流入，重構 handler 時測試不保護。
> 決策：改用 `renderWithChannel` + emit tool_use/tool_result segment，讓整個 pipeline 跑一遍。
> 取捨：setup 變複雜（需要 async/await + emitSegment），但測試覆蓋範圍正確。

**2. Expandable 展開狀態 → 用按鈕存在性**

> 現況：`inner.style.maxHeight`。問題：CSS 動畫實作細節。
> 決策：overflow 時顯示「Show more」按鈕，展開後改為「Show less」。在 Expandable 元件加 data-expanded attribute 以支援測試和 accessibility。
> Query：`screen.getByRole('button', { name: /show more/i })`

**3. 裝飾性元素（dot、line）→ 加 aria-label**

> 現況：`container.querySelector('.rounded-full')`。問題：Tailwind class 選取。
> 決策：在 CollapsibleTimeline 的 dot/line span 加 `aria-label="timeline-dot"` / `aria-label="timeline-line"`，測試用 `screen.getByLabelText`。
> `hidden` 狀態：用 `aria-hidden` 或 `not.toBeVisible()`，不驗 class。

**4. diff 行顏色 → data-diff-type**

> 現況：`.text-success`、`.text-danger`。問題：CSS token class 斷言。
> 決策：diff 行加 `data-diff-type="added" | "removed" | "context" | "header"`，測試驗 attribute 而非 class。
> 同時可以用 `getByText('+新增的行')` 驗內容，不一定需要 attribute。

**5. spotlight-highlight → data-highlighted**

> 現況：`classList.contains('spotlight-highlight')`。問題：動畫 class timing 不穩。
> 決策：`spotlightElement` 函式在加動畫 class 時同步設 `data-highlighted="true"`，animationend 時移除。測試驗 attribute。

**6. Highlight — 刪除 Prism class 測試**

> 決策：不測 `[class*="language-bash"]`。Prism 是第三方，class 不是我們的 contract。
> 改驗：內容字串正確顯示（`screen.getByText('const x = 1')`），語言推斷不 crash。

**7. ContentRenderer bare mode — 刪除 class 測試**

> 決策：`border`、`bg-code-block` class 是 layout/visual，刪除。改驗「bare mode 下 pre 存在且內容正確」。

## Risks / Trade-offs

- **[Risk] CollapsibleTimeline 改 renderWithChannel 後 setup 變慢** → 可接受，integration test 的 setup cost 值得
- **[Risk] 加 aria-label 到裝飾元素可能影響 screen reader** → 用 `aria-hidden="true"` 在裝飾 span 上，aria-label 只加在有語意的元素
- **[Risk] data-highlighted timing** → animationend 是同步事件，在 jsdom 用 `fireEvent('animationend')` 即可觸發，不需 fake timer
