## 1. SearchBar 外殼重構

- [x] 1.1 寫 SearchBar 測試：filterPanel slot（有/無時 filter button 顯示）、filterCount badge、clear button
- [x] 1.2 重構 SearchBar — 接受 filterPanel: ReactNode、filterCount: number，移除舊 typeFilter/setTypeFilter props
- [x] 1.3 更新 SearchBar.stories.tsx

## 2. FilterPopover component

- [x] 2.1 寫 FilterPopover 測試：count 排序、搜尋過濾、whitelist toggle（check/uncheck）、Select All、Clear All、labels 對照表
- [x] 2.2 實作 FilterPopover component（TDD GREEN）
- [x] 2.3 新增 TYPE_LABELS 常數（constants/message-type-labels.ts）

## 3. MessageList whitelist 邏輯

- [x] 3.1 更新 MessageList 測試 — 將 blacklist 語意改為 whitelist（selectedTypes: Set\<string\>）
- [x] 3.2 更新 MessageList filter 邏輯（`selectedTypes.has(m.type)` 取代 `!typeFilter.includes(m.type)`）

## 4. ChatPanel 整合

- [x] 4.1 ChatPanel 從 messages 動態算出 FilterEntry[]（type + count）
- [x] 4.2 初始 selectedTypes 改為 `new Set(ALL_MESSAGE_TYPES)`（全選）
- [x] 4.3 ChatPanel 傳入 `<FilterPopover>` 給 SearchBar 的 filterPanel prop
- [x] 4.4 計算 filterCount（ALL_MESSAGE_TYPES.size - selectedTypes.size）

## 5. RawEventPanel 整合

- [x] 5.1 更新 RawEventPanel 測試 — 改用 SearchBar 外殼 + FilterPopover
- [x] 5.2 hiddenTypes（blacklist）改為 visibleTypes（whitelist Set\<string\>），delta auto-hide 邏輯對應調整
- [x] 5.3 RawEventPanel 改用 SearchBar + FilterPopover，移除舊 select multiple + inline input

## 6. 收尾

- [x] 6.1 跑所有相關測試確認全部通過
- [x] 6.2 清理舊 SearchBar.test.tsx 中已刪除的 typeFilter prop 相關測試
