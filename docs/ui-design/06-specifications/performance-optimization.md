# 效能優化 (Performance Optimization)

## Overview

This document outlines comprehensive performance optimization strategies for Cultivation Clicker. Performance is critical for providing a smooth, responsive gaming experience across all devices, from low-end mobile phones to high-end desktop computers.

**Performance Goals**:
- First Contentful Paint (FCP): < 1.8s
- Time to Interactive (TTI): < 3.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms
- Frame Rate: 60 FPS consistently

【參考：06-specifications/responsive-design.md】

---

## Performance Metrics

### Core Web Vitals

**1. Largest Contentful Paint (LCP)**
- **Definition**: Time until the largest content element is visible
- **Target**: < 2.5s
- **Impacts**: User perception of loading speed

**2. First Input Delay (FID)**
- **Definition**: Time from first user interaction to browser response
- **Target**: < 100ms
- **Impacts**: Interactivity and responsiveness

**3. Cumulative Layout Shift (CLS)**
- **Definition**: Sum of unexpected layout shifts during page lifecycle
- **Target**: < 0.1
- **Impacts**: Visual stability

### Additional Metrics

**First Contentful Paint (FCP)**
- **Definition**: Time until first content is rendered
- **Target**: < 1.8s

**Time to Interactive (TTI)**
- **Definition**: Time until page is fully interactive
- **Target**: < 3.8s

**Speed Index**
- **Definition**: How quickly content is visually displayed
- **Target**: < 3.4s

**Total Blocking Time (TBT)**
- **Definition**: Time main thread is blocked from responding to input
- **Target**: < 200ms

---

## Optimization Strategies

### 1. Code Splitting

Split JavaScript bundles to load only necessary code:

**Route-based Splitting**:
```javascript
// React lazy loading
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

const BattleScreen = lazy(() => import('./screens/BattleScreen'));
const InventoryScreen = lazy(() => import('./screens/InventoryScreen'));
const ShopScreen = lazy(() => import('./screens/ShopScreen'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/battle" element={<BattleScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/shop" element={<ShopScreen />} />
      </Routes>
    </Suspense>
  );
}
```

**Component-based Splitting**:
```javascript
// Lazy load heavy components
const ParticleEffects = lazy(() => import('./components/ParticleEffects'));

function BattleScreen() {
  const [showEffects, setShowEffects] = useState(false);

  return (
    <>
      <BattleField />
      {showEffects && (
        <Suspense fallback={null}>
          <ParticleEffects />
        </Suspense>
      )}
    </>
  );
}
```

**Vendor Splitting**:
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'state': ['zustand'],
        },
      },
    },
  },
};
```

### 2. Bundle Optimization

**Tree Shaking**:
```javascript
// Good: Import only what you need
import { useState, useEffect } from 'react';

// Bad: Import everything
import * as React from 'react';

// Good: Named imports
import { formatNumber } from './utils/formatters';

// Bad: Default import with unused functions
import utils from './utils';
```

**Minification**:
```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,        // Remove console.log
        drop_debugger: true,       // Remove debugger statements
        pure_funcs: ['console.log'], // Remove specific functions
      },
    },
  },
};
```

**Compression**:
```javascript
// Enable gzip/brotli compression
import compression from 'vite-plugin-compression';

