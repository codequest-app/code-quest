# 無障礙設計 (Accessibility)

## Overview

Accessibility ensures that all users, including those with disabilities, can effectively use the application. This document outlines our commitment to WCAG AA compliance and provides comprehensive guidelines for creating an inclusive user experience.

**Commitment:**
- Target: WCAG 2.1 Level AA compliance
- All features accessible via keyboard
- Screen reader compatible
- Color contrast compliant
- Responsive to user preferences (reduced motion, high contrast)
- Regular accessibility audits

**POUR Principles:**
- **Perceivable:** Information must be presentable to users in ways they can perceive
- **Operable:** UI components must be operable by all users
- **Understandable:** Information and operation must be understandable
- **Robust:** Content must be robust enough for assistive technologies

## Screen Reader Support

### Semantic HTML

Use semantic HTML elements for their inherent accessibility features:

```html
<!-- Good: Semantic structure -->
<header>
  <nav>
    <ul>
      <li><a href="/home">Home</a></li>
      <li><a href="/characters">Characters</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Character Stats</h1>
    <section>
      <h2>Attributes</h2>
      <ul>
        <li>Strength: <strong>18</strong></li>
        <li>Dexterity: <strong>14</strong></li>
      </ul>
    </section>
  </article>
</main>

<footer>
  <p>&copy; 2026 Game Name</p>
</footer>
```

```html
<!-- Bad: Non-semantic divs -->
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
    <div class="nav-item">Characters</div>
  </div>
</div>

<div class="content">
  <div class="title">Character Stats</div>
  <div class="section">
    <div class="subtitle">Attributes</div>
    <!-- ... -->
  </div>
</div>
```

### ARIA Labels and Roles

When semantic HTML isn't sufficient, use ARIA attributes:

**Basic ARIA Patterns:**
```jsx
// Button (when not using <button>)
<div
  role="button"
  tabIndex={0}
  aria-label="Close dialog"
  onClick={handleClose}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClose();
  }}
>
  <Icon name="close" aria-hidden="true" />
</div>

// Icon button with label
<button aria-label="Delete item">
  <Icon name="trash" aria-hidden="true" />
</button>

// Link that looks like button
<a href="/characters" role="button" aria-label="View characters">
  Characters
</a>

// Image with description
<img src="character.png" alt="Knight character with sword and shield" />

// Decorative image (ignored by screen readers)
<img src="decorative-border.png" alt="" aria-hidden="true" />

// Text alternative for icon
<span aria-label="Warning">
  <Icon name="warning" aria-hidden="true" />
</span>
```

**Form Labels:**
```jsx
// Explicit label
<label htmlFor="username">Username:</label>
<input id="username" type="text" />

// Wrapped label
<label>
  Username:
  <input type="text" />
</label>

// ARIA label (when visual label not possible)
<input
  type="text"
  aria-label="Search characters"
  placeholder="Search..."
/>

// ARIA described by (additional info)
<input
  id="password"
  type="password"
  aria-describedby="password-help"
/>
<span id="password-help">
  Password must be at least 8 characters
</span>

// Error message
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Please enter a valid email address
</span>
```

### ARIA Live Regions

Announce dynamic content changes to screen readers:

```jsx
// Polite announcement (wait for current speech)
function NotificationBanner({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

// Assertive announcement (interrupt current speech)
function ErrorAlert({ error }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {error}
    </div>
  );
}

// Loading state
function LoadingIndicator({ loading, message = "Loading..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={loading}
    >
      {loading && (
        <>
          <Spinner aria-hidden="true" />
          <span>{message}</span>
        </>
      )}
    </div>
  );
}

// Battle log updates
function BattleLog({ entries }) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-atomic="false"
    >
      {entries.map(entry => (
        <div key={entry.id}>{entry.message}</div>
      ))}
    </div>
  );
}
```

### Screen Reader Announcements

