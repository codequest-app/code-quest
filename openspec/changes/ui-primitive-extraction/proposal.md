# UI Primitive Extraction

## What

將分散在各元件的重複 className pattern 和 class 常數字串，抽取成可重用的 UI primitive 元件，集中放在 `components/ui/`。

## Why

全量掃描（5 個 sub-agent，覆蓋全部 web component 目錄）後發現：
- 至少 **12 種** 高頻 className pattern 以字串形式重複出現在 3–6 個檔案
- **10+ 個** `const *_CLASS` / `*_STYLE` 字串常數散落各檔，功能重疊但互不引用
- design token 要改時需要搜尋所有 className 字串；若抽成元件，改一處即可

## Scope

新增 UI primitives：
1. **`Badge`** — 通用 badge/chip（取代所有 `px-1.5 py-0.5 rounded ... text-xs` 字串）
2. **`StatusBadge`** — MCP/連線狀態 badge（合併 ManageMcpDialog 和 McpServerRow 的重複 mapping）
3. **`StatusDot`** — 小圓點狀態 indicator（`w-1.5 h-1.5 rounded-full` + 顏色）
4. **`MenuItem` / `MenuContent`** — dropdown/popover row 和 container（取代 `MENU_ITEM_CLASS`、`MENU_CONTENT_CLASS` 及各地手寫的重複字串）
5. **`DialogFooter`** — dialog 底部 action row（`flex justify-end gap-2 pt-2 border-t border-border`，兩種 variant）
6. **`InlineCode`** — 行內 code（`font-mono bg-surface px-1 rounded`）
7. **`SectionLabel`** — 區塊分組標題（統一 `section-label` CSS class 和手寫 Tailwind 的分裂）
8. **`SurfaceCard`** — list card row（`bg-surface border border-border rounded p-3 mb-2`）
9. **`GhostAddButton`** — dashed border 新增按鈕（`border-dashed border-border hover:border-accent`）

消費者（需更新的檔案）：
- ManageMcpDialog、McpServerRow、InstalledPluginList、MarketplaceSection（Badge / StatusBadge / SurfaceCard）
- BranchPopover、TopScopeSwitcher、context-menu-styles.ts（MenuItem / MenuContent / SectionLabel）
- NewChangeDialog、ArchiveChangeDialog、DiffModal、FilePreviewModal、SpecModal、AddProjectDialog、CreateWorktreeDialog（DialogFooter）
- ProjectRow、ProjectTree、WorktreeChildList（GhostAddButton）
- SystemBlocks、TaskBadge、NodeContent（Badge / InlineCode）

## Out of Scope

- `DropdownItem` 在 compose 區域（有各自細節差異，先觀察）
- `SmallButton` / `ACTION_BTN`（Button 元件的 `size="xs"` 可能已涵蓋，需驗證後再決定）
- `MonoText`（只是 `font-mono`，抽元件 overhead 大於收益）
- Dialog header slot 增強（獨立 change，避免範圍蔓延）
