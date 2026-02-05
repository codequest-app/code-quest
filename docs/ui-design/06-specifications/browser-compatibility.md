# 瀏覽器相容性 (Browser Compatibility)

## Overview

This document defines the browser support policy and compatibility strategies for Cultivation Clicker. We aim to support modern browsers while providing graceful degradation for older browsers, ensuring the widest possible audience can enjoy the game.

**Support Philosophy**:
- Modern browsers: Full feature support
- Older browsers: Core functionality with graceful degradation
- Progressive enhancement: Build core experience first, enhance for capable browsers
- Feature detection: Test for capabilities, not browser versions

---

## Supported Browsers

### Desktop Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| **Chrome** | Last 2 versions | Full support |
| **Firefox** | Last 2 versions | Full support |
| **Safari** | Last 2 versions | Full support |
| **Edge** | Last 2 versions | Full support (Chromium-based) |
| **Opera** | Last 2 versions | Full support (Chromium-based) |

**As of 2025**:
- Chrome 131+
- Firefox 134+
- Safari 18+
- Edge 131+

### Mobile Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| **Chrome for Android** | Last 2 versions | Full support |
| **Safari iOS** | iOS 15+ | Full support |
| **Samsung Internet** | Last 2 versions | Full support |
| **Firefox Android** | Last 2 versions | Full support |

### Explicitly Not Supported

- Internet Explorer (all versions) - End of life June 2022
- Opera Mini - Limited JavaScript support
- UC Browser - Non-standard rendering

---

## Feature Support Matrix

### CSS Features

| Feature | Chrome | Firefox | Safari | Edge | Polyfill/Fallback |
|---------|--------|---------|--------|------|-------------------|
| CSS Grid | 57+ | 52+ | 10.1+ | 16+ | Flexbox fallback |
| Flexbox | 29+ | 28+ | 9+ | 12+ | Native support |
| CSS Custom Properties | 49+ | 31+ | 9.1+ | 15+ | Sass variables |
| CSS `gap` in Flexbox | 84+ | 63+ | 14.1+ | 84+ | Margin fallback |
| `aspect-ratio` | 88+ | 89+ | 15+ | 88+ | Padding-bottom hack |
| `clamp()` | 79+ | 75+ | 13.1+ | 79+ | Media queries |
| Container Queries | 105+ | 110+ | 16+ | 105+ | Media queries |
| `backdrop-filter` | 76+ | 103+ | 9+ | 17+ | Solid background |
| `image-rendering: pixelated` | 41+ | 3.6+ | 10+ | 79+ | Native support |

### JavaScript Features

| Feature | Chrome | Firefox | Safari | Edge | Polyfill/Fallback |
|---------|--------|---------|--------|------|-------------------|
| ES6 (ES2015) | 51+ | 54+ | 10+ | 14+ | Babel transpilation |
| ES2020 (Optional Chaining) | 80+ | 74+ | 13.1+ | 80+ | Babel transpilation |
| `async`/`await` | 55+ | 52+ | 10.1+ | 15+ | Regenerator runtime |
| Promises | 32+ | 29+ | 8+ | 12+ | Core-js polyfill |
| Fetch API | 42+ | 39+ | 10.1+ | 14+ | Whatwg-fetch polyfill |
| Intersection Observer | 51+ | 55+ | 12.1+ | 15+ | Polyfill available |
| ResizeObserver | 64+ | 69+ | 13.1+ | 79+ | Polyfill available |
| Web Animations API | 84+ | 75+ | 13.1+ | 84+ | Polyfill available |
| LocalStorage | 4+ | 3.5+ | 4+ | 12+ | Native support |

---

## Polyfills

### Required Polyfills

**Core-js for older browser features**:

```javascript
// src/polyfills.js
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

**Fetch API**:
```javascript
// Only load if not supported
if (!window.fetch) {
  import('whatwg-fetch');
}
```

**Intersection Observer**:
```javascript
// For lazy loading images
if (!('IntersectionObserver' in window)) {
  import('intersection-observer');
}
```

**ResizeObserver**:
```javascript
// For responsive components
if (!('ResizeObserver' in window)) {
  import('@juggle/resize-observer').then(module => {
    window.ResizeObserver = module.ResizeObserver;
  });
}
```

### Conditional Polyfill Loading

```javascript
// polyfills.js
async function loadPolyfills() {
  const polyfills = [];

  // Intersection Observer
  if (!('IntersectionObserver' in window)) {
    polyfills.push(import('intersection-observer'));
  }

  // Fetch API
  if (!window.fetch) {
    polyfills.push(import('whatwg-fetch'));
  }

  // ResizeObserver
  if (!('ResizeObserver' in window)) {
    polyfills.push(
      import('@juggle/resize-observer').then(module => {
        window.ResizeObserver = module.ResizeObserver;
      })
    );
  }

  // Promise.allSettled (ES2020)
  if (!Promise.allSettled) {
    polyfills.push(import('promise.allsettled'));
  }

  await Promise.all(polyfills);
}