export default {
  plugins: [
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
};
```

### 3. Image Optimization

**Format Selection**:
- **WebP**: Modern format, 25-35% smaller than PNG/JPEG
- **AVIF**: Even better compression, but less browser support
- **PNG**: For pixel art (use PNG-8 when possible)
- **SVG**: For icons and simple graphics

**Responsive Images**:
```html
<!-- Provide multiple sizes -->
<img
  src="character-400w.webp"
  srcset="character-400w.webp 400w,
          character-800w.webp 800w,
          character-1200w.webp 1200w"
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         400px"
  alt="Character"
  loading="lazy"
  decoding="async"
>
```

**Image Compression**:
```bash
# Using Squoosh CLI
npx @squoosh/cli --webp auto src/assets/images/*.png

# Using sharp (programmatic)
npm install sharp
```

```javascript
// compress-images.js
const sharp = require('sharp');
const fs = require('fs');

async function compressImage(input, output) {
  await sharp(input)
    .webp({ quality: 80 })
    .toFile(output);
}
```

**Lazy Loading**:
```html
<!-- Native lazy loading -->
<img src="background.png" loading="lazy" alt="Background">

<!-- Lazy load background images with Intersection Observer -->
```

```javascript
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
```

**Pixel Art Optimization**:
```css
/* Prevent blurring when scaling */
.pixel-art {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Use CSS instead of images for simple patterns */
.checkered-background {
  background:
    repeating-conic-gradient(
      #808080 0% 25%,
      #606060 0% 50%
    )
    50% / 20px 20px;
}
```

### 4. Font Loading

**Font Display Strategy**:
```css
/* Swap ensures text is always visible */
@font-face {
  font-family: 'Noto Sans TC';
  src: url('/fonts/NotoSansTC-Regular.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
  font-weight: 400;
}

/* Optional: Fallback for system fonts */
body {
  font-family:
    'Noto Sans TC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
```

**Font Subsetting**:
```bash
# Include only Chinese characters used in the game
npx glyphhanger --formats=woff2 --subset=*.woff2 --whitelist="修仙點擊遊戲角色戰鬥技能..."
```

**Preload Critical Fonts**:
```html
<link
  rel="preload"
  href="/fonts/NotoSansTC-Regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
>
```

### 5. CSS Optimization

**Critical CSS**:
Extract and inline CSS needed for above-the-fold content:

```html
<head>
  <style>
    /* Inline critical CSS */
    .header { /* ... */ }
    .hero { /* ... */ }
  </style>

  <!-- Load full CSS asynchronously -->
  <link rel="preload" href="/styles/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/styles/main.css"></noscript>
</head>
```

**CSS Minification**:
```javascript
// Vite handles this automatically in production
// Manual configuration:
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    cssMinify: true,
  },
});
```

**Remove Unused CSS**:
```javascript
// Using PurgeCSS
import purgecss from '@fullhuman/postcss-purgecss';

export default {
  css: {
    postcss: {
      plugins: [
        purgecss({
          content: ['./src/**/*.{js,jsx,html}'],
        }),
      ],
    },
  },
};
```

**Optimize CSS Animations**:
```css
/* Good: GPU-accelerated */
.element {
  transform: translateX(100px);
  transition: transform 300ms;
}

/* Bad: Triggers layout recalculation */
.element {
  left: 100px;
  transition: left 300ms;
}
```

### 6. JavaScript Optimization

**Defer Non-critical Scripts**:
```html
<!-- Defer script execution until HTML parsing is complete -->
<script src="/scripts/analytics.js" defer></script>

<!-- Async for independent scripts -->
<script src="/scripts/tracking.js" async></script>
```

**Optimize Loops**:
```javascript
// Bad: Length calculated on every iteration
for (let i = 0; i < array.length; i++) {
  process(array[i]);
}

// Good: Cache length
const len = array.length;
for (let i = 0; i < len; i++) {
  process(array[i]);
}

// Better: Use efficient array methods
array.forEach(item => process(item));
```

**Debounce and Throttle**:
```javascript
// Debounce: Execute after user stops typing
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const handleSearch = debounce((query) => {
  searchAPI(query);
}, 300);

// Throttle: Execute at most once per interval
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100);
```

---

## Rendering Performance

### 1. Virtual Scrolling

For long lists (battle log, inventory):

```javascript
// Using react-window
import { FixedSizeList } from 'react-window';

