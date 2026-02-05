# 響應式設計規格 (Responsive Design Specification)

## Overview

This document defines the responsive design specifications for the Cultivation Clicker game. We follow a **mobile-first approach**, ensuring the game is playable and enjoyable on all device sizes from small phones to large desktop monitors.

**Design Philosophy**:
- Mobile-first: Design for mobile, then enhance for larger screens
- Content parity: All features available on all devices
- Touch-friendly: Minimum 44×44px touch targets
- Performance: Fast loading and smooth interactions on all devices

【參考：01-design-system/layout.md】

---

## Breakpoints

We use four standard breakpoints to create responsive layouts:

| Breakpoint | Range | Device Type | Container Width |
|------------|-------|-------------|-----------------|
| **Mobile** | < 768px | Phones | 100% (with padding) |
| **Tablet** | 768px - 1199px | Tablets, small laptops | 720px |
| **Desktop** | 1200px - 1919px | Laptops, monitors | 1140px |
| **Large Desktop** | ≥ 1920px | Large monitors | 1600px (optional) |

**Breakpoint Usage**:
```css
/* Mobile First - Base styles (< 768px) */
.container {
  padding: 16px;
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
}

/* Desktop (1200px and up) */
@media (min-width: 1200px) {
  .container {
    padding: 32px;
    max-width: 1140px;
  }
}

/* Large Desktop (1920px and up) */
@media (min-width: 1920px) {
  .container {
    max-width: 1600px;
  }
}
```

---

## Grid System

### Column Configuration

| Screen Size | Columns | Gutter | Margin |
|-------------|---------|--------|--------|
| Mobile | 4 | 16px | 16px |
| Tablet | 8 | 24px | 24px |
| Desktop | 12 | 32px | 32px |
| Large Desktop | 12 | 32px | auto |

### Grid Implementation

```css
/* CSS Grid System */
.grid {
  display: grid;
  gap: 16px;
  padding: 16px;
}

/* Mobile: 4 columns */
.grid {
  grid-template-columns: repeat(4, 1fr);
}

/* Tablet: 8 columns */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(8, 1fr);
    gap: 24px;
    padding: 24px;
  }
}

/* Desktop: 12 columns */
@media (min-width: 1200px) {
  .grid {
    grid-template-columns: repeat(12, 1fr);
    gap: 32px;
    padding: 32px;
  }
}

/* Example: Span multiple columns */
.col-span-4 {
  grid-column: span 4;
}

.col-span-8 {
  grid-column: span 8;
}

.col-span-12 {
  grid-column: span 12;
}
```

**Visual Representation**:
```
Mobile (4 columns):
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │
└───┴───┴───┴───┘

Tablet (8 columns):
┌──┬──┬──┬──┬──┬──┬──┬──┐
│1 │2 │3 │4 │5 │6 │7 │8 │
└──┴──┴──┴──┴──┴──┴──┴──┘

Desktop (12 columns):
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│1│2│3│4│5│6│7│8│9│10│11│12│
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
```

---

## Layout Patterns

### 1. Stack on Mobile, Side-by-Side on Desktop

**Use Case**: Character info and equipment panels

```css
/* Mobile: Stacked vertically */
.layout-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Desktop: Side by side */
@media (min-width: 1200px) {
  .layout-stack {
    flex-direction: row;
    gap: 32px;
  }

  .layout-stack > * {
    flex: 1;
  }
}
```

### 2. Responsive Navigation

**Mobile**: Hamburger menu
**Tablet/Desktop**: Full navigation bar

```css
/* Mobile: Hidden by default */
.nav-menu {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
  z-index: 1000;
}

.nav-menu.is-open {
  display: flex;
  flex-direction: column;
}

.nav-toggle {
  display: block; /* Hamburger button visible */
}

/* Desktop: Always visible */
@media (min-width: 1200px) {
  .nav-menu {
    display: flex;
    flex-direction: row;
    position: static;
    width: auto;
    height: auto;
  }

  .nav-toggle {
    display: none; /* Hide hamburger button */
  }
}
```

### 3. Responsive Modals

**Mobile**: Full-screen overlay
**Desktop**: Centered dialog

```css
/* Mobile: Full screen */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
}

.modal-content {
  width: 100%;
  min-height: 100%;
}

/* Desktop: Centered dialog */
@media (min-width: 768px) {
  .modal {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }

  .modal-content {
    width: auto;
    max-width: 600px;
    min-height: auto;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
}
```

