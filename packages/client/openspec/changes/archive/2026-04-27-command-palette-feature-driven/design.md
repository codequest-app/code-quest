## Context

目前狀態（commit `2f4940de` tip）：
- `Feature` 型別、3 個 adapter、`FeatureRegistry` 支援 Feature shape——都 ready
- `toPaletteCommand` adapter 存在但**無人消費**；palette Actions tab 還是 hardcoded
- `CommandPalette.tsx` ~600 行，包含：tab 切換、search input、`MessageResultList`（內聯）、`ActionsTab`（引入 `FiltersSection`/`PanelsSection`）、高亮 util、類型色票
- `CommandMenu.tsx` localFeatures 含 theme / density / open-settings（前一個 preferences-ui change 加的）
- `SettingsDialog` 由 `openSettingsSignal` 驅動，從 ActivityBar gear icon + CommandMenu 皆可開啟

## Goals / Non-Goals

**Goals**
- CommandPalette 是 feature-driven 容器，純 orchestrator
- 使用者能從 Cmd+K 直接切 theme / density / 開 SettingsDialog
- Messages / Actions tab 視覺與既有一致（或更好）
- 每個新元件獨立可測、有 story
- TDD：RED → GREEN 每步

**Non-Goals**
- 不改 `Feature` interface（`ui.surfaces` 不加，因為 theme/density/open-settings **只在 palette**，無跨 UI 需求）
- 不動 SettingsDialog、ActivityBar gear icon
- 不搬 btw/model/thinking 等**仍適合在 CommandMenu** 的 features
- 不加 Files / Sessions 全域搜尋（未來擴充）

## Decisions

### D1. 兩個新元件，不合併

| | PaletteMessageList | PaletteCommandList |
|---|---|---|
| 輸入 | `Message[]` | `Feature[]` |
| 分組 | 無（時序 flat） | 按 `category` |
| 排序 | 時序新→舊 | `order` asc 內 asc |
| 搜尋 | 內部 filter + highlight | 內部 label filter |
| trailing | role badge + type label + preview | 經 adapter：toggle / tri-state / select |
| click | `onJumpTo(msgId)` + close palette | `feature.execute()` + palette 不關（連續操作） |

形狀差異夠大，合併得不償失。共享的只有 row 的 hover 視覺（可用 CSS class 共用）。

### D2. PaletteMessageList 介面

```ts
interface PaletteMessageListProps {
  messages: Message[];         // 來源，由 CommandPalette 從 useChannelMessages 傳入
  query: string;               // 搜尋字
  activeIdx: number;           // 鍵盤選中 index
  onActiveChange: (idx: number) => void;
  onJumpTo: (id: string) => void;
  onClose: () => void;
  /** 是否顯示 "Messages" section header（All tab 用） */
  showHeader?: boolean;
  /** empty query 時顯示的筆數（預設 8） */
  recentCount?: number;
  /** query 非空時的最大筆數（預設 50） */
  searchLimit?: number;
}
```

state（activeIdx）由 parent 持有，因為鍵盤 nav 可能跨 tab / 跨兩個 list。

### D3. PaletteCommandList 介面

```ts
interface PaletteCommandListProps {
  features: Feature[];
  query: string;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  onExecute?: (f: Feature) => void;   // default: call f.execute()
  className?: string;
}
```

- 內部呼叫 `toPaletteCommand(f)` 把 Feature 轉成 `{ id, label, category, trailing, onExecute }`
- `query` 非空時 filter by `label.toLowerCase().includes(query.toLowerCase())`
- 分組渲染按 `category`（first-seen order）
- active id 由 parent 控（palette 的 arrow nav）

### D4. CommandPalette 改造後結構

