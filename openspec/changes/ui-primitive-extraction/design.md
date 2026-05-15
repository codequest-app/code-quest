# Design: UI Primitive Extraction

## 原則

- 每個新元件放在 `apps/web/src/components/ui/`
- 舊的 class 常數（`MENU_ITEM_CLASS` 等）待消費者全部切換後再刪
- 每個元件完成後立即跑 `pnpm test` 確認 baseline
- 不改元件行為，只改包裝方式（重構，非功能變更）

## 元件設計

### 1. `Badge`

```tsx
// components/ui/Badge.tsx
interface BadgeProps {
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'warning' | 'muted'
  mono?: boolean        // font-mono
  size?: 'sm' | 'xs'   // sm = text-xs px-1.5 py-0.5, xs = text-2xs px-1 py-px
  border?: boolean      // 是否有 border
  className?: string
  children: React.ReactNode
}
```

取代：
- `SystemBlocks.tsx:158` `px-1.5 py-0.5 rounded bg-accent/20 text-accent text-xs font-mono`
- `TaskBadge.tsx:46` 同上
- `ManagePluginsDialog.tsx:91` `bg-button text-selected-text rounded-lg px-1.5 py-0.5 text-xs`
- `SpecPane.tsx:123,133,142` 的 spec status badge
- `WorktreeRow.tsx:105` running status badge

Design token 對應（variant → classes）：
```
default:  bg-surface text-text border-border
accent:   bg-accent/20 text-accent border-accent/30
success:  bg-success/10 text-success border-success/30
danger:   bg-danger/10 text-danger border-danger/30
warning:  bg-warning/10 text-warning border-warning/30
muted:    bg-muted/30 text-muted border-border
```

---

### 2. `StatusBadge`

合併 `ManageMcpDialog.STATUS_CONFIG` 和 `McpServerRow.MCP_STATUS_BADGE` 兩套重複的 MCP 狀態 mapping。

```tsx
// components/ui/StatusBadge.tsx
type McpStatus = 'connected' | 'disconnected' | 'connecting' | 'pending' | 'error' | 'disabled'
interface StatusBadgeProps {
  status: McpStatus
  className?: string
}
```

- 移入 shared status → label/badge-class mapping
- ManageMcpDialog 和 McpServerRow 都 import 這個元件

---

### 3. `StatusDot`

```tsx
// components/ui/StatusDot.tsx
interface StatusDotProps {
  color?: 'success' | 'warning' | 'danger' | 'muted'
  pulse?: boolean
  size?: 'sm' | 'md'  // sm = w-1 h-1, md = w-1.5 h-1.5（預設）
}
```

取代：
- `TopbarLiveSessions.tsx` 的 `DOT_CLASS` mapping
- `FilterPopover.tsx:46` 的 colored dot
- `TabBar.tsx:97` 的 status dot
- `WorktreeRow.tsx:105` 的 animate-pulse success dot

---

### 4. `MenuItem` + `MenuContent`

```tsx
// components/ui/MenuItem.tsx
interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger'
  highlighted?: boolean   // data-[highlighted] state（Radix 相容）
  as?: 'button' | 'div'
}

// components/ui/MenuContent.tsx
interface MenuContentProps {
  minWidth?: string   // 預設 'min-w-45'
  className?: string
  children: React.ReactNode
}
```

取代：
- `context-menu-styles.ts` 的 `MENU_ITEM_CLASS`、`DANGER_MENU_ITEM_CLASS`、`MENU_CONTENT_CLASS`
- `BranchPopover.tsx` 手寫的 menu row（px-3 py-1.5 text-sm hover:bg-hover-tint）
- `TopScopeSwitcher.tsx` 手寫的 menu row

---

### 5. `DialogFooter`

```tsx
// components/ui/DialogFooter.tsx
interface DialogFooterProps {
  variant?: 'inline' | 'bleed'
  // inline: pt-2 border-t border-border（預設）
  // bleed:  -mx-4 -mb-4 px-4 py-3 border-t border-border
  align?: 'end' | 'start' | 'between'
  children: React.ReactNode
}
```

取代：`flex justify-end gap-2 pt-2 border-t border-border` 出現於 5 個 dialog + 2 個 bleed variant。

---

### 6. `InlineCode`

```tsx
// components/ui/InlineCode.tsx
// 極簡，只有 className 擴充
interface InlineCodeProps {
  className?: string
  children: React.ReactNode
}
// 渲染：<code className={cn('font-mono bg-surface px-1 rounded text-xs', className)}>
```

取代：`ManageMcpDialog.tsx:109` 和類似的行內 `<code>` 元素。

---

### 7. `SectionLabel`

目前 `App.css` 已有 `@utility section-label`，但有些地方沒用它，改用手寫 Tailwind。

```tsx
// components/ui/SectionLabel.tsx
interface SectionLabelProps {
  as?: 'h3' | 'h4' | 'div' | 'span'  // 預設 'div'
  className?: string
  children: React.ReactNode
}
// 渲染：<As className={cn('section-label', className)}>
```

讓 `BranchPopover`、`TopScopeSwitcher`、`ManageMcpDialog` 等改用這個元件，消除手寫的 `font-semibold uppercase tracking-wider text-text-muted` 字串。

---

### 8. `SurfaceCard`

```tsx
// components/ui/SurfaceCard.tsx
interface SurfaceCardProps {
  as?: 'div' | 'li' | 'button'
  className?: string
  children: React.ReactNode
}
// 渲染：<As className={cn('bg-surface border border-border rounded p-3', className)}>
```

取代：ManageMcpDialog、InstalledPluginList、MarketplaceSection 的 `bg-surface border border-border rounded p-3 mb-2` 重複。

---

### 9. `GhostAddButton`

```tsx
// components/ui/GhostAddButton.tsx
interface GhostAddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}
// 渲染：<button className={cn('text-xs rounded border border-dashed border-border text-text-muted hover:text-text hover:border-accent', className)}>
```

取代：ProjectRow、ProjectTree、WorktreeChildList 的 dashed add button。

---

## 實作順序

1. 最獨立、無相依的先做：`StatusDot` → `InlineCode` → `SectionLabel` → `GhostAddButton`
2. 需要 design token mapping 的：`Badge` → `StatusBadge`
3. 影響最多檔案的：`MenuItem` / `MenuContent` → `DialogFooter` → `SurfaceCard`
4. 每個元件完成後跑 `pnpm test` 確認

## 驗證

- `pnpm test` 全程 green（238 files）
- TypeScript 型別檢查通過（pre-commit hook）
- 各元件目視確認：dark + light 主題下外觀不變
