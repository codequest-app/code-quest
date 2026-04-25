---
name: tailwind-v4
description: >
  Tailwind CSS v4 styling with @theme, @utility, and @custom-variant directives.
  Use when styling components, configuring design tokens, adding custom utilities,
  migrating from v3, or converting hardcoded colors to theme tokens. Enforces
  token-first design flow: look up existing @theme tokens before reaching for
  arbitrary values, and extend @theme when a design exceeds the token range
  rather than sprinkling ad-hoc `[Npx]` / `[#hex]` values.
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

## Design flow: token-first

設計 UI 時**先看 design token，再考慮 utility**。不要遇到設計稿的值就寫 arbitrary（`text-[13px]` / `bg-[#3a7]` / `p-[7px]`）。

**正確順序（寫 JSX 前跑一遍）：**

1. **先查既有 token** — 需要的顏色 / 字級 / 間距 / radius / shadow / z-index 是否已經在 `@theme` 或內建 scale？
   - 顏色：`grep "^\s*--color-" packages/client/src/App.css`
   - Spacing / text / z：用「優先內建 utility」表對照
2. **差 1–2px / 1–2 階 → 就近取** — design system 的一致性 > pixel-perfect。`13px` 取 `text-xs` 或 `text-sm`、`#3a7d5e` 取 `text-success`。
3. **超出既有 token 範圍 → 先擴 token，不要寫 arbitrary**
   - 新色階：加 `--color-X` 到 `@theme`
   - 新語意層級（z-index、muted tier、shadow）：加對應 `--*` token
   - 新可重用效果：抽 `@utility`
4. **只有這些 arbitrary 值是合法的**（見下方「Arbitrary value 正當情境」）：
   - `calc(...)` 計算值
   - 引用動態 CSS variable
   - 刻意 off-grid 且有清楚理由（icon 尺寸、對齊特定視覺錨點）

**不要這樣做**：

```tsx
// ❌ 為了新設計稿直接寫 arbitrary
<div className="bg-[#2a4a6e] text-[13px] p-[7px] shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />

// ✅ 先把需要的值加進 @theme，再用 semantic utility
// App.css:  --color-surface-sunken: oklch(...); --shadow-card: 0 2px 8px rgba(0,0,0,0.4);
<div className="bg-surface-sunken text-xs p-2 shadow-card" />
```

**特別 callout — literal-pixel arbitraries**：

**任何** `\w+-[Npx]`（`text-[13px]` / `h-[38px]` / `max-h-[480px]` / `max-w-[180px]` 等）**明確禁止**。

收斂規則：
- text size: `text-[1Npx]` → `text-xs` (12px) 或 `text-2xs` (10px) chip token
  - `text-2xs` 限：uppercase tracked chip badges、section-heading utility（`section-label` 用 `font-size: var(--text-2xs)` 而非 hardcoded `10px`）
  - body / link / hint / dialog 文字：用 `text-xs`，**不要**用 `text-2xs`
- height / width / spacing: 走 Tailwind v4 整數 spacing — `h-9` (36)、`max-h-120` (480)、`max-w-45` (180) 等。專案 `--spacing: 0.21875rem`，所以 `N × 0.21875rem` = N × 3.5px（注意：不是預設的 4px）
- chip / badge 視覺重量靠 `tracking-wider` + `bg-x/10` + 弱化色控制，不是縮字
- 沒有 px arbitrary 例外——`backdrop-blur` 用 Tailwind 最小 `xs` (4px)，其他都 N × 3.5px 就近取

**注意：本專案 `--spacing: 0.21875rem`**（密度 axis 縮 87.5%），所以 Tailwind 預設「N = 4px」**不適用**——本專案 `N = 3.5px`：
- `h-9` = 31.5px、`h-10` = 35px、`h-11` = 38.5px
- `max-w-50` = 175px、`max-w-51` = 178.5px
- `max-h-120` = 420px（不是 480px）—— 4 處重複的 480px dialog body 抽 `@utility max-h-dialog-body { max-height: 30rem; }`，30rem 直接用 rem 不靠 spacing 計算

guard test: `packages/client/src/utils/__tests__/no-arbitrary-utility.test.ts` 掃 components + stories，PR 加新 `\w+-[Npx]` 時擋下來。

**為什麼**：
- arbitrary 值無法透過 `data-theme` / `data-font` / `data-density` axis 重載，使用者切主題或調密度時視覺破版。
- token 有語意（`accent` / `surface-sunken` / `shadow-card`）；arbitrary 只是 raw value，下一個讀者看不出意圖。
- 設計系統收斂：同一個顏色 / 尺寸出現在 5 個地方，都指向同一 token，之後微調改一處即可。

**Review 時的判準**：看到 `[...]` 先問「為什麼不是 token？」——如果答案是「設計稿就這樣」而沒有 arbitrary 正當情境，先調 token。

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

## 優先內建 utility

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

文字 muted 層級收斂到三階，需要更細層級時優先重新評估 hierarchy：

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

## 相關 skill

- Component / hook 慣例（useRef / useEffect 影響 class 計算）→ `react-hooks`
- Storybook stories 搭配樣式確認 → `storybook-component`
- Icon 慣例（heroicons facade、custom SVG 情境）→ `cc-office-review`
- className 斷言在測試中的寫法 → `frontend-testing` / `testing-best-practices`