**Announce State Changes:**
```jsx
function useLiveAnnouncement() {
  const announceRef = useRef(null);

  useEffect(() => {
    // Create live region if doesn't exist
    if (!announceRef.current) {
      announceRef.current = document.createElement('div');
      announceRef.current.setAttribute('role', 'status');
      announceRef.current.setAttribute('aria-live', 'polite');
      announceRef.current.setAttribute('aria-atomic', 'true');
      announceRef.current.style.position = 'absolute';
      announceRef.current.style.left = '-10000px';
      announceRef.current.style.width = '1px';
      announceRef.current.style.height = '1px';
      announceRef.current.style.overflow = 'hidden';
      document.body.appendChild(announceRef.current);
    }
  }, []);

  const announce = useCallback((message, priority = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      // Clear and re-set to trigger announcement
      announceRef.current.textContent = '';
      setTimeout(() => {
        announceRef.current.textContent = message;
      }, 100);
    }
  }, []);

  return announce;
}

// Usage
function CharacterCreator() {
  const announce = useLiveAnnouncement();

  const handleSave = async () => {
    try {
      await saveCharacter();
      announce('Character saved successfully');
    } catch (error) {
      announce('Failed to save character', 'assertive');
    }
  };

  return <button onClick={handleSave}>Save Character</button>;
}
```

**Battle Announcements:**
```jsx
function BattleSystem() {
  const announce = useLiveAnnouncement();

  const executeTurn = (character, action, target) => {
    // Execute action
    const result = performAction(character, action, target);

    // Announce result
    const message = `${character.name} used ${action.name} on ${target.name}. ${result.damage} damage dealt.`;
    announce(message);
  };

  return <BattleInterface onAction={executeTurn} />;
}
```

### Descriptive Link Text

```jsx
// Bad: Non-descriptive links
<a href="/guide">Click here</a>
<a href="/docs">Read more</a>

// Good: Descriptive links
<a href="/guide">Character creation guide</a>
<a href="/docs">Complete game documentation</a>

// Good: Context with aria-label
<a href="/characters/123" aria-label="View Warrior character details">
  View details
</a>

// Good: Context in surrounding text
<p>
  The new skill system is now available.{' '}
  <a href="/skills">Learn about skills</a>
</p>
```

## Keyboard Accessibility

**【參考：05-interactions/keyboard-navigation.md】** for comprehensive keyboard navigation guidelines.

### All Features Keyboard-Accessible

**Checklist:**
- [ ] Every interactive element has `tabindex` (0 for natural order, -1 for programmatic focus)
- [ ] All actions performable with Enter or Space
- [ ] Arrow keys work in lists and menus
- [ ] Escape closes modals and cancels actions
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Focus visible at all times

**Example: Accessible Custom Dropdown**
```jsx
function AccessibleDropdown({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRef = useRef(null);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(i => (i + 1) % options.length);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(i => (i - 1 + options.length) % options.length);
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          onChange(options[focusedIndex]);
          setIsOpen(false);
          buttonRef.current?.focus();
        } else {
          setIsOpen(!isOpen);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  return (
    <div className="dropdown">
      <button
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        {value || 'Select...'}
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option === value}
              tabIndex={index === focusedIndex ? 0 : -1}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### No Keyboard Traps

Users must always be able to navigate away:

```jsx
// Good: Allow escape from custom widget
function CustomWidget() {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        // Allow user to exit
        exitWidget();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <div>...</div>;
}

// Good: Focus trap with escape
function Modal({ isOpen, onClose }) {
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return <div ref={modalRef}>...</div>;
}
```

### Visible Focus Indicators

```css
/* Global focus styles */
*:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Component-specific focus */
button:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.2);
}

input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  outline: none;
}

/* High contrast focus */
@media (prefers-contrast: high) {
  *:focus-visible {
    outline-width: 3px;
    outline-offset: 3px;
  }
}
```

### Skip to Content

```jsx
function Layout({ children }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />
      <Navigation />

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </>
  );
}
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## Visual Accessibility

### Color Contrast

**WCAG AA Requirements:**
- **Normal text (< 18pt):** 4.5:1 contrast ratio
- **Large text (≥ 18pt or bold ≥ 14pt):** 3:1 contrast ratio
- **UI components:** 3:1 contrast ratio
- **Active UI components:** 3:1 against adjacent colors

**Color Palette with Contrast Ratios:**

| Background | Foreground | Ratio | Pass AA? |
|------------|------------|-------|----------|
| #FFFFFF (White) | #333333 (Dark Gray) | 12.6:1 | ✓ Pass (AAA) |
| #FFFFFF | #4A90E2 (Blue) | 3.4:1 | ✓ Pass (Large text) |
| #F5F5F5 (Light Gray) | #333333 | 11.7:1 | ✓ Pass (AAA) |
| #4A90E2 (Blue) | #FFFFFF | 3.4:1 | ✓ Pass (Large text) |
| #27AE60 (Green) | #FFFFFF | 2.9:1 | ✗ Fail |
| #27AE60 | #0D4B22 (Dark Green) | 5.2:1 | ✓ Pass |
| #E74C3C (Red) | #FFFFFF | 3.6:1 | ✓ Pass (Large text) |
| #333333 | #FFFFFF | 12.6:1 | ✓ Pass (AAA) |

