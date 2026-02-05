# 動畫庫和效果 (Animation Library and Effects)

## Overview

This document defines the complete animation library for Cultivation Clicker, including transitions, micro-interactions, battle animations, and particle effects. Animations enhance user experience by providing visual feedback, guiding attention, and creating engaging gameplay.

**Animation Principles**:
- **Purpose**: Every animation serves a purpose (feedback, transition, delight)
- **Performance**: Use GPU-accelerated properties (transform, opacity)
- **Duration**: Short and snappy (150-300ms for most interactions)
- **Easing**: Natural motion curves (ease-out for entrances, ease-in for exits)
- **Accessibility**: Respect prefers-reduced-motion

【參考：05-interactions/animation-timing.md】

---

## Animation Types

### 1. Transitions

Property changes that happen smoothly over time.

**Use Cases**:
- Color changes (hover, active states)
- Size changes (buttons, cards)
- Position changes (sliding panels)
- Opacity changes (fade in/out)

**Duration**: 150-300ms
**Easing**: ease-out (default)

```css
.button {
  background-color: var(--color-primary);
  transform: scale(1);
  transition: background-color 200ms ease-out,
              transform 150ms ease-out;
}

.button:hover {
  background-color: var(--color-primary-hover);
  transform: scale(1.05);
}

.button:active {
  transform: scale(0.95);
}
```

### 2. Keyframe Animations

Complex animation sequences with multiple steps.

**Use Cases**:
- Loading spinners
- Success/error indicators
- Entrance animations
- Attention-grabbing effects

**Duration**: Varies (500ms - 2000ms)
**Iteration**: Can loop or play once

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}
```

### 3. Page Transitions

Smooth transitions between screens.

**Use Cases**:
- Screen navigation
- Modal open/close
- Tab switching

**Duration**: 300-400ms
**Easing**: ease-in-out

```css
/* Fade transition */
.page-enter {
  opacity: 0;
}

.page-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-in-out;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 300ms ease-in-out;
}
```

### 4. Micro-interactions

Small animations for user feedback.

**Use Cases**:
- Button press feedback
- Toggle switches
- Checkbox checks
- Input focus states

**Duration**: 100-200ms
**Easing**: ease-out

```css
/* Checkbox check animation */
.checkbox__icon {
  opacity: 0;
  transform: scale(0);
  transition: opacity 150ms ease-out,
              transform 150ms ease-out;
}

.checkbox:checked ~ .checkbox__icon {
  opacity: 1;
  transform: scale(1);
}
```

### 5. Loading Animations

Indicate progress or ongoing processes.

**Use Cases**:
- Loading screens
- Progress bars
- Skeleton screens
- Infinite spinners

**Duration**: Continuous or progress-based

```css
/* Progress bar animation */
.progress-bar__fill {
  width: 0;
  transition: width 500ms ease-out;
}

.progress-bar__fill[data-progress="50"] {
  width: 50%;
}

/* Skeleton shimmer */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 6. Success/Error Animations

Visual feedback for user actions.

**Use Cases**:
- Form submission success
- Error messages
- Achievement unlocked
- Level up notifications

**Duration**: 400-600ms
**Style**: Bouncy, attention-grabbing

```css
/* Success checkmark */
@keyframes checkmark {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-45deg);
  }
  50% {
    transform: scale(1.2) rotate(-45deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(-45deg);
  }
}

.success-icon {
  animation: checkmark 400ms ease-out;
}

/* Error shake */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-4px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(4px);
  }
}

.error-message {
  animation: shake 400ms ease-in-out;
}
```

---

## Animation Timing Functions

### Standard Easing Curves

```css
/* Linear - Constant speed */
.linear {
  transition-timing-function: linear;
}

/* Ease - Default (slow start, fast middle, slow end) */
.ease {
  transition-timing-function: ease;
}

/* Ease-in - Slow start, fast end */
.ease-in {
  transition-timing-function: ease-in;
}

/* Ease-out - Fast start, slow end (recommended for most UI) */
.ease-out {
  transition-timing-function: ease-out;
}

/* Ease-in-out - Slow start and end, fast middle */
.ease-in-out {
  transition-timing-function: ease-in-out;
}
```

