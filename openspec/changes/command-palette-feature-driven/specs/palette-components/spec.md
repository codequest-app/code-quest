## ADDED Requirements

### Requirement: PaletteMessageList component

`components/palette/PaletteMessageList.tsx` SHALL provide a list of messages with search / highlight / keyboard nav / click-to-jump. Props as per design D2.

Behavior：
- `query === ''` → 顯示最後 `recentCount`（預設 8）則 visible message
- `query !== ''` → filter by `preview.toLowerCase().includes(query.toLowerCase())`，上限 `searchLimit`（預設 50）
- 每 row 顯示 type badge（color + label）+ preview（high-lit matched substring）
- Row click → `onJumpTo(id)` + `onClose()`
- 空結果時 render null（parent 決定怎麼顯示）

#### Scenario: Renders recent messages with empty query

- **WHEN** `<PaletteMessageList messages={[m1..m10]} query="" recentCount={3} ...>`
- **THEN** DOM 顯示最後 3 則 row

#### Scenario: Filters by query case-insensitively

- **WHEN** messages 有 "Hello World"、"GoodBye"，query = "hello"
- **THEN** 只顯示 "Hello World" 的 row

#### Scenario: Highlights matched substring

- **WHEN** query "lo" 對 title "Hello"
- **THEN** row 內 "lo" 段以 `<mark>` 或 highlighted span 渲染

#### Scenario: Click triggers onJumpTo and onClose

- **WHEN** 使用者點擊某 message row
- **THEN** `onJumpTo(msg.id)` 呼叫一次
- **AND** `onClose()` 呼叫一次

#### Scenario: Active index drives active styling

- **WHEN** prop `activeIdx={2}`
- **THEN** 第 3 個 row 具有 active 視覺標示（測試可檢查 className / aria-current）

### Requirement: PaletteCommandList component

`components/palette/PaletteCommandList.tsx` SHALL render `Feature[]` grouped by `category`, filtered by `query`, with trailing produced by `toPaletteCommand` adapter.

Behavior：
- 分組依 `feature.category`，首次出現順序
- 同組內按 `feature.order` asc
- `query !== ''` → 保留 `label.toLowerCase().includes(query.toLowerCase())` 的 features
- 每 row click → `feature.execute()`（或 caller 傳 `onExecute(feature)` override）
- trailing 渲染由 `toPaletteCommand(f).trailing` 提供（共用 adapter 邏輯）
- active id 由 parent 控制（鍵盤 nav）

#### Scenario: Groups features by category

- **WHEN** features `[{category:'Filters'},{category:'Settings'},{category:'Filters'}]`
- **THEN** DOM 出現兩個 section header: Filters, Settings，Filters section 有 2 items

#### Scenario: Empty query shows all

- **WHEN** `query = ''` with 5 features
- **THEN** 渲染 5 個 row

#### Scenario: Query filters case-insensitively

- **WHEN** features labels `['Switch theme', 'Toggle density']`，query `'theme'`
- **THEN** 只顯示 'Switch theme'

#### Scenario: Row click fires execute

- **WHEN** 點 row
- **THEN** 對應 feature 的 `execute()` 呼叫一次
- **AND** 若 `onExecute` prop 傳入，改用它（不呼叫 feature.execute）

#### Scenario: Trailing comes from adapter

- **WHEN** feature 有 `state: { kind: 'toggle', active: true }`
- **THEN** row trailing 渲染 `<ToggleSwitch>`（由 `renderPaletteTrailing` 決定）

### Requirement: message-preview utility

`utils/message-preview.ts` SHALL export pure helpers：`highlight(text, query)`, `typeColor(type)`, `typeLabel(type)`。行為等同原本 CommandPalette inline 版本。

#### Scenario: highlight splits text into match/non-match segments

- **WHEN** `highlight('Hello World', 'world')`
- **THEN** 回 `[{text: 'Hello ', match: false}, {text: 'World', match: true}, {text: '', match: false}]`

#### Scenario: typeColor falls back for unknown type

- **WHEN** `typeColor('unknown_type')`
- **THEN** 回預設色（e.g. `#6a6a6e`）
