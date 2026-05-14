## ADDED Requirements

- 新增 `components/ui/TextField.tsx`，渲染 `bg-surface border border-border rounded px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none`
- 接受 `as` prop（`'input'` | `'textarea'`，預設 `'input'`）、`className`，以及對應元素的原生 props
- `mono` prop（boolean）：加入 `font-mono` class，用於 code/path 輸入
- `size` prop：`'sm'`（`px-2 py-1 text-xs`）| `'md'`（預設，`px-3 py-1.5 text-sm`）
- 取代以下地方的 inline 樣式：
  - `components/settings/AuthDialog.tsx` — username/password input
  - `components/settings/InitOptionsDialog.tsx` — textarea 欄位
  - `components/settings/MarketplaceSection.tsx` — config path input
  - `components/settings/McpServerRow.tsx` — mono input
  - `components/spec/NewChangeDialog.tsx` — change name input
  - `components/files/NewEntryDialog.tsx` — file name input
  - `components/files/FileTreeRow.tsx` — inline rename input
