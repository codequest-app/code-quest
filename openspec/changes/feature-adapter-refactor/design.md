## Context

現況：
- `MenuItemFeature` 與 `SlashCommandFeature` 是兩個獨立 interface（`lib/feature.ts`）
- Factory 直接回傳對應 interface，含 JSX trailing（`.tsx`）
- `FeatureRegistry` 存 `ChannelFeature`，透過 type guard 分流 `getMenuItemFeatures()` / `getSlashCommand(cmd)`
- CommandMenu 吃 `MenuItemFeature[]` 透過 `buildMenuItems` 產 `MenuSection`
- CommandPalette Actions tab 寫死 `FiltersSection` / `PanelsSection`（尚未 feature 化）

目標：用 adapter 讓 factory 變純資料，UI 端各自 shape。

## Goals / Non-Goals

**Goals**
- Factory 不 import JSX；可當純資料 reason about
- 一個 factory 同時承載 `execute` + optional slash binding（`btw` 不再拆兩個）
- Adapter 層可獨立加新 UI（未來 keyboard shortcut panel、debug inspector 等）
- CommandMenu / CommandPalette 兩邊行為不變（byte-identical 視覺盡量）
- 既有 FakeSummoner-based 測試 0 改動、0 regression

**Non-Goals**
- 不重組資料夾（仍按 concept 一個 factory 一資料夾）
- 不把 theme/density 搬進 CommandPalette（下個 change）
- 不動 messages / PaletteMessageList（那是內容不是 Feature）
- 不刪除舊 `MenuItemFeature` / `SlashCommandFeature` 型別（backward compat；Phase 3 才評估）

## Decisions

### D1. `Feature` type 長這樣

```ts
export interface Feature {
  id: string;
  label: string;
  category: string;
  order?: number;
  description?: string;
  disabled?: boolean;
  state?: FeatureState;
  execute(): void;

  /** 選配 slash command binding；有 = 同時是 slash handler */
  slash?: {
    command: string;
    match?(message: string): boolean;
    invoke(message: string): void;
  };

  /** UI-level overrides；只在極少數特例用 */
  ui?: {
    closeSilent?: boolean;
    matchFirstToken?: boolean;
    filterOnly?: boolean;
  };
}

export type FeatureState =
  | { kind: 'toggle'; active: boolean }
  | { kind: 'tri-state'; state: 'all' | 'partial' | 'none'; onPartial?: () => void }
  | { kind: 'select'; currentValue: string };
```

**為什麼不分更細 kind？**
- 3 種 kind 涵蓋現有 20 個 factory 的 trailing（fast-mode / thinking / color-theme / density 是 toggle；model / effort 是 select；filter 是 tri-state；clear / compact / resume 等無 state）
- 將來新類型（例如 slider）再擴 discriminated union、adapter 加 case

**為什麼 `ui` 分開？**
- `closeSilent` 本質是 UI 行為，不是能力
- 絕大多數 feature 不填，adapter 預設用 `state.kind === 'toggle'` 推導
- 特例（如 `btw` matchFirstToken）顯式寫 `ui.matchFirstToken = true`

### D2. 三個 adapter

```ts
// lib/adapters/to-menu-item.tsx
export function toMenuItem(f: Feature): MenuItemFeature {
  return {
    id: f.id,
    menuItem: {
      label: f.label,
      section: f.category,
      order: f.order,
      description: f.description,
      disabled: f.disabled,
      closeSilent: f.ui?.closeSilent ?? f.state?.kind === 'toggle',
      matchFirstToken: f.ui?.matchFirstToken,
      filterOnly: f.ui?.filterOnly,
      trailing: renderMenuTrailing(f.state),
    },
    execute: f.execute,
  };
}
```

```ts
// lib/adapters/to-palette-command.tsx
export function toPaletteCommand(f: Feature) {
  return {
    id: f.id,
    label: f.label,
    category: f.category,
    description: f.description,
    trailing: renderPaletteTrailing(f.state),
    onExecute: f.execute,
  };
}
```