// Load polyfills before app initialization
loadPolyfills().then(() => {
  // Initialize app
  import('./main.js');
});
```

---

## Graceful Degradation

### CSS Fallbacks

**CSS Grid to Flexbox**:

```css
/* Modern browsers: CSS Grid */
.container {
  display: flex; /* Fallback */
  flex-wrap: wrap;
  gap: 16px; /* Modern */
}

@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
}
```

**CSS Custom Properties to Sass Variables**:

```scss
// Define fallback values
$color-primary: #4A90E2;

.button {
  // Fallback for browsers without custom properties
  background: $color-primary;
  // Modern browsers override with custom property
  background: var(--color-primary, $color-primary);
}
```

**Flexbox Gap to Margin**:

```css
/* Fallback: Use margin */
.flex-container {
  display: flex;
  margin: -8px; /* Negative margin on container */
}

.flex-container > * {
  margin: 8px; /* Positive margin on children */
}

/* Modern: Use gap */
@supports (gap: 8px) {
  .flex-container {
    margin: 0;
    gap: 16px;
  }

  .flex-container > * {
    margin: 0;
  }
}
```

**Aspect Ratio Fallback**:

```css
/* Fallback: Padding-bottom trick */
.image-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.image-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Modern: aspect-ratio */
@supports (aspect-ratio: 16 / 9) {
  .image-container {
    padding-bottom: 0;
    aspect-ratio: 16 / 9;
  }

  .image-container img {
    position: static;
  }
}
```

**Backdrop Filter Fallback**:

```css
/* Fallback: Solid background */
.modal-backdrop {
  background: rgba(0, 0, 0, 0.8);
}

/* Modern: Blur backdrop */
@supports (backdrop-filter: blur(10px)) {
  .modal-backdrop {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
  }
}
```

### JavaScript Fallbacks

**Optional Chaining**:

```javascript
// Modern (ES2020)
const userName = user?.profile?.name;

// Fallback (transpiled by Babel)
const userName = user && user.profile && user.profile.name;
```

**Nullish Coalescing**:

```javascript
// Modern (ES2020)
const port = config.port ?? 3000;

// Fallback (transpiled by Babel)
const port = config.port !== null && config.port !== undefined ? config.port : 3000;
```

**Async/Await**:

```javascript
// Modern
async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}

// Fallback (transpiled by Babel with regenerator-runtime)
function fetchData() {
  return fetch('/api/data')
    .then(response => response.json())
    .then(data => data);
}
```

---

## Feature Detection

### CSS @supports

Test for CSS feature support:

```css
/* Default styles */
.element {
  /* Fallback styles */
}

/* Only apply if feature is supported */
@supports (display: grid) {
  .element {
    /* Grid-specific styles */
  }
}

/* Multiple conditions */
@supports (display: grid) and (gap: 16px) {
  .element {
    /* Grid with gap */
  }
}

/* OR condition */
@supports (display: -webkit-box) or (display: flex) {
  .element {
    /* Flexbox styles */
  }
}
```

### JavaScript Feature Detection

**Modernizr** (Optional):

```javascript
// Install Modernizr
npm install modernizr

// Configure features to test
// modernizr-config.json
{
  "feature-detects": [
    "css/grid",
    "css/flexbox",
    "css/supports",
    "intersection-observer",
    "localstorage"
  ]
}
```

**Manual Feature Detection**:

```javascript
// Detect CSS Grid support
const supportsGrid = CSS.supports('display', 'grid');

// Detect Intersection Observer
const supportsIntersectionObserver = 'IntersectionObserver' in window;

