---
name: tailwind-v4
description: >
  Tailwind CSS v4 styling with @theme, @utility, and @custom-variant directives.
  Use when styling components, configuring design tokens, adding custom utilities,
  migrating from v3, or converting hardcoded colors to theme tokens.
---

# Tailwind CSS v4

## Overview

Tailwind v4 is CSS-first: no `tailwind.config.js`, no PostCSS config. Everything lives in CSS via directives.

## Setup (Vite)

```bash
pnpm add tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
```

```css
/* App.css */
@import "tailwindcss";
```

No `content` globs needed — auto-detected. No autoprefixer — Lightning CSS handles it.

## v3 → v4 Key Changes

| v3 | v4 |
|---|---|
| `tailwind.config.js` | `@theme` in CSS |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| `darkMode: 'class'` | `@custom-variant dark` |
| `content: [...]` | Auto-detected |
| PostCSS required | `@tailwindcss/vite` plugin |
| Container query plugin | Built-in `@container` |

## Theme Configuration (`@theme`)

```css
@theme {
  --color-brand: oklch(0.65 0.22 260);
  --font-display: "Cal Sans", sans-serif;
  --breakpoint-xs: 30rem;
}
```

- `@theme` → generates CSS variables AND utility classes
- `:root` → CSS variables only, no utilities
- `--color-*: initial;` → wipe namespace defaults
- `@theme inline` → for tokens referencing other variables
- `@theme static` → force-generate even if unused

## Custom Utilities & Variants

```css
@utility scrollbar-hidden {
  &::-webkit-scrollbar { display: none; }
}

@custom-variant dark (&:where(.dark, .dark *));
```

## Styling approach priority

1. **Tailwind utility classes in JSX** — default
2. **`@theme` tokens** — new color/shadow/font value (generates utility + CSS var)
3. **`@utility` directive** — reusable effect with modifier support (`hover:`, `dark:`)
4. **`@layer base` with `[data-*]` selectors** — third-party DOM you can't add className to (Markdown, CMS)

`@apply` is rarely the right choice. For React/Vue components, keep utility classes directly in JSX (markup + styles together).

## Responsive Design

- **Viewport** (`md:`, `lg:`) → page layout
- **Container** (`@container` + `@md:`) → component internals

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row">
</div>
```

## Dark Mode / Theme axis

```css
/* OS preference (default) */
@import "tailwindcss";

/* Class-based toggle */
@custom-variant dark (&:where(.dark, .dark *));

/* Data attribute (project convention) */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

## Project-specific: preference axes

此專案用 `:root[data-*]` 管理使用者偏好，每個 axis 影響不同 utility 群：

```css
:root[data-theme="dark|light"]     /* 重載 --color-* 值 → 影響 bg-/text-/border- utility */
:root[data-font="sm|md|lg"]        /* font-size: 14/16/18px → rem-based utility 等比縮放 */
:root[data-density="comfortable|compact"]  /* 重載 --spacing → p/m/gap utility 等比縮放 */
```

**寫 utility 時的 axis 考量：**

- ✅ **rem-based** (Tailwind 內建 utility 如 `text-xs` / `p-4` / `w-6`) 會跟著 `data-font` 縮放
- ✅ **em-based** (`tracking-wider` / `text-[0.9em]`) 會跟著父元素字級縮放
- ⚠️ **px arbitrary** (`text-[13px]` / `p-[10px]` / `gap-[6px]`) **不縮放**，`data-font=lg` 時字放大但 padding 不變，比例跑掉

包文字的元素（button / chip / badge）優先用 rem-based utility，避免 axis 切換時視覺破版。

## 優先內建 utility，不用 arbitrary value

遇到 `[Npx]` / `[Nrem]` / `[rgba(...)]` 先檢查能否改內建。差 1-2px 就近取（設計系統一致性 > pixel-perfect）。

### Spacing（`p/m/w/h/gap/top/left/right/bottom`）

預設 `--spacing: 0.25rem`，所以 `N` = 4N px。Tailwind v4 支援任意整數：`w-160` = 640px。半步只有 `0.5/1.5/2.5/3.5`。

| px | Tailwind | px | Tailwind |
|---|---|---|---|
| 2 | `0.5` | 24 | `6` |
| 4 | `1` | 32 | `8` |
| 6 | `1.5` | 40 | `10` |
| 8 | `2` | 48 | `12` |
| 10 | `2.5` | 64 | `16` |
| 12 | `3` | 96 | `24` |
| 14 | `3.5` | 任意 4N | `N` |
| 16 | `4` | 200 | `50` |
| 20 | `5` | 640 | `160` |

### 其他內建 scale