```ts
// lib/adapters/to-slash-command.ts
export function toSlashCommand(f: Feature): SlashCommandFeature | null {
  if (!f.slash) return null;
  return {
    id: f.id,
    command: f.slash.command,
    match: f.slash.match,
    invoke: f.slash.invoke,
  };
}
```

### D3. Adapter 共用 trailing renderer

```tsx
// lib/adapters/trailing-renderers.tsx
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';

export function renderMenuTrailing(state?: FeatureState): React.ReactNode {
  if (!state) return undefined;
  if (state.kind === 'toggle') return <ToggleSwitch isOn={state.active} />;
  if (state.kind === 'tri-state') return <FilterIndicator state={state.state} onPartial={state.onPartial} />;
  if (state.kind === 'select') return <span className="text-text-muted text-[11px]">{state.currentValue}</span>;
  return undefined;
}

// palette 版 trailing 可同、可不同。第一版兩邊共用 renderMenuTrailing 再說。
export const renderPaletteTrailing = renderMenuTrailing;
```

未來若 palette 要不同視覺，只改 `renderPaletteTrailing`。

### D4. 具體 factory 轉換範例

**`clear`（無 state 的純 command）**
```ts
// Before
{ id: 'clear', menuItem: { label: 'Clear conversation', section: 'Context', order: 0 }, execute }
// After
{ id: 'clear', label: 'Clear conversation', category: 'Context', order: 0, execute }
```
差異：拆掉 `menuItem: {}` 包裝，欄位上移；`.ts`（本來就沒 JSX）。

**`fast-mode`（toggle state）**
```ts
// Before (.tsx)
{ id: 'fast-mode', menuItem: { label, section: 'Model', order: 30, closeSilent: true, trailing: <ToggleSwitch isOn={...} /> }, execute }
// After (.ts，不 import React)
{ id: 'fast-mode', label: 'Toggle fast mode', category: 'Model', order: 30, state: { kind: 'toggle', active: fastModeState === 'on' }, execute }
```
`closeSilent` 由 adapter 從 `state.kind === 'toggle'` 推出。

**`btw`（slash + menu 合併）**
```ts
// Before：兩個 factory
createBtwLocalFeature(...): MenuItemFeature  // menu 顯示
createBtwFeature(...): SlashCommandFeature   // slash handler

// After：一個 factory
createBtwFeature({ askSideQuestion, slashFilter }): Feature {
  const question = slashFilter?.startsWith('btw ') ? slashFilter.slice(4).trim() : null;
  return {
    id: 'btw',
    label: '/btw',
    category: 'Slash Commands',
    disabled: !question,
    ui: { matchFirstToken: true, filterOnly: false },
    execute() { if (question) invoke(`/btw ${question}`); },
    slash: {
      command: '/btw',
      match: (msg) => msg.trim() === '/btw' || msg.trim().startsWith('/btw '),
      invoke: (msg) => { /* dispatch side question */ },
    },
  };
}
```

**`filter`（tri-state）**
```ts
createFilterFeatures({ states, toggleGroup, onPartialClick }): Feature[] {
  return GROUP_IDS.map((id, order) => ({
    id: `filter-${id}`,
    label: GROUP_LABELS[id],
    category: 'Filters',
    order,
    state: { kind: 'tri-state', state: states[id], onPartial: () => onPartialClick(id) },
    execute: () => toggleGroup(id),
  }));
}
```

### D5. FeatureRegistry 相容性

對外 API 不變：
```ts
registry.getMenuItemFeatures()  // 內部：features.map(toMenuItem)
registry.getSlashCommand(cmd)   // 內部：features.map(toSlashCommand).find(match cmd)
registry.getFeatures()          // ← 新增，回傳 Feature[]
```

**Registration**：既有 `.register(feature)` 接受 `ChannelFeature`（舊）或 `Feature`（新）。內部判斷：
- 有 `menuItem` 屬性 → 舊 shape，走 legacy 路徑（暫）
- 有 `label` + `category` 欄位 → 新 shape
- Phase 3 之後移除 legacy 路徑

### D6. CommandMenu 改動最小