// Detect Local Storage
function supportsLocalStorage() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Detect Touch Support
const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Detect WebP support
function supportsWebP() {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// Use feature detection
if (supportsGrid) {
  document.body.classList.add('supports-grid');
}

if (supportsIntersectionObserver) {
  // Use Intersection Observer for lazy loading
  lazyLoadImages();
} else {
  // Load all images immediately
  loadAllImages();
}
```

---

## CSS Vendor Prefixes

Use **Autoprefixer** to automatically add vendor prefixes:

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        'last 2 versions',
        'ios >= 13',
        'not dead',
      ],
    }),
  ],
};
```

**Common Prefixes**:

```css
/* Autoprefixer will add these automatically */

/* Flexbox */
.flex {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

/* Transforms */
.transform {
  -webkit-transform: translateX(100px);
  -ms-transform: translateX(100px);
  transform: translateX(100px);
}

/* Transitions */
.transition {
  -webkit-transition: all 0.3s;
  -o-transition: all 0.3s;
  transition: all 0.3s;
}

/* User Select */
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Appearance */
.button {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* Backdrop Filter */
.backdrop {
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
```

---

## Known Browser Issues

### Safari-specific Issues

**1. Flexbox Bugs**

```css
/* Issue: Safari doesn't support flex-shrink on flex items with min-height */
/* Workaround: Set explicit height or use flex-basis */
.flex-item {
  flex: 1 0 auto; /* Instead of flex: 1 */
  min-height: 0; /* Allow flex item to shrink */
}
```

**2. 100vh on Mobile Safari**

```css
/* Issue: 100vh includes browser chrome on iOS Safari */
/* Workaround: Use -webkit-fill-available */
.full-screen {
  height: 100vh;
  height: -webkit-fill-available;
}

/* Better: Use JavaScript to set height */
```

```javascript
// Set viewport height accounting for mobile browser chrome
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);
setViewportHeight();
```

```css
.full-screen {
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
}
```

**3. Date Input**

```javascript
// Safari doesn't support <input type="date"> well
// Provide fallback date picker

function isDateInputSupported() {
  const input = document.createElement('input');
  input.setAttribute('type', 'date');
  return input.type === 'date';
}

if (!isDateInputSupported()) {
  // Load date picker library
  import('flatpickr');
}
```

**4. Position: sticky**

```css
/* Safari requires -webkit- prefix */
.sticky {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
}
```

### Firefox-specific Issues

**1. Scrollbar Styling**

```css
/* Firefox uses different properties than Chrome/Safari */

/* Webkit browsers (Chrome, Safari) */
.scrollable::-webkit-scrollbar {
  width: 8px;
}

.scrollable::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

/* Firefox */
.scrollable {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}
```

**2. Image Rendering**

```css
/* Firefox uses different property value */
.pixel-art {
  image-rendering: -moz-crisp-edges; /* Firefox */
  image-rendering: pixelated; /* Standard */
}
```

### Mobile Browser Issues

**1. iOS Safari Touch Delay**

```css
/* Remove 300ms tap delay */
html {
  touch-action: manipulation;
}
```

**2. iOS Safari Momentum Scrolling**

```css
/* Enable smooth momentum scrolling */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: scroll;
}
```

**3. Prevent Zoom on Input Focus (iOS)**

```css
/* Set minimum font size to prevent auto-zoom */
input,
select,
textarea {
  font-size: 16px; /* Minimum to prevent zoom */
}
```

**4. Android Chrome Address Bar**

```javascript
// Handle viewport height changes when address bar hides/shows
let lastHeight = window.innerHeight;

window.addEventListener('resize', () => {
  const currentHeight = window.innerHeight;

  // Address bar likely hidden/shown if height changed significantly
  if (Math.abs(currentHeight - lastHeight) > 100) {
    updateViewportHeight();
  }

  lastHeight = currentHeight;
});
```

---

## Testing Strategy

### Manual Testing Checklist

**Desktop Browsers**:
- [ ] Chrome (Windows/Mac)
- [ ] Firefox (Windows/Mac)
- [ ] Safari (Mac)
- [ ] Edge (Windows)

**Mobile Browsers**:
- [ ] Safari (iOS - iPhone & iPad)
- [ ] Chrome (Android)
- [ ] Samsung Internet (Android)

**Test Scenarios**:
- [ ] Initial page load
- [ ] Navigation between screens
- [ ] Battle flow (start, attack, victory/defeat)
- [ ] Inventory management
- [ ] Shop purchases
- [ ] Form inputs
- [ ] Animations and transitions
- [ ] Responsive layout (different screen sizes)
- [ ] Touch interactions (mobile)
- [ ] Keyboard navigation
- [ ] Offline functionality (if applicable)

### Automated Cross-browser Testing

**BrowserStack** or **Sauce Labs**:

```javascript
// Example: Playwright cross-browser configuration
// playwright.config.js
module.exports = {
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
    {
      name: 'Mobile Safari',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
      },
    },
  ],
};
```

### Browser DevTools Testing

**Chrome DevTools**:
- Device emulation for mobile testing
- Network throttling (3G, 4G)
- CPU throttling (6x slowdown)
- Coverage tool (unused CSS/JS)

**Firefox DevTools**:
- Responsive design mode
- Accessibility inspector
- CSS Grid inspector

**Safari Web Inspector**:
- iOS device simulation
- Timeline profiler
- Network waterfall

---

## Progressive Enhancement

Build from the ground up, starting with core functionality:

### Level 1: Core HTML

Basic semantic HTML that works without CSS or JavaScript:

```html
<!-- Functional without CSS/JS -->
<nav>
  <a href="/">Home</a>
  <a href="/battle">Battle</a>
  <a href="/inventory">Inventory</a>
</nav>

<form action="/api/battle" method="POST">
  <button type="submit" name="action" value="attack">Attack</button>
  <button type="submit" name="action" value="defend">Defend</button>
</form>
```

### Level 2: Enhanced with CSS

Add styling for better visual presentation:

```css
/* Progressive enhancement with CSS */
.button {
  /* Base styles work everywhere */
  padding: 12px 24px;
  border: 2px solid #4A90E2;
  background: transparent;
}

/* Enhanced styles for modern browsers */
@supports (backdrop-filter: blur(10px)) {
  .modal {
    backdrop-filter: blur(10px);
    background: rgba(0, 0, 0, 0.5);
  }
}
```

### Level 3: Enhanced with JavaScript

Add interactivity for richer experience:

```javascript
// Core functionality works without JS (form submission)
// Enhanced functionality with JS (real-time updates)

const form = document.querySelector('form');

if ('fetch' in window) {
  // Enhanced: AJAX submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await fetch('/api/battle', {
      method: 'POST',
      body: new FormData(form),
    });
    const result = await response.json();
    updateUI(result);
  });
} else {
  // Fallback: Traditional form submission (page reload)
  // No JavaScript needed - form already works
}
```

---

## Browser Support Policy

### Decision Matrix

When deciding whether to support a feature:

1. **Usage Statistics**: Check browser usage in your target audience
2. **Feature Criticality**: Is it core functionality or enhancement?
3. **Fallback Complexity**: How difficult is it to provide a fallback?
4. **Polyfill Size**: Will polyfills significantly increase bundle size?

**Example Decision**:

| Feature | Usage | Critical? | Fallback | Polyfill Size | Decision |
|---------|-------|-----------|----------|---------------|----------|
| CSS Grid | 95%+ | No | Flexbox | N/A | Support with fallback |
| Intersection Observer | 90%+ | Nice-to-have | Eager loading | 5 KB | Polyfill for older browsers |
| Container Queries | 70%+ | No | Media queries | N/A | Fallback to media queries |
| CSS `aspect-ratio` | 85%+ | No | Padding trick | N/A | Fallback to padding trick |

### Deprecation Policy

When dropping support for a browser:

1. **Announce in advance** (3+ months)
2. **Monitor analytics** for affected users (< 2%)
3. **Provide warnings** to users on unsupported browsers
4. **Document changes** in release notes

---

## Summary

Cultivation Clicker supports modern browsers (last 2 versions) with graceful degradation for older browsers:

1. **Core Support**: Chrome, Firefox, Safari, Edge (last 2 versions)
2. **Mobile Support**: iOS 15+, Android Chrome, Samsung Internet
3. **Polyfills**: Conditionally load only when needed
4. **Fallbacks**: CSS @supports, JavaScript feature detection
5. **Testing**: Manual testing + automated cross-browser tests
6. **Progressive Enhancement**: Build core functionality first, enhance for modern browsers

**Key Principles**:
- Test early and often across browsers
- Use feature detection, not browser detection
- Provide meaningful fallbacks for unsupported features
- Respect user preferences (reduced motion, etc.)

【相關文檔】
- `06-specifications/implementation-guide.md` - Implementation guidelines
- `06-specifications/performance-optimization.md` - Performance optimization
- `06-specifications/responsive-design.md` - Responsive design specs