- **Rounded**：`rounded-sm`(2) / `rounded`(4) / `rounded-md`(6) / `rounded-lg`(8) / `rounded-xl`(12) / `rounded-2xl`(16) / `rounded-full`
- **Text size**：`text-xs`(12) / `text-sm`(14) / `text-base`(16) / `text-lg`(18) / `text-xl`(20) / `text-2xl`(24) — 不使用自訂 token
- **Tracking**（em-based）：`tracking-tighter`(-0.05em) / `tight`(-0.025) / `normal`(0) / `wide`(0.025) / `wider`(0.05) / `widest`(0.1)
- **Leading**：`leading-none`(1) / `tight`(1.25) / `snug`(1.375) / `normal`(1.5) / `relaxed`(1.625) / `loose`(2)

### Arbitrary value 正當情境

- 計算值：`max-h-[calc(100vh-64px)]`
- 動態 CSS variable：`bg-[linear-gradient(...var(--X)...)]`
- 沒有對應的刻意 off-grid 值（如 `w-[26px]` icon — review 時確認是否真需要 26 而非 24/28）

## Opacity modifier（v4 推薦）

`--color-X` 是 hex token 時，直接用 opacity modifier 產生半透明：

```tsx
<div className="bg-accent/10" />        // ✅ v4 modifier
<div className="text-text-muted/60" />  // ✅ 3-tier opacity
```

### 3-tier text opacity（專案慣例）

文字 muted 層級收斂到三階，其他值（/50、/70、/80）避免：

| class | 用途 |
|---|---|
| `text-text-muted` | primary muted（次要文字） |
| `text-text-muted/60` | faint（placeholder、disabled-ish） |
| `text-text-muted/40` | super faint（gutter、decorator） |

早期 pre-v4 的 `rgba(var(--color-X-rgb), 0.N)` 模式改用 modifier：

```tsx
<div className="bg-[rgba(var(--color-accent-rgb),0.1)]" />  // legacy，改 bg-accent/10
```

## cn() helper（clsx + twMerge）

專案 `utils/cn` 包 `twMerge(clsx(...))`，提供：

- `clsx` — conditional className 組合
- `twMerge` — **自動解決 Tailwind class 衝突**

```tsx
// Button 內部: cn('px-3 py-1', className)
<Button className="px-6" />       // 結果 "py-1 px-6"（px-3 被覆蓋）
<Button className="bg-red-500" /> // primary bg-accent 被覆蓋
```

Component composition 放心用 `className` prop override，不用擔心 CSS 順序。

## 此專案已有的 @utility

（`packages/client/src/App.css`）

- `dialog-viewport` — `max-w: calc(100vw - 2rem); max-h: calc(100vh - 4rem);`
- `floating-popover-lg` / `floating-popover-sm` — gradient bg + layered shadow for CommandPalette / FilterPopover
- `inset-border` — `box-shadow: inset 0 0 0 1px var(--color-border);` 不佔 layout 空間的 1px 邊框

抽新 `@utility` 的時機：**相同 pattern 重複 3+ 處**。

## Semantic z-index tiers

用 theme token 對應語意層級：

| Tier | Value | 用途 |
|---|---|---|
| `z-raised` | 1 | in-content stacking（dot over line, icon over bg） |
| `z-sticky` | 10 | sticky/overlay within a section |
| `z-float` | 30 | floating buttons（scroll-to-bottom） |
| `z-overlay` | 40 | backdrop behind modals |
| `z-modal` | 50 | dialogs, dropdowns（default modal layer） |
| `z-popover` | 60 | popovers that must render above modals |
| `z-palette` | 70 | command palette（above everything） |

## Testing with Tailwind

- **斷言 semantic token** 可接受當行為契約：`toHaveClass('z-modal')`、`toMatch(/\bbg-accent\b/)`
- **斷言任意 utility 值**（`p-4`、`w-5`）避免 — 微調 padding/尺寸時易破測試
- 優先 `getByRole` / `getByText` / `getByTestId` 而非 class selector
- `data-*` 屬性雙用（樣式 + 測試）：
  ```tsx
  <div data-state="open" className="data-[state=open]:block hidden" />
  ```
- JSDOM 不處理 CSS — 視覺斷言用 Playwright

## Decision Tree: Where Does This Style Go?

```
新的顏色 / shadow / font 值？
  → @theme（產生 token + utility class）

可重用的效果（glow / scrollbar / gradient）？
  → @utility（支援 hover:, focus:, dark: modifier）

無法加 className 的第三方 DOM（Markdown / CMS）？
  → @layer base + [data-*] selector

其他情況？
  → 直接在 JSX 用 Tailwind utility
```

## Quick Reference

| Directive | Purpose |
|---|---|
| `@import "tailwindcss"` | Entry point |
| `@theme { }` | Design tokens → utilities |
| `@custom-variant` | Custom variants (dark, etc.) |
| `@utility` | Custom utility with modifier support |
| `@layer base/components/utilities` | Custom CSS in cascade layers |