```tsx
export function CommandPalette({ open, onClose, onJumpTo, onToggleRawPanel, rawPanelActive }) {
  const messages = useChannelMessages();
  const visibility = useMessageVisibility();
  const prefs = usePreferencesStore();

  const paletteFeatures = useMemo<Feature[]>(() => [
    ...createFilterFeatures({ state: visibility, toggleGroup, onPartialClick }),
    createRawPanelFeature({ active: rawPanelActive, onToggle: onToggleRawPanel }),
    createColorThemeFeature({ colorTheme: prefs.colorTheme, setColorTheme: prefs.setColorTheme }),
    createDensityFeature({ density: prefs.density, setDensity: prefs.setDensity }),
    createOpenSettingsFeature({ onOpen: () => openSettingsSignal.setOpen(true) }),
  ], [/* deps */]);

  return (
    <PaletteShell open onClose>
      <Search value={query} />
      <Tabs active={tab} onChange={setTab} />
      {tab === 'messages' && <PaletteMessageList messages={visible} query={q} ... />}
      {tab === 'actions'  && <PaletteCommandList features={paletteFeatures} query={q} ... />}
      {tab === 'all' && (
        <>
          <PaletteCommandList features={paletteFeatures} query={q} ... />
          <PaletteMessageList messages={visible} query={q} showHeader ... />
        </>
      )}
    </PaletteShell>
  );
}
```

### D5. CommandMenu 刪除的三個 feature

在 `CommandMenu.tsx` 把 `createColorThemeFeature` / `createDensityFeature` / `createOpenSettingsFeature` 從 `localFeatures` 移除。同時：
- 對應 import 移除
- CommandMenu.test.tsx 刪除 3 個 click-through 測試（scenario 語意由 palette 測試承接）
- factory 本身**保留**（`features/color-theme/` etc.）——palette 會 instantiate

### D6. 搜尋行為統一

CommandPalette 的 search input 值同時傳給兩個 list；各自過濾。不跨 list 互動（避免複雜 activeIdx 協調）。`activeIdx` 範圍內鍵盤 nav 僅作用於當前 tab 的 list。

## Risks / Trade-offs

- **視覺漂移**：palette row 風格從內聯 inline-style 改為共用 Tailwind class → 先寫 story 對比、差異明顯時以 className prop 微調
- **keyboard navigation in All tab 跨 list**：D6 決定不跨；使用者若反饋可接受（目前 All tab 已 rarely 使用）
- **PaletteCommandList 和 FeatureList 重複**：兩者差異在分組排序與 trailing renderer（palette vs menu）。現階段分開寫、共用可抽 row component；若 duplication 嚴重再抽
- **CommandMenu 刪除 feature 後使用者找不到 theme 切換**：Cmd+K 有了，加上 ActivityBar gear 仍可開 settings；不影響功能

## Migration Plan

Strict TDD，每組 RED → GREEN：

**Phase 1: utils 搬家**
1. Write `utils/__tests__/message-preview.test.ts`（RED）
2. Implement `utils/message-preview.ts`（GREEN；搬原邏輯）

**Phase 2: PaletteMessageList**
1. Write `components/palette/__tests__/PaletteMessageList.test.tsx`（RED；覆蓋 empty query / search / click jump / keyboard nav / highlight）
2. Implement `components/palette/PaletteMessageList.tsx`（GREEN）
3. Add story

**Phase 3: PaletteCommandList**
1. Write `components/palette/__tests__/PaletteCommandList.test.tsx`（RED；覆蓋 category grouping / search filter / click execute / keyboard nav / trailing render）
2. Implement `components/palette/PaletteCommandList.tsx`（GREEN）
3. Add story

**Phase 4: CommandPalette 整合**
1. 改 CommandPalette 使用新元件；既有 palette tests 可能壞一部分 selector
2. 修 selector 到綠，不改 scenario

**Phase 5: CommandMenu 收尾**
1. 移除三 feature 的 imports / localFeatures / 3 個 click-through tests
2. 驗 menu 其他功能 intact

**Phase 6: 全套驗證 + archive**

## Open Questions

- All tab 的 search 要不要也 filter actions（目前 palette 的 search 只作用於 messages）？本 change 統一作用於兩者（D6）
- 未來 files / sessions 搜尋 → 新建 `PaletteNavigationList<T>` 或直接 extend `PaletteMessageList` 支援泛型？留待真需求