### 4. Responsive Grid Layouts

**Use Case**: Skill grid, inventory grid

```css
/* Mobile: 2 columns */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

/* Tablet: 3 columns */
@media (min-width: 768px) {
  .skill-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

/* Desktop: 4+ columns */
@media (min-width: 1200px) {
  .skill-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

/* Large Desktop: 5 columns */
@media (min-width: 1920px) {
  .skill-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

---

## Typography Scaling

### Base Font Sizes

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Body | 14px | 15px | 16px |
| Small | 12px | 13px | 14px |
| H1 | 24px | 28px | 32px |
| H2 | 20px | 22px | 24px |
| H3 | 18px | 20px | 20px |
| H4 | 16px | 18px | 18px |
| Button | 14px | 15px | 16px |
| Input | 16px | 16px | 16px |

**Important**: Mobile inputs should be at least 16px to prevent iOS zoom

### Line Height

- **Body text**: 1.5 (all breakpoints)
- **Headings**: 1.2 - 1.3 (all breakpoints)
- **Buttons**: 1.4 (for vertical centering)

### Implementation

```css
/* Mobile: Base styles */
:root {
  --font-size-base: 14px;
  --font-size-small: 12px;
  --font-size-h1: 24px;
  --font-size-h2: 20px;
  --font-size-h3: 18px;
  --font-size-h4: 16px;
}

body {
  font-size: var(--font-size-base);
  line-height: 1.5;
}

/* Tablet */
@media (min-width: 768px) {
  :root {
    --font-size-base: 15px;
    --font-size-small: 13px;
    --font-size-h1: 28px;
    --font-size-h2: 22px;
    --font-size-h3: 20px;
    --font-size-h4: 18px;
  }
}

/* Desktop */
@media (min-width: 1200px) {
  :root {
    --font-size-base: 16px;
    --font-size-small: 14px;
    --font-size-h1: 32px;
    --font-size-h2: 24px;
  }
}

/* Prevent iOS zoom on input focus */
input,
select,
textarea {
  font-size: 16px; /* Never less than 16px */
}
```

---

## Spacing System

### Base Unit: 4px

All spacing should be multiples of 4px for consistency.

**Spacing Scale**: 4, 8, 12, 16, 24, 32, 48, 64

### Responsive Spacing

| Context | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Container padding | 16px | 24px | 32px |
| Section spacing | 24px | 32px | 48px |
| Card padding | 12px | 16px | 20px |
| Button padding | 8px 16px | 10px 20px | 12px 24px |
| Input padding | 8px 12px | 10px 16px | 12px 16px |
| Gap (flex/grid) | 8px | 12px | 16px |

### Implementation

```css
:root {
  /* Mobile */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
}

@media (min-width: 768px) {
  :root {
    --spacing-md: 24px;
    --spacing-lg: 32px;
    --spacing-xl: 48px;
  }
}

@media (min-width: 1200px) {
  :root {
    --spacing-md: 32px;
    --spacing-lg: 48px;
    --spacing-xl: 64px;
  }
}
```

---

## Component Adaptations

【參考：04-components/】

### Status Bar

**Mobile**:
- Simplified layout
- HP/MP bars stack vertically
- Smaller avatar (32×32px)

**Desktop**:
- Horizontal layout
- Full avatar (48×48px)
- More detailed stats

```css
/* Mobile */
.status-bar {
  flex-direction: column;
  gap: 8px;
}

.status-bar__avatar {
  width: 32px;
  height: 32px;
}

/* Desktop */
@media (min-width: 1200px) {
  .status-bar {
    flex-direction: row;
    gap: 16px;
  }

  .status-bar__avatar {
    width: 48px;
    height: 48px;
  }
}
```

### Battle Log

**Mobile**:
- Scrollable panel at bottom
- Max height: 200px
- Collapsible

**Desktop**:
- Fixed sidebar
- Full height
- Always visible

```css
/* Mobile */
.battle-log {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
}

.battle-log.collapsed {
  max-height: 40px; /* Just header visible */
}

/* Desktop */
@media (min-width: 1200px) {
  .battle-log {
    position: relative;
    width: 300px;
    max-height: none;
    height: 100%;
  }

  .battle-log.collapsed {
    max-height: none; /* Always expanded */
  }
}
```

### Skill Grid

**Mobile**: 2 columns
**Tablet**: 3 columns
**Desktop**: 4 columns
**Large Desktop**: 5 columns

```css
.skill-grid {
  display: grid;
  gap: 8px;
}