function BattleLog({ entries }) {
  const Row = ({ index, style }) => (
    <div style={style} className="log-entry">
      {entries[index]}
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={entries.length}
      itemSize={30}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 2. React Optimization

**Memoization**:
```javascript
import { memo, useMemo, useCallback } from 'react';

// Prevent re-renders when props haven't changed
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Render data */}</div>;
});

// Memoize expensive calculations
function CharacterStats({ character }) {
  const totalStats = useMemo(() => {
    return calculateTotalStats(character);
  }, [character]); // Only recalculate when character changes

  return <div>{totalStats}</div>;
}

// Memoize callbacks to prevent child re-renders
function ParentComponent() {
  const [count, setCount] = useState(0);

  // Without useCallback, this creates a new function on every render
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // Empty deps = function never changes

  return <ChildComponent onClick={handleClick} />;
}
```

**Avoid Unnecessary Re-renders**:
```javascript
// Bad: Creates new object on every render
function Component() {
  return <ChildComponent style={{ margin: 10 }} />;
}

// Good: Define outside or use useMemo
const childStyle = { margin: 10 };
function Component() {
  return <ChildComponent style={childStyle} />;
}

// Or with useMemo
function Component() {
  const childStyle = useMemo(() => ({ margin: 10 }), []);
  return <ChildComponent style={childStyle} />;
}
```

**Key Prop Optimization**:
```javascript
// Bad: Index as key (causes re-renders on reorder)
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// Good: Stable unique ID as key
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

### 3. Avoid Forced Reflows

**Batch DOM Reads and Writes**:
```javascript
// Bad: Interleaved reads and writes (causes layout thrashing)
elements.forEach(el => {
  const height = el.offsetHeight; // Read (causes reflow)
  el.style.height = height * 2 + 'px'; // Write
});

// Good: Batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight); // Batch reads
heights.forEach((height, i) => {
  elements[i].style.height = height * 2 + 'px'; // Batch writes
});
```

**Use RequestAnimationFrame**:
```javascript
// Bad: Direct DOM manipulation
function animate() {
  element.style.transform = `translateX(${x}px)`;
}

// Good: Sync with browser paint
function animate() {
  requestAnimationFrame(() => {
    element.style.transform = `translateX(${x}px)`;
  });
}
```

---

## Animation Performance

【參考：06-specifications/animation-library.md】

### 1. GPU-Accelerated Properties

**Use these properties for 60fps animations**:
- `transform` (translate, scale, rotate, skew)
- `opacity`
- `filter` (use sparingly)

```css
/* Good: GPU-accelerated */
.element {
  transform: translateX(100px) scale(1.2);
  opacity: 0.8;
  transition: transform 300ms, opacity 300ms;
}

/* Bad: CPU-bound (causes layout/paint) */
.element {
  left: 100px;
  width: 200px;
  background-color: red;
  transition: left 300ms, width 300ms, background-color 300ms;
}
```

### 2. will-change Property

**Use to hint browser about upcoming animations**:

```css
/* Before animation */
.element-about-to-animate {
  will-change: transform, opacity;
}

/* During animation */
.element-animating {
  animation: slide 500ms ease-out;
}

/* After animation - remove will-change */
.element-done {
  will-change: auto;
}
```

**JavaScript control**:
```javascript
// Before animation
element.style.willChange = 'transform, opacity';

// Start animation
element.classList.add('animating');

// After animation completes
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});
```

**Warning**: Don't overuse `will-change` - it consumes memory!

### 3. RequestAnimationFrame

```javascript
// Good: Synced with browser refresh rate (60fps)
function animate() {
  updatePosition();
  draw();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Bad: Not synced with display refresh
setInterval(() => {
  updatePosition();
  draw();
}, 16); // Approximately 60fps, but not precise
```

### 4. Canvas Optimization

For particle effects and complex animations:

```javascript
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // Better performance
    });
    this.particles = [];
  }

  update() {
    // Remove dead particles first
    this.particles = this.particles.filter(p => p.isAlive());

    // Update remaining particles
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update();
    }
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all particles in one pass
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(this.ctx);
    }
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
```

---

## Network Performance

### 1. HTTP/2 Multiplexing

Use HTTP/2 for parallel requests:

```javascript
// Server configuration (example with Express)
const spdy = require('spdy');
const fs = require('fs');

const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt'),
};

spdy.createServer(options, app).listen(443);
```

### 2. Compression

**Enable gzip/Brotli compression**:

```javascript
// vite.config.js
import viteCompression from 'vite-plugin-compression';

export default {
  plugins: [
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240, // Only compress files > 10KB
    }),
  ],
};
```

### 3. Caching Strategies

**Service Worker for offline caching**:

```javascript
// service-worker.js
const CACHE_NAME = 'cultivation-clicker-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // Fetch from network
      return fetch(event.request);
    })
  );
});
```

**HTTP Cache Headers**:
```javascript
// Server-side (Express example)
app.use(express.static('public', {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
}));

// Specific routes
app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.json(data);
});
```

### 4. Prefetching Critical Resources

```html
<!-- Preconnect to API server -->
<link rel="preconnect" href="https://api.cultivationclicker.com">