### Custom Cubic Bezier

```css
/* Material Design standard */
.material-standard {
  transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Material Design deceleration (ease-out) */
.material-deceleration {
  transition-timing-function: cubic-bezier(0.0, 0.0, 0.2, 1);
}

/* Material Design acceleration (ease-in) */
.material-acceleration {
  transition-timing-function: cubic-bezier(0.4, 0.0, 1, 1);
}

/* Bounce effect */
.bounce {
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Duration Guidelines

| Interaction | Duration | Easing | Use Case |
|-------------|----------|--------|----------|
| Micro-interaction | 100-150ms | ease-out | Button hover, focus |
| Transition | 200-300ms | ease-out | Color, size changes |
| Page transition | 300-400ms | ease-in-out | Screen navigation |
| Attention | 400-600ms | ease-out | Success, error feedback |
| Entrance | 300-500ms | ease-out | Modal open, dropdown |
| Exit | 200-300ms | ease-in | Modal close, dismiss |
| Loading | 1000-2000ms | linear | Spinners, progress |

---

## Standard Animations

### Fade In/Out

```css
/* Fade in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 300ms ease-out;
}

/* Fade out */
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.fade-out {
  animation: fadeOut 200ms ease-in;
}
```

### Slide In/Out

```css
/* Slide in from right */
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

.slide-in-right {
  animation: slideInRight 300ms ease-out;
}

