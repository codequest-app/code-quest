## ADDED Requirements

### Requirement: Feature type defines capability as pure data

`packages/client/src/lib/feature.ts` SHALL export `Feature` interface：

```ts
interface Feature {
  id: string;
  label: string;
  category: string;
  order?: number;
  description?: string;
  disabled?: boolean;
  state?: FeatureState;
  execute(): void;
  slash?: { command: string; match?(msg: string): boolean; invoke(msg: string): void };
  ui?: { closeSilent?: boolean; matchFirstToken?: boolean; filterOnly?: boolean };
}

type FeatureState =
  | { kind: 'toggle'; active: boolean }
  | { kind: 'tri-state'; state: 'all' | 'partial' | 'none'; onPartial?: () => void }
  | { kind: 'select'; currentValue: string };
```

Feature factory 回傳值 MUST 為 `Feature` 或 `Feature[]`，且 MUST NOT import React / JSX。

#### Scenario: Factory returns plain object without React

- **WHEN** 呼叫 `createClearFeature({ clearMessages, clearModifiedFiles, sendMessage })`
- **THEN** 回傳物件符合 `Feature` shape（有 `id`, `label`, `category`, `execute`）
- **AND** 呼叫 `feature.execute()` 觸發 `clearMessages` + `clearModifiedFiles` + `sendMessage('/clear')`
- **AND** 該 factory 檔案為 `.ts`（非 `.tsx`）

### Requirement: toMenuItem adapter converts Feature to MenuItemFeature

`lib/adapters/to-menu-item.tsx` SHALL export `toMenuItem(f: Feature): MenuItemFeature`。

Mapping rules：
- `menuItem.label = f.label`
- `menuItem.section = f.category`
- `menuItem.order = f.order`
- `menuItem.closeSilent = f.ui?.closeSilent ?? (f.state?.kind === 'toggle')`
- `menuItem.matchFirstToken = f.ui?.matchFirstToken`
- `menuItem.filterOnly = f.ui?.filterOnly`
- `menuItem.trailing = renderMenuTrailing(f.state)`
- `execute = f.execute`

#### Scenario: Plain feature without state

- **WHEN** 輸入 `{ id: 'clear', label: 'Clear', category: 'Context', order: 0, execute }`
- **THEN** 回傳 `{ id, menuItem: { label: 'Clear', section: 'Context', order: 0, closeSilent: false, trailing: undefined }, execute }`

#### Scenario: Toggle state implies closeSilent

- **WHEN** feature 有 `state: { kind: 'toggle', active: true }`
- **THEN** adapter 產出 `menuItem.closeSilent === true`

#### Scenario: ui.closeSilent overrides state-based default

- **WHEN** feature 有 `state: { kind: 'toggle', ... }` 且 `ui: { closeSilent: false }`
- **THEN** adapter 產出 `menuItem.closeSilent === false`

### Requirement: toPaletteCommand adapter

`lib/adapters/to-palette-command.tsx` SHALL export `toPaletteCommand(f: Feature)` 回傳 palette 使用的 shape（`{ id, label, category, description?, trailing, onExecute }`）。

#### Scenario: Execute maps to onExecute

- **WHEN** 輸入 Feature execute = fn
- **THEN** 回傳物件 `onExecute === fn`（同參考）

### Requirement: toSlashCommand adapter

`lib/adapters/to-slash-command.ts` SHALL export `toSlashCommand(f: Feature): SlashCommandFeature | null`。
無 `f.slash` 則回 `null`；有則回 `{ id, command, match, invoke }`。

#### Scenario: Feature without slash field

- **WHEN** 輸入 feature 無 `slash`
- **THEN** 回 `null`

#### Scenario: Feature with slash field

- **WHEN** 輸入 feature 有 `slash: { command: '/btw', ... }`
- **THEN** 回 `{ id, command: '/btw', ... }`

### Requirement: Trailing renderers share state-to-JSX mapping

`lib/adapters/trailing-renderers.tsx` SHALL export `renderMenuTrailing(state?)` 與 `renderPaletteTrailing(state?)`。

對應規則：
- `state.kind === 'toggle'` → `<ToggleSwitch isOn={state.active} />`
- `state.kind === 'tri-state'` → `<FilterIndicator state={state.state} onPartial={state.onPartial} />`
- `state.kind === 'select'` → `<span class="text-text-muted text-[11px]">{state.currentValue}</span>`
- `state == undefined` → `undefined`

第一版 `renderPaletteTrailing === renderMenuTrailing`（共用）。

#### Scenario: Toggle renders ToggleSwitch

- **WHEN** `renderMenuTrailing({ kind: 'toggle', active: true })`
- **THEN** 結果渲染出 `<ToggleSwitch>` 元件且 `isOn` 為 `true`

### Requirement: FeatureRegistry supports Feature shape

`FeatureRegistry` SHALL 提供 `getFeatures(): Feature[]` 新方法。既有 `getMenuItemFeatures()` / `getSlashCommand(cmd)` 內部走對應 adapter，對外行為（回傳型別、match 邏輯）不變。

#### Scenario: getFeatures returns registered features

- **WHEN** 註冊 3 個 Feature
- **THEN** `getFeatures()` 回 3 元素陣列

#### Scenario: getMenuItemFeatures continues to work

- **WHEN** 註冊含 Feature 與舊 MenuItemFeature（legacy shape）各一
- **THEN** `getMenuItemFeatures()` 回 2 個 MenuItemFeature（Feature 的經 toMenuItem 轉換）