**Implementation:**
```jsx
// Color contrast utility
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function meetsAARequirement(bg, fg, isLargeText = false) {
  const ratio = getContrastRatio(bg, fg);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// Usage in components
function Button({ variant = 'primary', children }) {
  const styles = {
    primary: {
      bg: '#4A90E2',
      fg: '#FFFFFF', // 3.4:1 - OK for large text (16px bold)
      fontSize: '16px',
      fontWeight: 'bold'
    },
    secondary: {
      bg: '#F5F5F5',
      fg: '#333333', // 11.7:1 - AAA compliant
      fontSize: '16px'
    }
  };

  return (
    <button style={{
      background: styles[variant].bg,
      color: styles[variant].fg,
      fontSize: styles[variant].fontSize,
      fontWeight: styles[variant].fontWeight
    }}>
      {children}
    </button>
  );
}
```

### Don't Rely on Color Alone

Use multiple visual cues (color + icon + text + pattern):

```jsx
// Bad: Color only
<div style={{ color: 'red' }}>Error</div>
<div style={{ color: 'green' }}>Success</div>

// Good: Color + icon + text
<div className="status-error">
  <Icon name="error" aria-hidden="true" />
  <span>Error: Failed to save</span>
</div>

<div className="status-success">
  <Icon name="check" aria-hidden="true" />
  <span>Success: Saved successfully</span>
</div>

// Good: Form validation with multiple cues
<div className={`input-group ${error ? 'error' : ''}`}>
  <label htmlFor="email">
    Email
    {error && <Icon name="warning" aria-label="Error" />}
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <span id="email-error" className="error-message" role="alert">
      <Icon name="error" aria-hidden="true" />
      {error}
    </span>
  )}
</div>

// Good: Status with pattern + color
<div className={`status-indicator ${status}`}>
  <span className="pattern" aria-hidden="true">
    {status === 'online' && '●'}
    {status === 'away' && '◐'}
    {status === 'offline' && '○'}
  </span>
  <span>{status}</span>
</div>
```

### Text Resize

Support text resizing up to 200% without loss of functionality:

```css
/* Use relative units (rem, em) */
body {
  font-size: 16px; /* Base size */
}

h1 {
  font-size: 2rem; /* 32px, scales with base */
}

p {
  font-size: 1rem; /* 16px */
  line-height: 1.5; /* Relative to font size */
}

button {
  padding: 0.5em 1em; /* Relative to button font size */
}

/* Support browser zoom */
@media (min-resolution: 2dppx) {
  /* High DPI adjustments if needed */
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  body {
    font-size: 14px; /* Smaller base on mobile */
  }
}
```

**Testing:**
```javascript
// Test different zoom levels
function testZoomLevels() {
  [100, 125, 150, 200].forEach(zoom => {
    console.log(`Testing at ${zoom}% zoom`);
    // Check for:
    // - Text overflow
    // - Layout breaks
    // - Overlapping elements
    // - Hidden content
  });
}
```

### High Contrast Mode

Support Windows High Contrast Mode and CSS forced-colors:

```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  /* Increase border widths */
  button,
  input,
  .card {
    border-width: 2px;
  }

  /* Stronger focus indicators */
  *:focus-visible {
    outline-width: 3px;
    outline-offset: 3px;
  }
}

/* Forced colors mode (Windows High Contrast) */
@media (forced-colors: active) {
  /* Use system colors */
  button {
    border: 1px solid ButtonText;
  }

  .icon {
    forced-color-adjust: auto;
  }

  /* Ensure icons are visible */
  .icon-decorative {
    forced-color-adjust: none;
    color: CanvasText;
  }
}
```

### Color Blindness Considerations

**Color Palette for Color Blindness:**

Choose colors that work for common types of color blindness:
- **Protanopia:** Red-blind
- **Deuteranopia:** Green-blind
- **Tritanopia:** Blue-blind