<!-- DNS prefetch for third-party resources -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- Prefetch next page -->
<link rel="prefetch" href="/battle">

<!-- Preload critical resources -->
<link rel="preload" href="/fonts/NotoSansTC-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/images/hero-bg.webp" as="image">
```

**Dynamic Prefetching**:
```javascript
// Prefetch on hover
document.querySelectorAll('a[data-prefetch]').forEach(link => {
  link.addEventListener('mouseenter', () => {
    const href = link.getAttribute('href');
    const linkTag = document.createElement('link');
    linkTag.rel = 'prefetch';
    linkTag.href = href;
    document.head.appendChild(linkTag);
  });
});
```

---

## Memory Management

### 1. Cleanup Event Listeners

```javascript
// React useEffect cleanup
useEffect(() => {
  const handleResize = () => {
    updateLayout();
  };

  window.addEventListener('resize', handleResize);

  // Cleanup on unmount
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 2. Cancel Ongoing Requests

```javascript
// Using AbortController
function fetchData() {
  const controller = new AbortController();
  const signal = controller.signal;

  fetch('/api/data', { signal })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(err => {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
      }
    });

  // Cancel if component unmounts
  return () => controller.abort();
}

// In React
useEffect(() => {
  const controller = new AbortController();

  fetchData(controller.signal);

  return () => controller.abort();
}, []);
```

### 3. Dispose of Animations

```javascript
// Store animation IDs and cancel on cleanup
let animationId;

function startAnimation() {
  function animate() {
    updateFrame();
    animationId = requestAnimationFrame(animate);
  }
  animate();
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
}

// React cleanup
useEffect(() => {
  startAnimation();
  return () => stopAnimation();
}, []);
```

### 4. Object Pooling

Reuse objects instead of creating new ones:

```javascript
// Damage number pool
class DamageNumberPool {
  constructor(size = 20) {
    this.pool = [];
    this.active = [];

    // Pre-create objects
    for (let i = 0; i < size; i++) {
      this.pool.push(this.createDamageNumber());
    }
  }

  createDamageNumber() {
    const element = document.createElement('div');
    element.className = 'damage-number';
    return element;
  }

  get() {
    // Reuse from pool or create new
    const element = this.pool.pop() || this.createDamageNumber();
    this.active.push(element);
    return element;
  }

  release(element) {
    // Return to pool
    const index = this.active.indexOf(element);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(element);
    }
  }
}
```

---

## Battle System Optimization

【參考：05-interactions/battle-feedback.md】

### 1. Battle Log Virtualization

Only render visible log entries:

```javascript
import { FixedSizeList } from 'react-window';

function BattleLog({ entries }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={entries.length}
      itemSize={30}
      width="100%"
      initialScrollOffset={entries.length * 30} // Auto-scroll to bottom
    >
      {({ index, style }) => (
        <div style={style} className="log-entry">
          {entries[index]}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 2. Damage Number Pooling

```javascript
const damageNumberPool = new DamageNumberPool(20);

function showDamageNumber(x, y, damage) {
  const element = damageNumberPool.get();
  element.textContent = damage;
  element.style.left = x + 'px';
  element.style.top = y + 'px';

  document.body.appendChild(element);

  // Return to pool after animation
  setTimeout(() => {
    document.body.removeChild(element);
    damageNumberPool.release(element);
  }, 1000);
}
```

### 3. Canvas Rendering for Particles

Use canvas for many particles instead of DOM elements:

```javascript
class ParticleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.particles = [];
  }

  addParticles(particles) {
    this.particles.push(...particles);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Batch draw all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.isDead()) {
        this.particles.splice(i, 1);
        continue;
      }

      p.update();
      p.draw(this.ctx);
    }

    requestAnimationFrame(() => this.render());
  }
}
```

---

## Monitoring

### 1. Performance API

```javascript
// Measure page load times
window.addEventListener('load', () => {
  const perfData = performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;

  console.log('Page load time:', pageLoadTime, 'ms');
  console.log('Server connect time:', connectTime, 'ms');
});

// Measure specific operations
performance.mark('battle-start');
// ... battle logic ...
performance.mark('battle-end');
performance.measure('battle-duration', 'battle-start', 'battle-end');