```tsx
// Before
const localFeatures = [
  createFastModeFeature(...),   // MenuItemFeature
  createThinkingFeature(...),   // MenuItemFeature
  ...
];
// 餵給 buildMenuItems

// After
const localFeatures: Feature[] = [
  createFastModeFeature(...),   // Feature
  createThinkingFeature(...),   // Feature
  ...
];
// 餵進 buildMenuItems 前先 map
buildMenuItems({ ...params, localFeatures: localFeatures.map(toMenuItem), ... });
```

或更乾淨：`buildMenuItems` 內部接受 `Feature[]` 自己 map。

## Risks / Trade-offs

- **20 個 factory 的批次遷移有 regression 風險**
  - 緩解：每個 factory 獨立 RED → GREEN；每遷完一個 test 全綠才進下一個；必要時 delegate agent 批量做，人 review

- **Adapter trailing 視覺可能細微漂移**（例如 ToggleSwitch props 不同）
  - 緩解：第一個 factory（`fast-mode`）遷移後做 storybook snapshot 比對；確定視覺 identical 再批量

- **`closeSilent` 預設規則不精準**（某 feature 非 toggle 但要 closeSilent）
  - 緩解：檢查現有 20 個 factory 的 closeSilent 值，發現例外時顯式寫 `ui.closeSilent`；寫 unit test 驗 adapter 行為

- **FakeSummoner 測試可能受影響**
  - 緩解：Pre-refactor audit 先跑一遍全 test；遷移中每步驟跑 affected test；發現變動立即停下討論

- **Phase 1 建好 adapter 但只遷一個 factory → 兩種 feature shape 並存期**
  - 緩解：Registry 內部兼容；每次 Phase 2 commit 降低並存面；Phase 3 收尾移除 legacy

## Migration Plan

### Pre-refactor Audit（**必做**、在任何重構前）

1. 跑 `pnpm test` 確認當前 1211+ tests 全綠（baseline）
2. 列出所有 FakeSummoner-based 測試（tasks.md 1.1）
3. 針對每個即將遷移的 factory，確認其 **UI 行為**（trailing 顯示、execute 正確、closeSilent）**有被 non-FakeSummoner 測試覆蓋**
   - 如沒有 → 先補 unit test（不動 FakeSummoner 測試）
   - 如有 → 記錄下來，重構後驗證這些 test 仍全綠
4. 完成 audit 清單後才進 Phase 1

### Phase 1 — 建立 adapter 基礎

1. 寫 `Feature` / `FeatureState` type（RED test → GREEN）
2. 寫 `toMenuItem` / `toPaletteCommand` / `toSlashCommand` adapter（RED test → GREEN）
3. 寫 trailing renderer（unit test）
4. Registry 內部相容兩種 shape
5. **示範遷移：`clear`**（選最簡單、無 state 的；完整 TDD 走一輪；驗證 CommandMenu test 全綠）
6. 如 `clear` 遷移成功 → commit、進 Phase 2；失敗 → 回頭調 adapter

### Phase 2 — 批次遷移（可 delegate agent）

依複雜度排序：
- 無 state：`compact` / `resume` / `rewind` / `new-conversation` / `usage` / `view-help` / `switch-account` / `reload-plugins` / `mention-file` / `attach-file` / `manage-plugins` / `mcp-servers` / `mcp-status` / `general-config` / `open-settings`
- 有 state（toggle / select）：`fast-mode` / `thinking` / `color-theme` / `density` / `effort` / `model`
- 複雜（slash 合併）：`btw`
- Palette-only：`filters` / `raw-panel`

每遷完一組跑 vitest + typecheck + storybook；若 FakeSummoner 測試出現動靜立即停。

### Phase 3 — 清理

- Registry 移除 legacy shape 支援（若確定無引用）
- 考慮移除 `MenuItemFeature` / `SlashCommandFeature` export（改為 adapter 輸出型別）
- 更新 OpenSpec specs 反映新結構

Rollback：每個 Phase 獨立 commit；出問題只 revert 該 phase，前置可保留。

## Open Questions

- Adapter 之後要不要做成 plugin（registry 可註冊多個 output shape）？現在不做，真需要再談
- `closeSilent` 是否該改名為更通用的 `keepOpenAfterExecute`？既有用法太多，不動