```javascript
// Safe color combinations
const accessibleColors = {
  // Blue + Orange (works for all types)
  primary: '#0073E6',    // Blue
  secondary: '#FF8C00',  // Orange

  // Purple + Yellow (works for all types)
  accent1: '#7B68EE',    // Purple
  accent2: '#FFD700',    // Yellow

  // Status colors (with icons)
  success: '#0A8754',    // Dark green (with ✓ icon)
  error: '#DC143C',      // Crimson (with ✗ icon)
  warning: '#FF8C00',    // Orange (with ⚠ icon)
  info: '#0073E6',       // Blue (with ℹ icon)

  // Grayscale (universally accessible)
  neutral100: '#F5F5F5',
  neutral300: '#D3D3D3',
  neutral500: '#808080',
  neutral700: '#404040',
  neutral900: '#1A1A1A'
};

// Test with color blindness simulators
function simulateColorBlindness(color, type) {
  // Simulate protanopia, deuteranopia, or tritanopia
  // Use tools like ColorOracle or browser extensions
}
```

**Chart Accessibility:**
```jsx
// Use patterns + colors for charts
function AccessibleChart({ data }) {
  const patterns = {
    strength: 'diagonal-lines',
    dexterity: 'dots',
    intelligence: 'horizontal-lines',
    vitality: 'vertical-lines'
  };

  return (
    <BarChart data={data}>
      {data.map(item => (
        <Bar
          key={item.stat}
          fill={colors[item.stat]}
          pattern={patterns[item.stat]}
          aria-label={`${item.stat}: ${item.value}`}
        />
      ))}
    </BarChart>
  );
}
```

## Motion and Animation

### Respect `prefers-reduced-motion`

