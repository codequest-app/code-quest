## Context

目前 SearchBar 有自己的 typeFilter state（blacklist 語意），RawEventPanel 也有獨立的 search + select multiple filter 實作。兩邊 filter 本質相同（type name + count），但 UI 不一致。統一為共用 FilterPopover component，減少 maintenance debt。

## Goals / Non-Goals

**Goals:**
- 統一 SearchBar 外殼，兩邊共用
- 新增共用 FilterPopover：flat searchable list + count 排序 + whitelist 語意
- filter 語意統一改為 whitelist（`Set<string>`）
- type 友善名稱用輕量對照表，不用 group 架構

**Non-Goals:**
- 跨 session 的 filter 持久化
- search highlighting in results
- group / 分類 filter
- regex / word-boundary search

## Decisions

### SearchBar 外殼設計

```tsx
<SearchBar
  searchQuery={...}
  setSearchQuery={...}
  inputRef={...}
  filterPanel={<FilterPopover ... />}
  filterCount={hiddenCount}
/>
```

filterPanel 是 ReactNode，SearchBar 只管 popover 的開關與 badge，不知道 filter 內容。未來加新 filter 維度（role、date 等）只需換 filterPanel，SearchBar 不動。

### FilterPopover component 介面

```tsx
interface FilterEntry {
  type: string
  count: number
}

interface FilterPopoverProps {
  entries: FilterEntry[]              // 由呼叫方從資料算出，傳進來
  selected: Set<string>               // whitelist
  onChange: (selected: Set<string>) => void
  labels?: Partial<Record<string, string>>  // 友善顯示名稱
}
```

內部自行排序（count desc）、維護 popover 內的搜尋 state。

### Messages 整合

ChatPanel 從 messages 算出 entries：

```ts
const entries = useMemo(() =>
  Object.entries(
    messages.reduce<Record<string, number>>((acc, m) => {
      acc[m.type] = (acc[m.type] ?? 0) + 1
      return acc
    }, {})
  ).map(([type, count]) => ({ type, count })),
  [messages]
)
```

初始 selected = `new Set(ALL_MESSAGE_TYPES)`（全選）。

MessageList filter 邏輯改為：
```ts
messages.filter(m => selectedTypes.has(m.type))
```

### RawEventPanel 整合

RawEventPanel 改用 SearchBar 外殼：
```tsx
<SearchBar
  searchQuery={searchText}
  setSearchQuery={setSearchText}
  filterPanel={
    <FilterPopover
      entries={sortedEntries}
      selected={visibleTypes}
      onChange={setVisibleTypes}
    />
  }
  filterCount={totalTypes - visibleTypes.size}
/>
```

hiddenTypes（Set）改為 visibleTypes（Set，whitelist），delta auto-hide 邏輯保留但改為從 visibleTypes 中移除。

### TYPE_LABELS 對照表

```ts
// MessageList.tsx 或獨立 constants 檔
const TYPE_LABELS: Partial<Record<MessageType, string>> = {
  streamlined_tool_use_summary: 'tool summary',
  streamlined_text: 'streamed text',
  content_block_start: 'block start',
  redacted_thinking: 'thinking (redacted)',
  slash_command_result: 'slash command',
  compact_boundary: 'compact boundary',
  rate_limit_event: 'rate limit',
}
```

### TDD 策略

依照專案規範：**fakeSummoner + real JSON + testing-library + component 測試**。

- `FilterPopover.test.tsx` — 核心邏輯：count 排序、搜尋過濾、whitelist toggle、Select/Clear All
- `SearchBar.test.tsx` — filterPanel slot、filterCount badge、clear button
- `MessageList.test.tsx` — whitelist filter 邏輯（取代 blacklist 測試）
- `RawEventPanel.test.tsx` — 整合新 SearchBar + FilterPopover

每個 component 先寫測試（RED），再寫實作（GREEN）。

## Risks / Trade-offs

- **filter 語意翻轉（blacklist → whitelist）** → MessageList、ChatPanel、RawEventPanel 測試都需要更新。範圍廣但 TypeScript 編譯錯誤會引導所有需要改的地方。
- **entries 從 messages 動態算出** → 若 messages 很多，useMemo 有成本。但 filter 操作本身已有 re-render，影響可忽略。

## Open Questions

- FilterPopover 的最大高度：建議 `max-h-[300px] overflow-y-auto`
- TYPE_LABELS 放獨立檔案還是 inline 在 ChatPanel？建議放 `constants/message-type-labels.ts`
