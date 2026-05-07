## Context

`ChatPanel` 的 tab strip 由 `TabBar.tsx` (190 lines) + `TabContainer.tsx` (177 lines) + `TabContext.tsx` 共同支撐。當前形態：

- `TabBar` 渲染手刻 `<span role="tab" tabindex={0} aria-selected={...} onClick={...} onKeyDown={Enter|Space}>`，tab 內含 status dot / title / scope tag / worktree badge / close `<button>`。
- `TabContainer` 兩條 body 渲染路徑：
  - **Single**: `tabs.map(id => <div hidden={id !== activeTabId}>...<ChannelProvider>...</div>)` — 全部 mount，CSS 切顯隱
  - **Split**: `splitTabId && activeTabId` → `<PanelGroup>` 並排兩個 `<SplitHalf>`，各自一個 `ChannelProvider`
- `TabContext` 有 `activeTabId`、`splitTabId`、`enterSplit`/`exitSplit` 三個 split-相關 state/action

`@radix-ui/react-tabs ^1.1.13` 已在 package.json，被 `RightPane.tsx` 使用（Files / Git / Spec）— 它示範了「`Tabs.Content forceMount + hidden + display: contents`」pattern 來保留全部 panel state。

F.html (`docs/prototype/F.html` + `shared.css:148-162`) 是設計來源，定義 chat tab 的 visual shape：accent border-bottom + bg、border-right 分隔、scope-tag、provider-pill slot、binary live-dot。

## Goals / Non-Goals

**Goals:**
- 統一 ChatPanel tab 機制與 RightPane 一致（都用 Radix `Tabs.Root`）
- 升級 a11y：roving tabindex、Arrow / Home / End keyboard nav、自動 aria-selected
- 簡化 `TabContainer` 為單 active body 路徑（砍 split）
- 視覺對齊 F.html，預留 provider-pill slot 給未來 multi-CLI feature

**Non-Goals:**
- Provider pill 真實作（先放 visual placeholder，actual switching 之後做）
- ✕ button hover overlay（保 F.html 永顯設計）
- 替代 split mode 的 UX（context menu / windowed view 等 — 整個砍）
- 重寫 `TabContext` 的整個 state shape（只移除 split 相關，addTab/removeTab/setActiveTab 不動）

## Decisions

### Decision 1: 砍 split mode 而非保留

**Choice:** 完全移除 `splitTabId` / `enterSplit` / `exitSplit` / `<SplitHalf>` / shift-click handler。

**Rationale:**
- Radix `Tabs.Root` 模型是 single value → single content；split 的 multi-active 需要外部 PanelGroup 跨在 Radix 之外，造成「Radix 管 strip + 自管 body」的混合架構
- Split mode 的真實使用率未驗證（assumption: 低）
- 移除後 TabContainer 從 ~180 lines 降到 ~80 lines，body 只走「全 mount + hidden」一條路徑

**Alternatives considered:**
- **B (mixed Radix tabs + 外部 PanelGroup orchestration)**: 保 split 但接受架構混合複雜度。需要定義「split 模式下另一邊 trigger 的 visual」、「點 non-split tab 是否退出 split」等規則
- **C (不切 Radix)**: 保 split 但失去 a11y 升級，需手刻 keyboard nav

選 A 的 trade-off：失去 split UX。如果未來真有需求，可開獨立 change `chat-split-window` 用 popout window 或 dual-instance 方式重做。

### Decision 2: `Tabs.Trigger asChild → <div role="tab">`

**Choice:** Trigger 不用 default `<button>`，改 `asChild` 渲染成 `<div role="tab">`，讓 close `<button>` 合法 nest 在內。

**Rationale:**
- 當前 close ✕ 在 tab 內部，符合 F.html 設計與使用者慣例
- Default Radix Trigger 是 `<button>` → button-in-button HTML 違規
- `asChild` 模式 Radix 仍透過 `role="tab"` + `tabindex` + click handler 補足語意，screen reader 仍識別為 tab