```css
/* Default animations */
.card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }

  .card:hover {
    transform: none;
    /* Keep functional changes (shadow for feedback) */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  /* Disable auto-play animations */
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**React Implementation:**
```jsx
function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// Usage
function AnimatedCard({ children }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={reducedMotion ? {} : { y: -4 }}
      transition={reducedMotion ? {} : { duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### No Auto-Playing Animations > 5 Seconds

```jsx
// Auto-pause long animations
function BattleAnimation({ duration }) {
  const [paused, setPaused] = useState(duration > 5000);

  return (
    <div>
      <animation paused={paused} />

      {duration > 5000 && (
        <button onClick={() => setPaused(!paused)}>
          {paused ? 'Play' : 'Pause'}
        </button>
      )}
    </div>
  );
}
```

### Pause/Stop Controls

```jsx
function VideoBackground({ src }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  return (
    <div className="video-background">
      <video
        ref={videoRef}
        src={src}
        autoPlay={false}
        loop
        muted
      />

      <button
        onClick={() => {
          if (playing) {
            videoRef.current?.pause();
          } else {
            videoRef.current?.play();
          }
          setPlaying(!playing);
        }}
        aria-label={playing ? 'Pause video' : 'Play video'}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
```

## Content Accessibility

### Clear Language

```jsx
// Bad: Jargon without explanation
<p>Configure your char build with optimal DPS stats for endgame content.</p>

// Good: Clear, explained terms
<p>
  Configure your character build with optimal damage per second (DPS) statistics
  for high-level game content.
</p>

// Good: Tooltips for technical terms
<p>
  Configure your character build with optimal{' '}
  <Tooltip content="Damage Per Second - amount of damage dealt over time">
    <abbr title="Damage Per Second">DPS</abbr>
  </Tooltip>{' '}
  stats.
</p>
```

### Readable Fonts

```css
/* Readable typography */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  font-size: 16px; /* Minimum 14px, 16px recommended */
  line-height: 1.5; /* 1.5x for body text */
  font-weight: 400;
}

h1, h2, h3, h4, h5, h6 {
  line-height: 1.2; /* Tighter for headings */
  font-weight: 600;
}

p {
  margin-bottom: 1em;
  max-width: 70ch; /* Optimal line length */
}

/* Readable code/data */
code, pre {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  line-height: 1.4;
}
```

### Alt Text for Images/Icons

```jsx
// Informative image
<img
  src="character-portrait.jpg"
  alt="Warrior character wearing plate armor and holding a two-handed sword"
/>

// Decorative image
<img src="border-decoration.svg" alt="" aria-hidden="true" />

// Icon with meaning
<button>
  <Icon name="save" aria-hidden="true" />
  <span>Save Game</span>
</button>

// Icon alone (needs label)
<button aria-label="Save game">
  <Icon name="save" aria-hidden="true" />
</button>

// Complex infographic
<figure>
  <img src="skill-tree.png" alt="" aria-describedby="skill-tree-desc" />
  <figcaption id="skill-tree-desc">
    Skill tree showing three branches: Combat (red), Magic (blue), and
    Stealth (green). Each branch has 5 tiers of skills that unlock
    sequentially.
  </figcaption>
</figure>
```

## Form Accessibility

### Labels for All Inputs

```jsx
// Explicit label (preferred)
<div className="form-field">
  <label htmlFor="username">Username:</label>
  <input id="username" type="text" />
</div>

// Wrapped label
<label className="form-field">
  Username:
  <input type="text" />
</label>

// ARIA label (when visual label not possible)
<input
  type="search"
  aria-label="Search characters"
  placeholder="Search..."
/>

// Fieldset for groups
<fieldset>
  <legend>Character Class</legend>
  <label>
    <input type="radio" name="class" value="warrior" />
    Warrior
  </label>
  <label>
    <input type="radio" name="class" value="mage" />
    Mage
  </label>
</fieldset>
```

### Error Messages

```jsx
function AccessibleInput({ label, error, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`form-field ${error ? 'error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {props.required && <span aria-label="required">*</span>}
      </label>

      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />

      {error && (
        <span id={errorId} className="error-message" role="alert">
          <Icon name="error" aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  );
}

// Usage
<AccessibleInput
  label="Email"
  type="email"
  required
  error="Please enter a valid email address"
/>
```

### Validation Feedback

```jsx
function FormWithValidation() {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (name, value) => {
    // Validation logic
    if (name === 'email' && !value.includes('@')) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Announce error
    if (error) {
      announce(error, 'assertive');
    }
  };

  return (
    <form aria-label="Character creation form">
      <AccessibleInput
        name="email"
        label="Email"
        type="email"
        onBlur={handleBlur}
        error={touched.email ? errors.email : null}
      />

      {/* Form-level errors */}
      {Object.keys(errors).length > 0 && (
        <div role="alert" aria-live="assertive" className="form-errors">
          <h3>Please fix the following errors:</h3>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <a href={`#${field}`}>{error}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
```

## ARIA Patterns

**【參考：04-components/*.md】** for component-specific ARIA implementations.

### Modal Dialogs

```jsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);

  useFocusTrap(modalRef, isOpen);
  useEscapeClose(onClose, isOpen);

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="modal-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal"
          >
            <h2 id="modal-title">{title}</h2>

            <div className="modal-content">
              {children}
            </div>

            <button onClick={onClose} aria-label="Close dialog">
              <Icon name="close" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
```

### Tabs

```jsx
function AccessibleTabs({ tabs, defaultTab = 0 }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setActiveTab((index + 1) % tabs.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setActiveTab((index - 1 + tabs.length) % tabs.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveTab(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveTab(tabs.length - 1);
        break;
    }
  };

  return (
    <div className="tabs">
      {/* Tab list */}
      <div role="tablist" aria-label="Character information">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === index}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === index ? 0 : -1}
            onClick={() => setActiveTab(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== index}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Accordions

```jsx
function AccessibleAccordion({ items }) {
  const [expanded, setExpanded] = useState(new Set());

  const toggle = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="accordion">
      {items.map(item => {
        const isExpanded = expanded.has(item.id);

        return (
          <div key={item.id} className="accordion-item">
            <h3>
              <button
                id={`accordion-button-${item.id}`}
                aria-expanded={isExpanded}
                aria-controls={`accordion-panel-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                {item.title}
                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  aria-hidden="true"
                />
              </button>
            </h3>

            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-button-${item.id}`}
              hidden={!isExpanded}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Menus

```jsx
function AccessibleMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const menuRef = useRef(null);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => (i + 1) % items.length);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => (i - 1 + items.length) % items.length);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        items[focusedIndex].action();
        setIsOpen(false);
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="menu-container">
      <button
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              role="menuitem"
              tabIndex={index === focusedIndex ? 0 : -1}
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
            >
              {item.icon && <Icon name={item.icon} aria-hidden="true" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Progress Bars

```jsx
function AccessibleProgressBar({ value, max = 100, label }) {
  const percentage = (value / max) * 100;

  return (
    <div className="progress-container">
      {label && <label id="progress-label">{label}</label>}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? "progress-label" : undefined}
        aria-label={!label ? `${percentage}% complete` : undefined}
        className="progress-bar"
      >
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {percentage}% complete
      </span>
    </div>
  );
}
```

## Testing Tools

### Screen Readers

**NVDA (Windows, Free):**
```
Installation: https://www.nvaccess.org/
Usage:
- Ctrl: Stop reading
- Insert+Down: Read all
- Tab: Next focusable
- Insert+Space: Toggle focus/browse mode
```

**JAWS (Windows, Commercial):**
```
Installation: https://www.freedomscientific.com/products/software/jaws/
Usage similar to NVDA
Trial version available
```

**VoiceOver (Mac/iOS, Built-in):**
```
Mac: Cmd+F5 to toggle
iOS: Settings > Accessibility > VoiceOver

Gestures:
- Two-finger swipe down: Read all
- Swipe right/left: Next/previous item
- Double-tap: Activate
```

**TalkBack (Android, Built-in):**
```
Settings > Accessibility > TalkBack

Gestures:
- Swipe right/left: Next/previous item
- Double-tap: Activate
- Two-finger swipe: Scroll
```

### Keyboard-Only Testing

```javascript
// Disable mouse for testing
function disableMouseForTesting() {
  document.body.style.cursor = 'none';
  document.body.style.pointerEvents = 'none';

  document.addEventListener('mousedown', (e) => {
    e.preventDefault();
    console.warn('Mouse disabled for keyboard testing');
  });
}

// Checklist:
// - [ ] Tab through all interactive elements
// - [ ] All actions available via keyboard
// - [ ] Focus visible at all times
// - [ ] No keyboard traps
// - [ ] Logical tab order
```

### Color Contrast Checkers

**Browser Extensions:**
- WAVE (Web Accessibility Evaluation Tool)
- axe DevTools
- Lighthouse (Chrome DevTools)

**Online Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Coolors Contrast Checker: https://coolors.co/contrast-checker

**Code:**
```javascript
// Check contrast programmatically
import { getContrast } from 'polished';

const bg = '#FFFFFF';
const fg = '#4A90E2';
const ratio = getContrast(bg, fg);

if (ratio < 4.5) {
  console.warn(`Insufficient contrast: ${ratio.toFixed(2)}:1`);
}
```

### Automated Testing

```javascript
// Jest + jest-axe
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<CharacterScreen />);
  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

// Cypress + cypress-axe
describe('Accessibility', () => {
  it('should pass axe checks', () => {
    cy.visit('/characters');
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

## Accessibility Checklist

### Pre-Launch Checklist

**Perceivable:**
- [ ] All images have appropriate alt text
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Content doesn't rely on color alone
- [ ] Text can be resized to 200%
- [ ] Audio/video has captions or transcripts

**Operable:**
- [ ] All features keyboard accessible
- [ ] No keyboard traps
- [ ] Skip to content link present
- [ ] Focus indicators visible
- [ ] No time limits (or can be extended)
- [ ] No flashing content > 3 times per second

**Understandable:**
- [ ] Language of page identified (lang attribute)
- [ ] Forms have clear labels
- [ ] Error messages are clear and specific
- [ ] Navigation is consistent
- [ ] Help is available

**Robust:**
- [ ] Valid HTML
- [ ] ARIA used correctly
- [ ] Compatible with assistive technologies
- [ ] Works across browsers and devices

### Component Checklist

**Buttons:**
- [ ] Accessible name (text or aria-label)
- [ ] Keyboard accessible (Enter/Space)
- [ ] Focus indicator visible
- [ ] Disabled state announced

**Forms:**
- [ ] All inputs have labels
- [ ] Required fields marked
- [ ] Validation messages clear and announced
- [ ] Error prevention and recovery

**Modals:**
- [ ] Focus moves to modal
- [ ] Focus trapped in modal
- [ ] Escape closes modal
- [ ] Focus returns on close

**Navigation:**
- [ ] Logical heading structure (h1-h6)
- [ ] Landmarks (header, nav, main, footer)
- [ ] Current page indicated
- [ ] Breadcrumbs (if applicable)

## Related Documentation

- **【參考：05-interactions/keyboard-navigation.md】** - Keyboard interaction patterns
- **【參考：05-interactions/mouse-interactions.md】** - Mouse accessibility
- **【參考：05-interactions/touch-gestures.md】** - Touch accessibility
- **【參考：04-components/*.md】** - Component-specific accessibility

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** Complete