const measures = performance.getEntriesByName('battle-duration');
console.log('Battle took:', measures[0].duration, 'ms');
```

### 2. Lighthouse

Run Lighthouse audits:

```bash
# CLI
npm install -g lighthouse
lighthouse https://your-site.com --view

# In Chrome DevTools
# Open DevTools > Lighthouse tab > Generate report
```

### 3. WebPageTest

Test from different locations and devices:
- Visit https://www.webpagetest.org/
- Enter your URL
- Select test location and device
- Analyze waterfall chart and recommendations

### 4. Real User Monitoring (RUM)

```javascript
// Send performance metrics to analytics
function sendMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0];

  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({
      url: window.location.href,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: navigation.largestContentfulPaint,
      fid: navigation.firstInputDelay,
      cls: navigation.cumulativeLayoutShift,
      ttfb: navigation.responseStart - navigation.requestStart,
    }),
  });
}

// Send metrics on page load
window.addEventListener('load', () => {
  setTimeout(sendMetrics, 0);
});
```

---

## Performance Budget

Set and enforce performance budgets:

| Metric | Budget | Critical |
|--------|--------|----------|
| Total page size | < 2 MB | < 1 MB |
| JavaScript | < 500 KB | < 300 KB |
| CSS | < 100 KB | < 50 KB |
| Images | < 1 MB | < 500 KB |
| Fonts | < 200 KB | < 100 KB |
| FCP | < 1.8s | < 1.0s |
| LCP | < 2.5s | < 1.5s |
| TTI | < 3.8s | < 2.5s |
| TBT | < 200ms | < 100ms |
| CLS | < 0.1 | < 0.05 |

**Enforce with Lighthouse CI**:

```javascript
// lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-byte-weight": ["error", { "maxNumericValue": 2000000 }]
      }
    }
  }
}
```

---

## Checklist

### Initial Load Performance
- [ ] Enable gzip/Brotli compression
- [ ] Minimize JavaScript bundle size (< 300 KB critical)
- [ ] Code split by route
- [ ] Lazy load non-critical components
- [ ] Optimize images (WebP, compression, lazy loading)
- [ ] Preload critical fonts
- [ ] Use font-display: swap
- [ ] Inline critical CSS
- [ ] Defer non-critical JavaScript
- [ ] Set appropriate cache headers

### Runtime Performance
- [ ] Use GPU-accelerated CSS properties (transform, opacity)
- [ ] Implement virtual scrolling for long lists
- [ ] Memoize expensive React components
- [ ] Use useCallback for event handlers
- [ ] Avoid forced reflows (batch DOM reads/writes)
- [ ] Use requestAnimationFrame for animations
- [ ] Implement object pooling for frequently created/destroyed objects
- [ ] Clean up event listeners and timers
- [ ] Cancel ongoing requests on unmount
- [ ] Respect prefers-reduced-motion

### Network Performance
- [ ] Use HTTP/2
- [ ] Enable resource compression
- [ ] Implement Service Worker for offline caching
- [ ] Preconnect to API servers
- [ ] Prefetch next pages on hover
- [ ] Optimize API response sizes (pagination, field selection)

### Monitoring
- [ ] Set up Lighthouse CI
- [ ] Monitor Core Web Vitals
- [ ] Implement Real User Monitoring (RUM)
- [ ] Set performance budgets
- [ ] Regular performance audits

---

## Summary

Performance optimization is an ongoing process:

1. **Measure**: Use Lighthouse, WebPageTest, and Performance API
2. **Set Goals**: Define performance budgets (FCP < 1.8s, LCP < 2.5s, etc.)
3. **Optimize**: Apply strategies from this guide
4. **Monitor**: Track metrics with RUM
5. **Iterate**: Continuously improve based on data

**Key Principles**:
- Load less: Code splitting, lazy loading, compression
- Render fast: GPU-accelerated animations, virtual scrolling
- Cache smart: Service Worker, HTTP caching
- Monitor always: Lighthouse CI, RUM

【相關文檔】
- `06-specifications/responsive-design.md` - Responsive design specs
- `06-specifications/animation-library.md` - Animation performance
- `05-interactions/battle-feedback.md` - Battle system optimizations
- `06-specifications/implementation-guide.md` - Implementation best practices
