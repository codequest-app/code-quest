# Quick Reference Handbook
# 快速參考手冊

**For**: Developers, Designers, QA Engineers
**Last Updated**: 2026-02-05
**Print**: This document is designed to be printed as a quick desk reference

---

## Table of Contents
## 目錄

1. [Color Palette](#color-palette)
2. [Typography Scale](#typography-scale)
3. [Spacing Scale](#spacing-scale)
4. [Breakpoints](#breakpoints)
5. [Animation Timings](#animation-timings)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Component Quick Finder](#component-quick-finder)
8. [Screen Quick Finder](#screen-quick-finder)
9. [Flow Quick Finder](#flow-quick-finder)
10. [Common Patterns](#common-patterns)

---

## Color Palette
## 顏色調色板

### Primary Colors (主色調)

| Color | Hex | Usage | CSS Variable |
|-------|-----|-------|--------------|
| ███ Primary Green | `#4caf50` | Explore mode, success, HP (healthy) | `--primary-green` |
| ███ Primary Red | `#f44336` | Battle mode, danger, HP (low) | `--primary-red` |
| ███ Primary Blue | `#2196f3` | Info, MP | `--primary-blue` |

### Functional Colors (功能色)

#### Status Colors (狀態顏色)

| Color | Hex | Usage | CSS Variable |
|-------|-----|-------|--------------|
| ███ HP Red | `#f44336` | Health points | `--hp-color` |
| ███ MP Blue | `#3498DB` | Magic points | `--mp-color` |
| ███ EXP Gold | `#F39C12` | Experience points | `--exp-color` |
| ███ Gold Bright | `#FFD700` | Currency | `--gold-color` |

#### Feedback Colors (反饋顏色)

| Color | Hex | Usage | CSS Variable |
|-------|-----|-------|--------------|
| ███ Success | `#10b981` | Success messages, completion | `--success-color` |
| ███ Warning | `#F59E0B` | Warnings, cautions | `--warning-color` |
| ███ Error | `#EF4444` | Errors, failures | `--error-color` |
| ███ Info | `#3B82F6` | Information, hints | `--info-color` |

#### Element Types (元素類型)

| Color | Hex | Element Type |
|-------|-----|--------------|
| ███ | `#00ccff` | code-task |
| ███ | `#ff0066` | bug-hunt |
| ███ | `#9900ff` | architecture |
| ███ | `#ffcc00` | documentation |
| ███ | `#00ff99` | testing |
| ███ | `#ff9900` | optimization |
| ███ | `#999999` | general |

#### Async Battle Status (異步戰鬥狀態)

| Color | Hex | Status | Icon |
|-------|-----|--------|------|
| ███ | `#ff6b6b` | Running | 🔴 |
| ███ | `#ffd93d` | Paused | 🟡 |
| ███ | `#6bcfff` | Queued | 🔵 |
| ███ | `#51cf66` | Complete | 🟢 |
| ███ | `#868e96` | Failed | ⚫ |

### Neutral Colors (中性色)

#### Backgrounds (背景)

| Color | Hex | Usage | CSS Variable |
|-------|-----|-------|--------------|
| ███ | `#1a1a1a` | Primary background | `--bg-primary` |
| ███ | `#2a2a2a` | Secondary background | `--bg-secondary` |
| ███ | `#3a3a3a` | Tertiary background | `--bg-tertiary` |

#### Text (文字)

| Color | Hex | Usage | CSS Variable |
|-------|-----|-------|--------------|
| ███ | `#ffffff` | Primary text | `--text-primary` |
| ███ | `#b8b8b8` | Secondary text | `--text-secondary` |
| ███ | `#808080` | Tertiary text | `--text-tertiary` |
| ███ | `#4a4a4a` | Disabled text | `--text-disabled` |

#### Borders (邊框)

| Color | Hex | Usage | CSS Variable |
|-------|-----|-------|--------------|
| ███ | `#404040` | Primary border | `--border-primary` |
| ███ | `#606060` | Secondary border | `--border-secondary` |
| ███ | `#ffffff` | Highlight border (focus) | `--border-highlight` |

### Mode-Specific Colors (模式專用色)

#### Explore Mode (探索模式)

| Color | Hex | Usage |
|-------|-----|-------|
| ███ | `#1a4d2e` | Background |
| ███ | `#4caf50` | Primary accent |
| ███ | `#81c784` | Secondary accent |

#### Battle Mode (戰鬥模式)

| Color | Hex | Usage |
|-------|-----|-------|
| ███ | `#4d1a1a` | Background |
| ███ | `#f44336` | Primary accent |
| ███ | `#ef5350` | Secondary accent |

---

## Typography Scale
## 字體階梯

### Font Families (字體族)

| Name | Family | Usage | CDN Link |
|------|--------|-------|----------|
| **Title Font** | 'Press Start 2P' | Headings, logos | [Google Fonts](https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap) |
| **Body Font** | 'VT323' | Dialogue, descriptions | [Google Fonts](https://fonts.googleapis.com/css2?family=VT323&display=swap) |
| **UI Font** | 'Roboto Mono' | Buttons, labels | [Google Fonts](https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap) |
| **Code Font** | 'JetBrains Mono' | Code blocks | [Google Fonts](https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap) |

### Font Sizes (字體大小)

| Element | Size (px) | Size (rem) | Font Family | Line Height | Weight |
|---------|-----------|------------|-------------|-------------|--------|
| **H1** | 32px | 2.0rem | Press Start 2P | 1.2 | 400 |
| **H2** | 24px | 1.5rem | Press Start 2P | 1.3 | 400 |
| **H3** | 20px | 1.25rem | Press Start 2P | 1.3 | 400 |
| **H4** | 18px | 1.125rem | VT323 | 1.4 | 400 |
| **Body** | 16px | 1.0rem | VT323 | 1.5 | 400 |
| **Small** | 14px | 0.875rem | Roboto Mono | 1.4 | 400 |
| **Caption** | 12px | 0.75rem | Roboto Mono | 1.4 | 400 |
| **Code** | 14px | 0.875rem | JetBrains Mono | 1.6 | 400 |

### CSS Usage

```css
/* Headings */
h1 { font: 400 32px/1.2 'Press Start 2P', monospace; }
h2 { font: 400 24px/1.3 'Press Start 2P', monospace; }
h3 { font: 400 20px/1.3 'Press Start 2P', monospace; }

/* Body */
body { font: 400 16px/1.5 'VT323', monospace; }

/* UI Elements */
button { font: 700 14px/1.4 'Roboto Mono', monospace; }

/* Code */
code { font: 400 14px/1.6 'JetBrains Mono', monospace; }
```

---

## Spacing Scale
## 間距階梯

**System**: 4px base grid

| Variable | Value | Usage Example |
|----------|-------|---------------|
| `--spacing-1` | 4px | Icon gaps, tight spacing |
| `--spacing-2` | 8px | Button padding (small) |
| `--spacing-3` | 12px | Input padding |
| `--spacing-4` | 16px | Default padding/margin |
| `--spacing-6` | 24px | Section spacing |
| `--spacing-8` | 32px | Large gaps |
| `--spacing-12` | 48px | Screen sections |
| `--spacing-16` | 64px | Major layout spacing |

### Common Patterns

```css
/* Button padding */
padding: 12px 24px; /* spacing-3 spacing-6 */

/* Card padding */
padding: 16px; /* spacing-4 */

/* Section margin */
margin-bottom: 32px; /* spacing-8 */

/* Grid gap */
gap: 16px; /* spacing-4 */
```

---

## Breakpoints
## 響應式斷點

| Device | Min Width | Max Width | Container | Columns | Gutter |
|--------|-----------|-----------|-----------|---------|--------|
| **Mobile** | - | 639px | 100% | 4 | 16px |
| **Tablet** | 640px | 1023px | 768px | 8 | 24px |
| **Desktop** | 1024px | 1439px | 1024px | 12 | 32px |
| **Wide** | 1440px+ | - | 1280px | 12 | 32px |

### CSS Media Queries

```css
/* Mobile-first approach */

/* Mobile (default) */
.container { width: 100%; }

/* Tablet and up */
@media (min-width: 640px) {
  .container { max-width: 768px; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

/* Wide screens */
@media (min-width: 1440px) {
  .container { max-width: 1280px; }
}
```

---

## Animation Timings
## 動畫時序

### Standard Durations (標準時長)

| Speed | Duration | Usage | CSS Variable |
|-------|----------|-------|--------------|
| **Instant** | 100ms | Micro-interactions | `--duration-instant` |
| **Fast** | 150ms | Button hover, input focus | `--duration-fast` |
| **Normal** | 300ms | Modal open/close, standard transitions | `--duration-normal` |
| **Slow** | 500ms | HP/MP changes, state transitions | `--duration-slow` |
| **Very Slow** | 800ms+ | Scene transitions, complex animations | `--duration-vslow` |

### Easing Functions (緩動函數)

| Name | Cubic Bezier | Usage | CSS Variable |
|------|--------------|-------|--------------|
| **Ease In** | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving | `--ease-in` |
| **Ease Out** | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering | `--ease-out` |
| **Ease In-Out** | `cubic-bezier(0.4, 0, 0.6, 1)` | Bidirectional | `--ease-in-out` |
| **Bounce** | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful effects | `--ease-bounce` |

### Specific Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Typewriter | 50ms/char | linear | AI response display |
| MP Change | 300ms | ease-out | MP consumption/recovery |
| HP Change | 500ms | ease-out | HP damage/heal |
| Level Up | 900ms | ease-in-out | Level up flash |
| Floating Text | 1000ms | ease-out | Damage numbers |
| Scene Transition | 400-800ms | custom | Screen changes |

---

## Keyboard Shortcuts
## 鍵盤快捷鍵

### Global Shortcuts (全局快捷鍵)

| Key | Action | Available |
|-----|--------|-----------|
| `Tab` | Next focusable element | All screens |
| `Shift+Tab` | Previous focusable element | All screens |
| `Enter` | Confirm / Activate | All screens |
| `Escape` | Cancel / Close | All screens |
| `Space` | Select / Toggle | All screens |
| `?` | Show keyboard help | All screens |
| `Ctrl+S` (Win) / `Cmd+S` (Mac) | Save | Applicable screens |
| `Ctrl+Z` | Undo | Applicable screens |
| `Ctrl+K` | Command palette | All screens |

### Exploration Mode (探索模式)

| Key | Action | Screen |
|-----|--------|--------|
| `C` | Character status panel | All |
| `K` | Skills panel | All |
| `I` | Inventory | All |
| `P` | Party/Companion management | All |
| `M` | Map | All |
| `Q` | Quest log | All |
| `E` | Interact with object | Field |
| `T` | Talk to NPC | Town |
| `B` | Open shop | Town |
| `W` `A` `S` `D` | Movement | Field |

### Battle Mode (戰鬥模式)

| Key | Action |
|-----|--------|
| `1-9` | Select party member |
| `Ctrl+1-9` | Use quick skill slot |
| `A` | Attack |
| `D` | Defend |
| `S` | Skills menu |
| `F` | Items menu |
| `Space` | Confirm action |
| `Tab` | Next enemy target |
| `Shift+Tab` | Previous enemy target |
| `H` | Show hints |
| `Ctrl+A` | Toggle auto battle |

### Shop/Menu Navigation (商店/菜單導航)

| Key | Action |
|-----|--------|
| `1-7` | Quick access to shops 1-7 |
| `↑` `↓` | Navigate items |
| `←` `→` | Navigate tabs/categories |
| `Enter` | Select item |
| `Escape` | Exit/Back |
| `Home` | First item |
| `End` | Last item |

### Advanced Shortcuts (進階快捷鍵)

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+H` | Toggle hotkey hints | Show/hide keyboard shortcuts on screen |
| `Ctrl+Shift+D` | Developer tools | Open dev console (dev mode only) |
| `Ctrl+R` | Refresh data | Reload current screen data |

---

## Component Quick Finder
## 組件快速查找

**Need a component?** Find it here:

### Layout & Structure (布局與結構)

| I need... | Component | File |
|-----------|-----------|------|
| A button | Button | `04-components/button.md` |
| A panel/container | Panel | `04-components/panel.md` |
| A modal dialog | Modal | `04-components/modal.md` |
| A grid layout | Grid | `04-components/grid.md` |
| A list | List | `04-components/list.md` |
| Tabs | Tabs | `04-components/tabs.md` |
| An accordion | Accordion | `04-components/accordion.md` |

### Forms & Input (表單與輸入)

| I need... | Component | File |
|-----------|-----------|------|
| A text input | Input | `04-components/input.md` |
| A dropdown/select | Dropdown | `04-components/dropdown.md` |
| A checkbox | Checkbox | `04-components/checkbox.md` |
| A radio button | Radio | `04-components/radio.md` |
| A slider | Slider | `04-components/slider.md` |

### Display & Feedback (顯示與反饋)

| I need... | Component | File |
|-----------|-----------|------|
| A progress bar | Progress Bar | `04-components/progress-bar.md` |
| A status bar (HP/MP) | Status Bar | `04-components/status-bar.md` |
| A toast notification | Toast | `04-components/toast.md` |
| Damage numbers | Damage Number | `04-components/damage-number.md` |
| A battle log | Battle Log | `04-components/battle-log.md` |
| A status effect icon | Status Effect | `04-components/status-effect.md` |

### Cards (卡片)

| I need... | Component | File |
|-----------|-----------|------|
| A skill card | Skill Card | `04-components/skill-card.md` |
| An item card | Item Card | `04-components/item-card.md` |
| A companion card | Companion Card | `04-components/companion-card.md` |
| An enemy card | Enemy Card | `04-components/enemy-card.md` |
| A shop item card | Shop Card | `04-components/shop-card.md` |
| A quest card | Quest Card | `04-components/quest-card.md` |

### Navigation (導航)

| I need... | Component | File |
|-----------|-----------|------|
| A menu | Menu | `04-components/menu.md` |
| An action menu | Action Menu | `04-components/action-menu.md` |
| Breadcrumbs | Breadcrumb | `04-components/breadcrumb.md` |

### Utility (實用工具)

| I need... | Component | File |
|-----------|-----------|------|
| A hotkey hint | Hotkey Hint | `04-components/hotkey-hint.md` |

---

## Screen Quick Finder
## 畫面快速查找

**Need a screen design?** Find it here:

### Exploration (探索)

| I need... | Screen | File |
|-----------|--------|------|
| Main town hub | Town Square | `02-screens/exploration/town-square.md` |
| Shopping district hub | Shopping District | `02-screens/exploration/shopping-district.md` |
| Skill shop | Skill Shop | `02-screens/exploration/skill-shop.md` |
| Skill creation | Skill Forge | `02-screens/exploration/skill-forge.md` |
| Knowledge base | Magic Library | `02-screens/exploration/knowledge-library.md` |
| Companion summoning | Mercenary Guild | `02-screens/exploration/mercenary-guild.md` |
| Item storage | Treasure Vault | `02-screens/exploration/treasure-vault.md` |
| Currency exchange | Cost Exchange | `02-screens/exploration/cost-exchange.md` |
| Skill training | Training Ground | `02-screens/exploration/training-ground.md` |
| Worktree management | Guild Hall | `02-screens/exploration/guild-hall.md` |
| AI dialogue | Tavern | `02-screens/exploration/tavern.md` |
| Outdoor areas | Wilderness | `02-screens/exploration/wilderness.md` |
| Dungeon entrance | Dungeon | `02-screens/exploration/dungeon.md` |

### Battle (戰鬥)

| I need... | Screen | File |
|-----------|--------|------|
| Main battle interface | Battle Main | `02-screens/battle/battle-main.md` |
| Async battle panel | Battle Async | `02-screens/battle/battle-async.md` |
| Skill selection | Skill Selection | `02-screens/battle/skill-selection.md` |
| Companion panel | Companion Panel | `02-screens/battle/companion-panel.md` |
| Summon display | Summon Display | `02-screens/battle/summon-display.md` |
| Enemy information | Enemy Display | `02-screens/battle/enemy-display.md` |

### Management (管理)

| I need... | Screen | File |
|-----------|--------|------|
| Character stats | Character Status | `02-screens/management/character-status.md` |
| Skill management | Skill Management | `02-screens/management/skill-management.md` |
| Inventory | Inventory | `02-screens/management/inventory.md` |
| Companion management | Companion Manage | `02-screens/management/companion-manage.md` |
| Game settings | Settings | `02-screens/management/settings.md` |

### Events (事件)

| I need... | Screen | File |
|-----------|--------|------|
| Plan mode | Plan Mode | `02-screens/events/plan-mode.md` |
| User question dialog | User Question | `02-screens/events/user-question.md` |
| Error handling | Error Handling | `02-screens/events/error-handling.md` |
| Permission request | Permission Request | `02-screens/events/permission-request.md` |
| Level up celebration | Level Up | `02-screens/events/level-up.md` |
| Notifications | Notifications | `02-screens/events/notifications.md` |

---

## Flow Quick Finder
## 流程快速查找

**Need a user flow?** Find it here:

| I need to understand... | Flow Document | File |
|-------------------------|---------------|------|
| How screen transitions work | Screen Transitions | `03-flows/screen-transitions.md` |
| How battles work | Battle Flow | `03-flows/battle-flow.md` |
| How async battles work | Async Battle Flow | `03-flows/async-battle-flow.md` |
| How to create skills | Skill Creation Flow | `03-flows/skill-creation-flow.md` |
| How shops work | Shop Flow | `03-flows/shop-flow.md` |
| How companions work | Companion Flow | `03-flows/companion-flow.md` |
| How Worktree works | Worktree Flow | `03-flows/worktree-flow.md` |
| How error recovery works | Error Recovery Flow | `03-flows/error-recovery-flow.md` |
| Overall user journey | User Journey | `03-flows/user-journey.md` |

---

## Common Patterns
## 常用模式

### 1. Button with Icon

```html
<button class="btn-primary">
  <span class="icon">⚔️</span>
  <span class="label">Attack</span>
</button>
```

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px; /* spacing-2 */
  padding: 12px 24px; /* spacing-3 spacing-6 */
  font: 700 14px/1.4 'Press Start 2P', monospace;
  background: linear-gradient(to bottom, #4caf50, #388e3c);
  border: 3px solid #2e7d32;
  color: #ffffff;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(2px);
}
```

---

### 2. Modal Dialog

```html
<div class="modal-overlay">
  <div class="modal-container">
    <div class="modal-header">
      <h2>Confirm Action</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to proceed?</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary">Cancel</button>
      <button class="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 200ms ease-out;
}

.modal-container {
  background: #2a2a2a;
  border: 3px solid #404040;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  animation: scaleIn 300ms ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 2px solid #404040;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 2px solid #404040;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

### 3. Toast Notification

```html
<div class="toast toast-success">
  <span class="toast-icon">✓</span>
  <span class="toast-message">Skill learned successfully!</span>
  <button class="toast-close">×</button>
</div>
```

```css
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 4px;
  background: #2a2a2a;
  border: 2px solid;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideInRight 300ms ease-out;
  z-index: 9999;
}

.toast-success {
  border-color: #10b981;
  color: #10b981;
}

.toast-message {
  flex: 1;
  font: 400 14px/1.4 'Roboto Mono', monospace;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 150ms;
}

.toast-close:hover {
  opacity: 1;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

### 4. Progress Bar (HP/MP/EXP)

```html
<div class="progress-bar">
  <div class="progress-label">
    <span>HP</span>
    <span>80/100</span>
  </div>
  <div class="progress-track">
    <div class="progress-fill" style="width: 80%;"></div>
  </div>
</div>
```

```css
.progress-bar {
  width: 100%;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font: 700 12px/1.4 'Roboto Mono', monospace;
  color: #b8b8b8;
}

.progress-track {
  height: 20px;
  background: #2a2a2a;
  border: 2px solid #404040;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #4caf50, #8bc34a);
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
  transition: width 500ms ease-out;
}

/* HP specific */
.progress-bar.hp .progress-fill {
  background: linear-gradient(to right, #f44336, #ef5350);
}

/* MP specific */
.progress-bar.mp .progress-fill {
  background: linear-gradient(to right, #2196f3, #64b5f6);
}

/* EXP specific */
.progress-bar.exp .progress-fill {
  background: linear-gradient(to right, #F39C12, #ffd54f);
}
```

---

### 5. Skill Card

```html
<div class="skill-card">
  <div class="skill-header">
    <span class="skill-icon">🔮</span>
    <span class="skill-name">Code Generator</span>
  </div>
  <div class="skill-cost">
    <span>MP: 10</span>
  </div>
  <div class="skill-description">
    Generates code to solve the problem.
  </div>
  <div class="skill-footer">
    <span class="skill-type">code-task</span>
    <button class="btn-use">Use</button>
  </div>
</div>
```

```css
.skill-card {
  background: #2a2a2a;
  border: 2px solid #404040;
  border-radius: 8px;
  padding: 16px;
  transition: all 200ms ease-out;
  cursor: pointer;
}

.skill-card:hover {
  border-color: #00ccff;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 204, 255, 0.3);
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.skill-icon {
  font-size: 24px;
}

.skill-name {
  font: 700 16px/1.4 'Press Start 2P', monospace;
  color: #ffffff;
}

.skill-cost {
  font: 400 12px/1.4 'Roboto Mono', monospace;
  color: #3498DB;
  margin-bottom: 8px;
}

.skill-description {
  font: 400 14px/1.5 'VT323', monospace;
  color: #b8b8b8;
  margin-bottom: 12px;
}

.skill-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-type {
  font: 400 12px/1.4 'Roboto Mono', monospace;
  color: #00ccff;
  padding: 2px 8px;
  background: rgba(0, 204, 255, 0.1);
  border-radius: 4px;
}
```

---

### 6. Loading Spinner

```html
<div class="loading-spinner">
  <div class="spinner"></div>
  <p>Loading...</p>
</div>
```

```css
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #404040;
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-spinner p {
  font: 400 14px/1.4 'VT323', monospace;
  color: #b8b8b8;
}
```

---

### 7. Input Field with Validation

```html
<div class="input-field">
  <label for="skill-name">Skill Name</label>
  <input
    type="text"
    id="skill-name"
    class="input"
    placeholder="Enter skill name"
    aria-required="true"
  />
  <span class="input-error">Skill name is required</span>
</div>
```

```css
.input-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  font: 700 12px/1.4 'Roboto Mono', monospace;
  color: #b8b8b8;
}

.input {
  padding: 12px;
  background: #2a2a2a;
  border: 2px solid #404040;
  border-radius: 4px;
  font: 400 14px/1.4 'Roboto Mono', monospace;
  color: #ffffff;
  transition: all 200ms ease-out;
}

.input:focus {
  border-color: #4caf50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  outline: none;
}

.input.error {
  border-color: #EF4444;
}

.input-error {
  font: 400 12px/1.4 'Roboto Mono', monospace;
  color: #EF4444;
  display: none;
}

.input.error + .input-error {
  display: block;
}
```

---

### 8. Damage Number Animation

```html
<div class="damage-number">-45</div>
```

```css
.damage-number {
  position: fixed;
  font: 700 20px/1 'Press Start 2P', monospace;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  z-index: 9999;
  animation: floatUp 1s ease-out forwards;
}

.damage-number.critical {
  font-size: 28px;
  color: #ff0000;
  animation: floatUpWobble 1s ease-out forwards;
}

.damage-number.heal {
  color: #00ff00;
}

@keyframes floatUp {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translateY(-80px);
    opacity: 0;
  }
}

@keyframes floatUpWobble {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  10% { transform: translateY(-8px) rotate(-5deg); }
  20% { transform: translateY(-16px) rotate(5deg); }
  30% { transform: translateY(-24px) rotate(-3deg); }
  40% { transform: translateY(-32px) rotate(3deg); }
  50% { transform: translateY(-40px) rotate(0deg); }
  70% { opacity: 1; }
  100% {
    transform: translateY(-80px) rotate(0deg);
    opacity: 0;
  }
}
```

---

## CSS Variables Template
## CSS 變量模板

Complete CSS variables for copy-paste:

```css
:root {
  /* === Colors === */

  /* Primary */
  --primary-green: #4caf50;
  --primary-red: #f44336;
  --primary-blue: #2196f3;

  /* Functional - Status */
  --hp-color: #f44336;
  --mp-color: #3498DB;
  --exp-color: #F39C12;
  --gold-color: #FFD700;

  /* Functional - Feedback */
  --success-color: #10b981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
  --info-color: #3B82F6;

  /* Backgrounds */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #3a3a3a;
  --bg-explore: #1a4d2e;
  --bg-battle: #4d1a1a;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #b8b8b8;
  --text-tertiary: #808080;
  --text-disabled: #4a4a4a;

  /* Borders */
  --border-primary: #404040;
  --border-secondary: #606060;
  --border-highlight: #ffffff;

  /* === Typography === */
  --font-title: 'Press Start 2P', monospace;
  --font-body: 'VT323', monospace;
  --font-ui: 'Roboto Mono', monospace;
  --font-code: 'JetBrains Mono', monospace;

  /* === Spacing === */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  --spacing-16: 64px;

  /* === Animation === */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-vslow: 800ms;

  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* === Shadows === */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.3);

  /* === Z-index === */
  --z-base: 0;
  --z-overlay: 100;
  --z-modal: 1000;
  --z-toast: 9999;
}
```

---

## Print Version
## 打印版本

This handbook is designed to be printer-friendly. To print:

1. Use browser print (Ctrl/Cmd+P)
2. Select "Portrait" orientation
3. Enable "Background graphics" for color swatches
4. Recommended: Print to PDF for digital reference

---

**Quick Reference Handbook v1.0**
**Last Updated**: 2026-02-05
**Maintained By**: UI Design Team

For full documentation, see `docs/ui-design/`
