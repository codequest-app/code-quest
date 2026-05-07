## Why

SearchBar 的 type filter 用平面 checkbox list 呈現 21 個 type，語意反直覺（選了=排除），且 RawEventPanel 有自己的一套 search + filter 實作，兩邊樣式與行為不一致。兩邊的 filter 本質相同（type name + count），應統一為一個共用 component。

## What Changes

- **FilterPopover** 新增共用 component：flat searchable list + count 排序 + whitelist 語意，Messages 和 RawEvents 共用
- **SearchBar** 改為接受 `filterPanel: ReactNode` + `filterCount: number`，外殼解耦 filter 內容
- filter 語意從 blacklist（選了=排除）改為 **whitelist（選了=顯示）**，預設全選
- active filter 以 badge 數字顯示在 filter 按鈕上
- type 顯示名稱以輕量對照表（TYPE_LABELS）補足友善標籤，不用 group 架構
- **RawEventPanel** 改用統一 SearchBar 外殼 + FilterPopover，移除原生 `<select multiple>`
- `typeFilter` state 語意更新（whitelist `Set<string>`）

## Capabilities

### New Capabilities

- `filter-popover`: 共用 flat searchable filter popover，count 排序，whitelist 語意，Messages 和 RawEvents 共用
- `search-bar-shell`: 共用 SearchBar 外殼，接受 pluggable filterPanel prop

### Modified Capabilities

## Impact

- `apps/web/src/components/SearchBar.tsx` — 移除舊 typeFilter props，改為 filterPanel/filterCount
- `apps/web/src/components/FilterPopover.tsx` — 新增
- `apps/web/src/components/RawEventPanel.tsx` — search/filter 區塊替換
- `apps/web/src/components/ChatPanel.tsx` — typeFilter 改為 Set\<MessageType\>，傳入 FilterPopover
- `apps/web/src/components/MessageList.tsx` — filter 邏輯從 blacklist 改 whitelist
- `apps/web/src/components/__tests__/SearchBar.test.tsx` — 更新
- `apps/web/src/components/__tests__/RawEventPanel.test.tsx` — 更新
- `apps/web/src/components/__tests__/MessageList.test.tsx` — 更新
- `apps/web/src/components/__tests__/FilterPopover.test.tsx` — 新增