**Alternatives considered:**
- **✕ 拉到 Trigger 兄弟**: 結構正確但 visual layout 不對齊 F.html
- **✕ hover overlay**: 跟 VS Code 慣例對齊但偏離 F.html「永顯」設計，且 keyboard 觸發複雜
- **保 default `<button>`，✕ 改 `<span role="button">`**: a11y 較弱，screen reader 不會把 span 當 button

### Decision 3: Body 用 `Tabs.Content forceMount + hidden`

**Choice:** 全部 tab 對應的 `Tabs.Content` 永遠 mount，靠 `hidden` attribute 切顯隱。Active 時 `className="contents"` 移除額外 flex ancestor。

**Rationale:**
- 保留現有 invariant：每個 tab 的 `ChannelProvider` 不被 unmount，channel state（messages / streaming buffers / refs）跨 tab 切換不流失
- 直接 reuse `RightPane.tsx:78-101` 的 `TabContent` 包裝 pattern

**Alternatives considered:**
- **Default Radix `Tabs.Content`**: inactive tab unmount → 切回去要重新 join session、replay history → 體驗差
- **手寫 `<div hidden>`（不用 Tabs.Content）**: 失去 Radix `data-state="active|inactive"` 自動屬性；keyboard nav 也會壞（Radix 用 collection 算 trigger 順序，content 不在它管）

### Decision 4: TabContext 移除 split 後的 type 簡化

**Choice:** 從 `TabStateValue` 拿掉 `splitTabId`；從 `TabActionsValue` 拿掉 `enterSplit` / `exitSplit`。`replaceTab` 保留（給 session resume / fork 用）。

**Rationale:**
- Split state 沒有獨立 capability spec，純 type 簡化
- `splitTabId` 沒有其他 consumer，砍掉零連鎖反應（grep 確認）

### Decision 5: 視覺 100% 對齊 F.html，但保留多色 status dot

**Choice:** Active border / bg / scope-tag / border-right / `+` add tab 樣式照 `shared.css:148-162` 抄。**唯一 functional 偏差**：status dot 保留多色 (idle/processing/cancelling/connecting)，不採 F.html 的 binary live/idle。

**Rationale:**
- F.html 是設計源，視覺一致性優先
- Status dot 多色是 functional 需求（user 需要知道哪個 tab 在 processing），不能為了視覺對齊 sacrifice
- Provider pill slot 預留 markup 但無內容（之後 feature 再填）

## Risks / Trade-offs

**[砍 split mode 是 BREAKING UX]** → 確認 prod 有沒有真實使用者依賴 split。spike: 看 telemetry 或問 stakeholder。如果有真用戶，可能要改走方案 B。

**[`Tabs.Trigger asChild → <div>` 失去 native button semantics]** → screen reader 可能差一點，Radix 用 `role="tab"` + tabindex 補足。實測 NVDA / VoiceOver 行為作 spike。

**[Focus 搶奪：程式驅動切 active 可能搶 textarea focus]** → Radix controlled mode 對 value prop 變化的 focus 行為需驗證。RightPane 已用 Radix Tabs 跑 prod 沒抱怨，差異在 ChatPanel 切 active 是 sessions sync / nav intent 觸發（更頻繁）。Spike: 在 dev console 程式驅動切 RightPane active，看 textarea 是否失焦。

**[測試衝擊]** → `TabBar.test.tsx` 220 行。如果 query 用 `getByRole('tab')` / `getByLabelText('Close ...')`，role/label-based 大多穩。className / structural assertion 會破。需 audit。

**[Radix `Tabs.List asChild` + 自定 className 衝突]** → 用 `asChild` 把 `Tabs.List` 渲染成自己的 `<div>` 時，要承擔 `role="tablist"`。Radix 會自動 merge，但 className / data-* 要驗證不衝突。