/* Mobile: 2 columns */
.skill-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Tablet: 3 columns */
@media (min-width: 768px) {
  .skill-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

/* Desktop: 4 columns */
@media (min-width: 1200px) {
  .skill-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

/* Large Desktop: 5 columns */
@media (min-width: 1920px) {
  .skill-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### Modals and Dialogs

**Mobile**:
- Full-screen overlay
- Bottom sheet for quick actions
- Full padding for readability

**Desktop**:
- Centered dialog
- Max-width constraints
- Backdrop blur

```css
/* Mobile: Full screen */
.modal {
  position: fixed;
  inset: 0;
  padding: 16px;
  overflow-y: auto;
}

.modal--bottom-sheet {
  top: auto;
  border-radius: 16px 16px 0 0;
}

/* Desktop: Centered */
@media (min-width: 768px) {
  .modal {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    max-width: 600px;
    border-radius: 8px;
  }

  .modal--bottom-sheet {
    top: 0;
    border-radius: 8px;
  }
}
```

---

## Images and Media

### Responsive Images

Use `srcset` for different screen densities:

```html
<img
  src="character-400w.png"
  srcset="character-400w.png 1x, character-800w.png 2x"
  alt="Character portrait"
  loading="lazy"
>
```

### Pixel Art Scaling

For pixel art, use image-rendering to prevent blurring:

```css
.pixel-art {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Scale pixel art based on screen size */
.character-sprite {
  width: 64px; /* Mobile */
  height: 64px;
}

@media (min-width: 768px) {
  .character-sprite {
    width: 96px; /* Tablet */
    height: 96px;
  }
}

@media (min-width: 1200px) {
  .character-sprite {
    width: 128px; /* Desktop */
    height: 128px;
  }
}
```

### Lazy Loading

Enable lazy loading for off-screen images:

```html
<img src="background.png" loading="lazy" alt="Background">
```

### Aspect Ratio Preservation

Use `aspect-ratio` to prevent layout shift:

```css
.card-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}
```

---

## Testing

### Responsive Testing Checklist

- [ ] **Test on real devices**
  - [ ] iPhone SE (small phone)
  - [ ] iPhone 12/13 (standard phone)
  - [ ] iPad (tablet)
  - [ ] Desktop monitor (1920×1080)

- [ ] **Test in Chrome DevTools**
  - [ ] Mobile: 375×667 (iPhone SE)
  - [ ] Mobile: 414×896 (iPhone 11)
  - [ ] Tablet: 768×1024 (iPad)
  - [ ] Desktop: 1920×1080

- [ ] **Test orientations**
  - [ ] Portrait (mobile/tablet)
  - [ ] Landscape (mobile/tablet)

- [ ] **Test touch interactions**
  - [ ] All buttons are at least 44×44px
  - [ ] No hover-only interactions
  - [ ] Swipe gestures work (if applicable)

- [ ] **Test edge cases**
  - [ ] Very long text (names, descriptions)
  - [ ] Very large numbers (damage, stats)
  - [ ] Empty states (no items, no skills)

### Common Resolutions to Test

| Resolution | Device Type | Notes |
|------------|-------------|-------|
| 375×667 | iPhone SE | Small phone |
| 390×844 | iPhone 12/13 | Standard phone |
| 414×896 | iPhone 11 Pro Max | Large phone |
| 768×1024 | iPad | Tablet portrait |
| 1024×768 | iPad | Tablet landscape |
| 1366×768 | Laptop | Common laptop |
| 1920×1080 | Desktop | Full HD monitor |
| 2560×1440 | Desktop | 2K monitor |

---

## Implementation

### CSS Techniques

#### 1. Media Queries

```css
/* Mobile first approach */
.element {
  /* Mobile styles here */
}

/* Tablet and up */
@media (min-width: 768px) {
  .element {
    /* Tablet styles here */
  }
}

/* Desktop and up */
@media (min-width: 1200px) {
  .element {
    /* Desktop styles here */
  }
}

/* Large desktop and up */
@media (min-width: 1920px) {
  .element {
    /* Large desktop styles here */
  }
}
```

#### 2. Flexbox

```css
/* Responsive flex layout */
.flex-container {
  display: flex;
  flex-direction: column; /* Mobile: stack */
  gap: 16px;
}

@media (min-width: 768px) {
  .flex-container {
    flex-direction: row; /* Tablet: side by side */
    gap: 24px;
  }
}

.flex-item {
  flex: 1; /* Equal width items */
}
```

#### 3. CSS Grid

```css
/* Responsive grid */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* Explicit breakpoints */
@media (min-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### 4. Container Queries (Future)

```css
/* Container queries for true component-level responsiveness */
@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

#### 5. Viewport Units

```css
/* Responsive height based on viewport */
.full-screen-modal {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height (mobile browsers) */
}

/* Responsive font size */
.hero-title {
  font-size: clamp(24px, 5vw, 48px);
}
```

### SCSS Mixins

```scss
// Breakpoint mixin
@mixin breakpoint($size) {
  @if $size == tablet {
    @media (min-width: 768px) { @content; }
  } @else if $size == desktop {
    @media (min-width: 1200px) { @content; }
  } @else if $size == large {
    @media (min-width: 1920px) { @content; }
  }
}

// Usage
.element {
  font-size: 14px;

  @include breakpoint(tablet) {
    font-size: 15px;
  }

  @include breakpoint(desktop) {
    font-size: 16px;
  }
}
```

---

## Code Examples

### Responsive Component Example

```html
<div class="character-panel">
  <div class="character-panel__header">
    <img src="avatar.png" alt="Character" class="character-panel__avatar">
    <div class="character-panel__info">
      <h2 class="character-panel__name">勇者 (Hero)</h2>
      <p class="character-panel__level">Lv. 25</p>
    </div>
  </div>

  <div class="character-panel__stats">
    <div class="stat">
      <span class="stat__label">HP</span>
      <div class="stat__bar">
        <div class="stat__bar-fill" style="width: 75%"></div>
      </div>
      <span class="stat__value">750 / 1000</span>
    </div>
    <div class="stat">
      <span class="stat__label">MP</span>
      <div class="stat__bar stat__bar--mp">
        <div class="stat__bar-fill" style="width: 50%"></div>
      </div>
      <span class="stat__value">250 / 500</span>
    </div>
  </div>
</div>
```

```css
/* Mobile: Compact layout */
.character-panel {
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
}

.character-panel__header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.character-panel__avatar {
  width: 48px;
  height: 48px;
  border-radius: 4px;
}

.character-panel__name {
  font-size: 16px;
  margin: 0;
}

.character-panel__level {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.character-panel__stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat__label {
  font-size: 12px;
  font-weight: bold;
}

.stat__bar {
  height: 20px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.stat__bar-fill {
  height: 100%;
  background: var(--color-hp);
  transition: width 0.3s ease;
}

.stat__bar--mp .stat__bar-fill {
  background: var(--color-mp);
}

.stat__value {
  font-size: 11px;
  text-align: right;
}

/* Tablet: More spacious */
@media (min-width: 768px) {
  .character-panel {
    padding: 16px;
  }

  .character-panel__avatar {
    width: 64px;
    height: 64px;
  }

  .character-panel__name {
    font-size: 18px;
  }

  .character-panel__level {
    font-size: 14px;
  }

  .stat {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .stat__label {
    width: 40px;
    font-size: 14px;
  }

  .stat__bar {
    flex: 1;
    height: 24px;
  }

  .stat__value {
    width: 100px;
    font-size: 13px;
  }
}

/* Desktop: Full layout */
@media (min-width: 1200px) {
  .character-panel {
    padding: 20px;
  }

  .character-panel__header {
    gap: 16px;
    margin-bottom: 16px;
  }

  .character-panel__avatar {
    width: 80px;
    height: 80px;
  }

  .character-panel__name {
    font-size: 20px;
  }

  .character-panel__stats {
    gap: 12px;
  }

  .stat__bar {
    height: 28px;
  }

  .stat__value {
    font-size: 14px;
  }
}
```

---

## Summary

This responsive design specification ensures that Cultivation Clicker provides an optimal experience across all devices. Key principles:

1. **Mobile-first**: Start with mobile, enhance for larger screens
2. **Flexible layouts**: Use flexbox and grid for adaptable layouts
3. **Scalable typography**: Adjust font sizes for readability
4. **Touch-friendly**: Minimum 44×44px touch targets
5. **Performance**: Optimize images and lazy load content
6. **Testing**: Test on real devices and various screen sizes

【相關文檔】
- `01-design-system/layout.md` - Layout system
- `04-components/` - Component specifications
- `06-specifications/performance-optimization.md` - Performance guidelines