/* Slide in from left */
@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Slide in from top */
@keyframes slideInTop {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Slide in from bottom */
@keyframes slideInBottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### Scale (Zoom)

```css
/* Zoom in */
@keyframes zoomIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.zoom-in {
  animation: zoomIn 300ms ease-out;
}

/* Zoom out */
@keyframes zoomOut {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0);
    opacity: 0;
  }
}
```

### Rotate

```css
/* Rotate 360 degrees */
@keyframes rotate360 {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotate-360 {
  animation: rotate360 1s linear infinite;
}

/* Rotate back and forth */
@keyframes rotateWiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.rotate-wiggle {
  animation: rotateWiggle 500ms ease-in-out;
}
```

### Shake

```css
/* Shake horizontally (error feedback) */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-8px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(8px);
  }
}

.shake {
  animation: shake 400ms ease-in-out;
}
```

### Bounce

```css
/* Bounce effect (success feedback) */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.bounce {
  animation: bounce 600ms ease-out;
}
```

### Flash

```css
/* Flash effect (level-up, critical hit) */
@keyframes flash {
  0%, 50%, 100% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0;
  }
}

.flash {
  animation: flash 500ms ease-in-out;
}

/* Glow flash */
@keyframes glowFlash {
  0%, 100% {
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
  }
}

.glow-flash {
  animation: glowFlash 600ms ease-in-out;
}
```

### Typewriter

```css
/* Typewriter text reveal */
@keyframes typewriter {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.typewriter {
  overflow: hidden;
  white-space: nowrap;
  animation: typewriter 2s steps(40, end);
}
```

### Floating Text

```css
/* Damage numbers floating up */
@keyframes floatUp {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-50px);
    opacity: 0;
  }
}

.damage-number {
  animation: floatUp 1s ease-out forwards;
}
```

---

## Battle Animations

【參考：05-interactions/battle-feedback.md】

### Attack Animation

```css
/* Character shake when attacking */
@keyframes attackShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.character--attacking {
  animation: attackShake 200ms ease-in-out;
}

/* Weapon slash effect */
@keyframes slash {
  0% {
    transform: translateX(-20px) rotate(-45deg);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(20px) rotate(-45deg);
    opacity: 0;
  }
}

.slash-effect {
  animation: slash 300ms ease-out;
}
```

### Damage Flash

```css
/* Character flashes red when hit */
@keyframes damageFlash {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.5) saturate(2) hue-rotate(-10deg);
  }
}

.character--damaged {
  animation: damageFlash 200ms ease-in-out;
}
```

### HP Bar Depletion

```css
/* HP bar decreases smoothly */
.hp-bar__fill {
  width: 100%;
  transition: width 500ms ease-out;
}

.hp-bar__fill[data-hp="50"] {
  width: 50%;
}

/* Delayed background shows lost HP */
.hp-bar__lost {
  width: 100%;
  background: rgba(255, 0, 0, 0.3);
  transition: width 500ms ease-out 300ms; /* Delay 300ms */
}
```

### MP Consumption

```css
/* MP bar decreases quickly */
.mp-bar__fill {
  transition: width 300ms ease-out;
}

/* Glow effect when using skill */
@keyframes mpGlow {
  0%, 100% {
    box-shadow: 0 0 0 rgba(0, 150, 255, 0);
  }
  50% {
    box-shadow: 0 0 10px rgba(0, 150, 255, 1);
  }
}

.mp-bar--consuming {
  animation: mpGlow 400ms ease-in-out;
}
```

### Skill Activation

```css
/* Skill button glows when activated */
@keyframes skillActivate {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 215, 0, 0);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255, 215, 0, 1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 215, 0, 0);
  }
}

.skill-button--activated {
  animation: skillActivate 500ms ease-out;
}
```

### Victory Celebration

```css
/* Character jumps when battle won */
@keyframes victoryJump {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-30px);
  }
  50% {
    transform: translateY(-20px);
  }
  75% {
    transform: translateY(-10px);
  }
}

.character--victory {
  animation: victoryJump 800ms ease-out;
}

/* Victory text appears */
@keyframes victoryText {
  0% {
    transform: scale(0) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.victory-text {
  animation: victoryText 600ms ease-out;
}
```

### Defeat Fade-out

```css
/* Character fades and falls when defeated */
@keyframes defeatFade {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(20px) rotate(-5deg);
    opacity: 0;
  }
}

.character--defeated {
  animation: defeatFade 1s ease-in forwards;
}
```

---

## Parallax Effects

### Background Parallax Scrolling

```css
/* Parallax container */
.parallax-container {
  overflow: hidden;
  position: relative;
}

.parallax-layer {
  position: absolute;
  width: 100%;
  height: 100%;
}

/* Layers move at different speeds */
.parallax-layer--far {
  transform: translateZ(-3px) scale(4);
}

.parallax-layer--mid {
  transform: translateZ(-2px) scale(3);
}

.parallax-layer--near {
  transform: translateZ(-1px) scale(2);
}
```

### JavaScript Parallax Implementation

```javascript
// Simple parallax effect
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;

  document.querySelectorAll('.parallax-layer').forEach(layer => {
    const speed = layer.dataset.speed || 0.5;
    const yPos = -(scrolled * speed);
    layer.style.transform = `translateY(${yPos}px)`;
  });
});
```

---

## Particle Effects

【參考：04-components/effects.md】

### Sparkles (Treasure, Level-up)

```css
@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.sparkle {
  width: 4px;
  height: 4px;
  background: #FFD700;
  border-radius: 50%;
  animation: sparkle 800ms ease-in-out infinite;
}

/* Stagger sparkles */
.sparkle:nth-child(2) { animation-delay: 200ms; }
.sparkle:nth-child(3) { animation-delay: 400ms; }
.sparkle:nth-child(4) { animation-delay: 600ms; }
```

### Dust Clouds (Movement)

```javascript
// Canvas-based dust cloud
class DustParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -Math.random() * 2;
    this.life = 30;
    this.maxLife = 30;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.life--;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = `rgba(200, 180, 150, ${alpha * 0.5})`;
    ctx.fillRect(this.x, this.y, 2, 2);
  }

  isDead() {
    return this.life <= 0;
  }
}
```

### Fire/Smoke (Dragon Breath)

```javascript
// Fire particle system
class FireParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1;
    this.vy = -Math.random() * 3 - 1;
    this.life = 40;
    this.maxLife = 40;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.size *= 0.95; // Shrink over time
  }

  draw(ctx) {
    const lifeRatio = this.life / this.maxLife;

    // Color gradient: yellow -> orange -> red -> transparent
    let r, g, b;
    if (lifeRatio > 0.5) {
      // Yellow to orange
      r = 255;
      g = 255 - (1 - lifeRatio) * 255;
      b = 0;
    } else {
      // Orange to red
      r = 255;
      g = lifeRatio * 255;
      b = 0;
    }

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${lifeRatio})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  isDead() {
    return this.life <= 0;
  }
}
```

### Stars (Critical Hit)

```css
/* Star burst animation */
@keyframes starBurst {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(2) rotate(180deg);
    opacity: 0;
  }
}

.star {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #FFD700;
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
  animation: starBurst 600ms ease-out forwards;
}

/* Position stars in circle */
.star:nth-child(1) { transform: rotate(0deg) translateY(-30px); }
.star:nth-child(2) { transform: rotate(72deg) translateY(-30px); }
.star:nth-child(3) { transform: rotate(144deg) translateY(-30px); }
.star:nth-child(4) { transform: rotate(216deg) translateY(-30px); }
.star:nth-child(5) { transform: rotate(288deg) translateY(-30px); }
```

---

## Performance

### GPU-Accelerated Properties

**Use these properties for smooth 60fps animations**:
- `transform` (translate, scale, rotate)
- `opacity`

**Avoid animating these properties** (cause layout recalculation):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border`

```css
/* Good: GPU-accelerated */
.element {
  transform: translateX(100px);
  opacity: 0.5;
  transition: transform 300ms, opacity 300ms;
}

/* Bad: Triggers layout */
.element {
  left: 100px;
  opacity: 0.5;
  transition: left 300ms, opacity 300ms;
}
```

### will-change Property

Use `will-change` to hint browser about upcoming animations:

```css
/* Before animation starts */
.element {
  will-change: transform, opacity;
}

/* After animation ends, remove will-change */
.element.animation-done {
  will-change: auto;
}
```

**Warning**: Don't overuse `will-change` - it consumes memory!

### RequestAnimationFrame

For JavaScript animations, use `requestAnimationFrame`:

```javascript
// Good: Synced with browser refresh rate
function animate() {
  // Update animation
  updatePosition();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Bad: SetInterval not synced with frames
setInterval(() => {
  updatePosition();
}, 16); // Roughly 60fps, but not precise
```

### Reduce Motion

Respect user's motion preferences:

```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Performance Checklist

- [ ] Animate only `transform` and `opacity`
- [ ] Use `will-change` sparingly (add before animation, remove after)
- [ ] Use `requestAnimationFrame` for JavaScript animations
- [ ] Keep animations under 300ms for UI interactions
- [ ] Test on lower-end devices (throttle CPU in DevTools)
- [ ] Respect `prefers-reduced-motion`
- [ ] Avoid animating many elements simultaneously
- [ ] Use CSS animations when possible (more performant than JS)

---

## Implementation

### CSS Animations

```css
/* Define keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Apply animation */
.element {
  animation: fadeIn 300ms ease-out;
}

/* Animation properties */
.element {
  animation-name: fadeIn;
  animation-duration: 300ms;
  animation-timing-function: ease-out;
  animation-delay: 0s;
  animation-iteration-count: 1;
  animation-direction: normal;
  animation-fill-mode: forwards;
}
```

### CSS Transitions

```css
/* Simple transition */
.button {
  transition: background-color 200ms ease-out;
}

/* Multiple properties */
.button {
  transition: background-color 200ms ease-out,
              transform 150ms ease-out,
              box-shadow 200ms ease-out;
}

/* All properties */
.button {
  transition: all 200ms ease-out;
}
```

### JavaScript Animation (requestAnimationFrame)

```javascript
// Animate element position
function animateElement(element, startX, endX, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3);

    const currentX = startX + (endX - startX) * eased;
    element.style.transform = `translateX(${currentX}px)`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
```

### Canvas Animations (Particles)

```javascript
// Particle system
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  update() {
    // Remove dead particles
    this.particles = this.particles.filter(p => !p.isDead());

    // Update remaining particles
    this.particles.forEach(p => p.update());
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => p.draw(this.ctx));
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

// Usage
const particleSystem = new ParticleSystem(canvas);
particleSystem.addParticle(new DustParticle(100, 100));
particleSystem.animate();
```

### Animation Libraries

**GSAP (GreenSock Animation Platform)**:
```javascript
// GSAP animation
gsap.to('.element', {
  x: 100,
  opacity: 0.5,
  duration: 0.3,
  ease: 'power2.out'
});
```

**Anime.js**:
```javascript
// Anime.js animation
anime({
  targets: '.element',
  translateX: 100,
  opacity: 0.5,
  duration: 300,
  easing: 'easeOutQuad'
});
```

---

## Code Examples

### Complete Battle Hit Animation

```html
<div class="battle-arena">
  <div class="character character--player" id="player">
    <img src="hero.png" alt="Hero">
    <div class="hp-bar">
      <div class="hp-bar__fill" id="playerHP"></div>
      <div class="hp-bar__lost" id="playerHPLost"></div>
    </div>
  </div>

  <div class="character character--enemy" id="enemy">
    <img src="dragon.png" alt="Dragon">
    <div class="hp-bar">
      <div class="hp-bar__fill" id="enemyHP"></div>
    </div>
  </div>
</div>

<div id="damageNumbers"></div>
```

```javascript
// Attack animation with damage
function performAttack(attacker, target, damage) {
  // 1. Attacker shake
  attacker.classList.add('character--attacking');

  setTimeout(() => {
    attacker.classList.remove('character--attacking');

    // 2. Target damage flash
    target.classList.add('character--damaged');

    // 3. Show damage number
    showDamageNumber(target, damage);

    // 4. HP bar decrease
    updateHP(target, damage);

    setTimeout(() => {
      target.classList.remove('character--damaged');
    }, 200);
  }, 200);
}

function showDamageNumber(target, damage) {
  const rect = target.getBoundingClientRect();
  const damageEl = document.createElement('div');
  damageEl.className = 'damage-number';
  damageEl.textContent = damage;
  damageEl.style.left = rect.left + rect.width / 2 + 'px';
  damageEl.style.top = rect.top + 'px';

  document.getElementById('damageNumbers').appendChild(damageEl);

  // Remove after animation
  setTimeout(() => damageEl.remove(), 1000);
}

function updateHP(character, damage) {
  const hpBar = character.querySelector('.hp-bar__fill');
  const currentHP = parseInt(hpBar.dataset.hp);
  const maxHP = parseInt(hpBar.dataset.maxHp);
  const newHP = Math.max(0, currentHP - damage);
  const hpPercent = (newHP / maxHP) * 100;

  hpBar.dataset.hp = newHP;
  hpBar.style.width = hpPercent + '%';
}
```

```css
/* Attacking animation */
@keyframes attackShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.character--attacking {
  animation: attackShake 200ms ease-in-out;
}

/* Damage flash */
@keyframes damageFlash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.8) saturate(1.5); }
}

.character--damaged {
  animation: damageFlash 200ms ease-in-out;
}

/* Damage number floating */
@keyframes damageFloat {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-50px);
    opacity: 0;
  }
}

.damage-number {
  position: fixed;
  font-size: 24px;
  font-weight: bold;
  color: #ff4444;
  text-shadow: 2px 2px 0 #000;
  pointer-events: none;
  animation: damageFloat 1s ease-out forwards;
}

/* HP bar transition */
.hp-bar__fill {
  width: 100%;
  height: 100%;
  background: #4CAF50;
  transition: width 500ms ease-out;
}

.hp-bar__lost {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 0, 0, 0.3);
  transition: width 500ms ease-out 300ms;
}
```

---

## Summary

This animation library provides a comprehensive set of animations for Cultivation Clicker:

1. **Standard animations**: Fade, slide, scale, rotate for UI transitions
2. **Battle animations**: Attack, damage, HP bars for combat feedback
3. **Particle effects**: Sparkles, dust, fire for visual enhancement
4. **Performance optimization**: GPU-accelerated properties, requestAnimationFrame
5. **Accessibility**: Respect prefers-reduced-motion

**Key Principles**:
- Keep animations short (150-300ms for UI)
- Use GPU-accelerated properties (transform, opacity)
- Provide clear feedback for user actions
- Test performance on lower-end devices

【相關文檔】
- `05-interactions/animation-timing.md` - Animation timing guidelines
- `05-interactions/battle-feedback.md` - Battle feedback specifications
- `04-components/effects.md` - Visual effects components
- `06-specifications/performance-optimization.md` - Performance guidelines
