# 觸控手勢 (Touch Gestures)

## Overview

Touch-first design ensures the application is optimized for mobile and tablet devices. This document defines standard touch gestures, touch target sizing, feedback mechanisms, and implementation guidelines for creating an intuitive touch-based user experience.

**Design Principles:**
- Design for touch-first, with minimum 44x44px touch targets
- Provide immediate visual and haptic feedback for all interactions
- Support standard platform gestures (iOS and Android)
- Offer gesture alternatives (buttons) for accessibility
- Prevent accidental touches with appropriate spacing and confirmation
- Consider one-handed operation for mobile devices

## Basic Gestures

### Tap (Equivalent to Click)

**Single Tap:**
- **Purpose:** Primary action, select item, focus element
- **Duration:** Quick touch and release (< 200ms)
- **Visual Feedback:** Ripple effect, highlight, button press state
- **Haptic Feedback:** Optional light tap

**Use Cases:**
```
Button Tap           → Execute action
Link Tap             → Navigate
Card Tap             → Select / Open details
Checkbox Tap         → Toggle state
List Item Tap        → Select item
Icon Tap             → Trigger action
```

**Implementation:**
```jsx
function TouchButton({ onPress, children }) {
  const [pressed, setPressed] = useState(false);

  const handleTouchStart = (e) => {
    setPressed(true);

    // Haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(10); // 10ms light tap
    }
  };

  const handleTouchEnd = (e) => {
    setPressed(false);
    onPress(e);
  };

  return (
    <button
      className={`touch-button ${pressed ? 'pressed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => setPressed(false)}
    >
      {children}

      {/* Ripple effect */}
      {pressed && <span className="ripple" />}
    </button>
  );
}
```

**Ripple Effect CSS:**
```css
.touch-button {
  position: relative;
  overflow: hidden;
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #4A90E2;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.touch-button.pressed {
  background: #357ABD;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

### Double-Tap (Zoom or Special Action)

**Double Tap:**
- **Purpose:** Zoom in/out, special action (open, edit)
- **Timing:** Two taps within 300ms
- **Threshold:** Same location (within 20px)
- **Visual Feedback:** Scale animation, state change

**Use Cases:**
```
Image Double-Tap     → Zoom to fit / Reset zoom
Map Double-Tap       → Zoom in to location
Text Double-Tap      → Select word
List Item Double-Tap → Open details / Edit
Card Double-Tap      → Quick action
```

**Implementation:**
```jsx
function useDoubleTap(onSingleTap, onDoubleTap, delay = 300) {
  const [lastTap, setLastTap] = useState(0);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  const handleTap = (e) => {
    const now = Date.now();
    const touch = e.touches[0] || e.changedTouches[0];
    const position = { x: touch.clientX, y: touch.clientY };

    // Check if within time window and same location
    const timeDiff = now - lastTap;
    const distance = Math.sqrt(
      Math.pow(position.x - lastPosition.x, 2) +
      Math.pow(position.y - lastPosition.y, 2)
    );

    if (timeDiff < delay && distance < 20) {
      // Double tap
      onDoubleTap?.(e);
      setLastTap(0); // Reset
    } else {
      // Single tap (wait to see if double tap follows)
      setLastTap(now);
      setLastPosition(position);

      setTimeout(() => {
        if (Date.now() - now >= delay) {
          onSingleTap?.(e);
        }
      }, delay);
    }
  };

  return handleTap;
}

// Usage
function ZoomableImage({ src }) {
  const [scale, setScale] = useState(1);

  const handleDoubleTap = useDoubleTap(
    () => console.log('Single tap'),
    () => {
      // Toggle zoom
      setScale(scale === 1 ? 2 : 1);
    }
  );

  return (
    <img
      src={src}
      onTouchEnd={handleDoubleTap}
      style={{ transform: `scale(${scale})` }}
    />
  );
}
```

### Long-Press (Context Menu)

**Long Press:**
- **Purpose:** Show context menu, enter selection mode, show additional options
- **Duration:** 500ms (configurable: 400-600ms)
- **Visual Feedback:** Growing circle, vibration
- **Haptic Feedback:** Medium impact at trigger

**Use Cases:**
- **【參考：02-screens/management/inventory-screen.md】**

```
Item Long-Press      → Context menu (Use, Drop, Info)
Text Long-Press      → Select text, show clipboard actions
Icon Long-Press      → Show tooltip, additional info
Card Long-Press      → Selection mode, multi-select
Empty Space Long-Press → General actions
```

**Implementation:**
```jsx
function useLongPress(callback, options = {}) {
  const {
    threshold = 500,
    onStart,
    onCancel
  } = options;

  const timeoutRef = useRef(null);
  const [pressing, setPressing] = useState(false);

  const start = (e) => {
    setPressing(true);
    onStart?.(e);

    timeoutRef.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50); // Medium impact
      }

      callback(e);
      setPressing(false);
    }, threshold);
  };

  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setPressing(false);
      onCancel?.();
    }
  };

  return {
    pressing,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onTouchCancel: cancel
  };
}

// Usage with visual feedback
function LongPressItem({ item, onLongPress }) {
  const longPress = useLongPress(
    () => onLongPress(item),
    { threshold: 500 }
  );

  return (
    <div className="long-press-item" {...longPress}>
      {item.name}

      {/* Visual feedback during long press */}
      {longPress.pressing && (
        <div className="long-press-indicator">
          <div className="progress-circle" />
        </div>
      )}
    </div>
  );
}
```

**Long-Press Visual Feedback:**
```css
.long-press-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.progress-circle {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(74, 144, 226, 0.3);
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: long-press-grow 0.5s linear;
}

@keyframes long-press-grow {
  from {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}
```

### Swipe (Navigation, Dismiss)

**Swipe:**
- **Purpose:** Navigate between screens, dismiss items, reveal actions
- **Direction:** Left, Right, Up, Down
- **Threshold:** Minimum 50px movement, velocity > 0.3px/ms
- **Visual Feedback:** Content follows finger, springs back or completes

**Use Cases:**
```
Swipe Left/Right     → Navigate between tabs/screens
Swipe Right          → Go back (navigation)
Swipe Left on Item   → Reveal delete action
Swipe Down           → Dismiss modal, refresh content
Swipe Up             → Show more options
```

**Implementation:**
```jsx
function useSwipe(options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3
  } = options;

  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const [swiping, setSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setSwiping(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStart.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    setSwipeDistance({ x: deltaX, y: deltaY });

    // Determine if swiping
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      setSwiping(true);
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;

    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // Determine swipe direction
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
      if (Math.abs(deltaX) > threshold || velocityX > velocityThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.(deltaX, velocityX);
        } else {
          onSwipeLeft?.(Math.abs(deltaX), velocityX);
        }
      }
    } else {
      if (Math.abs(deltaY) > threshold || velocityY > velocityThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.(deltaY, velocityY);
        } else {
          onSwipeUp?.(Math.abs(deltaY), velocityY);
        }
      }
    }

    // Reset
    setSwiping(false);
    setSwipeDistance({ x: 0, y: 0 });
    touchStart.current = null;
  };

  return {
    swiping,
    swipeDistance,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };
}

// Usage: Swipeable card
function SwipeableCard({ item, onDelete }) {
  const swipe = useSwipe({
    onSwipeLeft: (distance) => {
      if (distance > 100) {
        onDelete(item);
      }
    }
  });

  return (
    <div
      className="swipeable-card"
      {...swipe}
      style={{
        transform: `translateX(${swipe.swipeDistance.x}px)`,
        transition: swipe.swiping ? 'none' : 'transform 0.3s'
      }}
    >
      <div className="card-content">{item.name}</div>

      {/* Delete action revealed on swipe left */}
      <div className="delete-action">
        <Icon name="trash" />
      </div>
    </div>
  );
}
```

### Pinch-to-Zoom

**Pinch:**
- **Purpose:** Zoom in/out on images, maps, content
- **Gesture:** Two-finger pinch (spread to zoom in, pinch to zoom out)
- **Scale:** Typically 0.5x to 3x
- **Visual Feedback:** Content scales smoothly following fingers

**Use Cases:**
```
Image Pinch          → Zoom in/out
Map Pinch            → Zoom to area
Diagram Pinch        → Zoom for details
```

**Implementation:**
```jsx
function usePinchZoom(options = {}) {
  const {
    minScale = 0.5,
    maxScale = 3,
    initialScale = 1
  } = options;

  const [scale, setScale] = useState(initialScale);
  const initialDistance = useRef(0);
  const lastScale = useRef(initialScale);

  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      lastScale.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default pinch zoom

      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const ratio = currentDistance / initialDistance.current;
      const newScale = Math.max(minScale, Math.min(maxScale, lastScale.current * ratio));

      setScale(newScale);
    }
  };

  const reset = () => {
    setScale(initialScale);
  };

  return {
    scale,
    reset,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove
  };
}

// Usage
function ZoomableMap({ children }) {
  const pinch = usePinchZoom({ minScale: 0.5, maxScale: 3 });

  return (
    <div
      className="zoomable-container"
      {...pinch}
    >
      <div
        className="zoomable-content"
        style={{
          transform: `scale(${pinch.scale})`,
          transformOrigin: 'center'
        }}
      >
        {children}
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button onClick={pinch.reset}>Reset Zoom</button>
        <span>{Math.round(pinch.scale * 100)}%</span>
      </div>
    </div>
  );
}
```

### Two-Finger Scroll

**Two-Finger Scroll:**
- **Purpose:** Scroll within scrollable containers (alternative to single-finger)
- **Platform:** Standard on iOS, optional on Android
- **Use:** Distinguishes between page scroll and container scroll

**Implementation:**
```css
/* Enable momentum scrolling on iOS */
.scrollable-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

## Gesture Mapping

### iOS vs Android Differences

| Gesture | iOS | Android | Implementation Note |
|---------|-----|---------|---------------------|
| Tap | Standard | Standard | Same |
| Long-press | 500ms | 500ms | Same |
| Swipe back | System (edge) | System/App | Implement app-level |
| Pull-to-refresh | Standard | Standard | Same |
| Pinch-zoom | Standard | Standard | Same |
| Force Touch | 3D Touch (older) | Long-press | Fallback to long-press |
| Haptics | Taptic Engine | Vibration API | Different APIs |

### Gesture Priority

When multiple gestures are possible, priority order:

1. **Long-press** (highest) - Checked first (500ms timer)
2. **Double-tap** - Checked if tap within 300ms of previous
3. **Swipe** - Checked if movement > threshold
4. **Tap** - Default if none of the above
5. **Pinch** - Two-finger gestures (separate channel)

## Touch Targets

### Minimum Size Requirements

**Platform Guidelines:**
- **iOS:** Minimum 44x44 pt (points, ~44x44px at 1x)
- **Android:** Minimum 48x48 dp (density-independent pixels, ~48x48px)
- **Recommended:** 48x48px minimum for both platforms

**Visual Examples:**
```
Too Small (❌ 32x32px)        Acceptable (✓ 44x44px)       Comfortable (✓✓ 48x48px)
┌──────┐                     ┌────────┐                  ┌─────────┐
│ Icon │                     │  Icon  │                  │  Icon   │
└──────┘                     └────────┘                  └─────────┘
```

**Implementation:**
```css
/* Ensure minimum touch target size */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Small icon with expanded touch target */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 12px; /* Creates 48x48px touch area */
}

/* Text link with expanded touch target */
.touch-link {
  display: inline-block;
  padding: 12px 8px;
  margin: -12px -8px; /* Negative margin to maintain visual spacing */
}
```

### Spacing Between Targets

**Minimum Spacing:**
- **Between touch targets:** 8px minimum
- **Recommended:** 16px for comfortable tapping
- **Dense layouts:** 8px with clear visual separation

```
Cramped (❌ 4px spacing)      Acceptable (✓ 8px)          Comfortable (✓✓ 16px)

[Btn1][Btn2][Btn3]           [Btn1] [Btn2] [Btn3]       [Btn1]  [Btn2]  [Btn3]
```

**Implementation:**
```css
/* Button group with spacing */
.button-group {
  display: flex;
  gap: 16px; /* Comfortable spacing */
}

.button-group.dense {
  gap: 8px; /* Minimum spacing */
}

/* Grid of touch targets */
.touch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 16px;
}
```

## Touch Feedback

### Visual Feedback

**Ripple Effect:**
```jsx
function RippleButton({ children, onClick }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = {
      id: Date.now(),
      x,
      y,
      size: Math.max(rect.width, rect.height)
    };

    setRipples(prev => [...prev, ripple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button className="ripple-button" onClick={handleClick}>
      {children}
      <span className="ripples">
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size
            }}
          />
        ))}
      </span>
    </button>
  );
}
```

**Highlight States:**
```css
/* Touch highlight (appears while touching) */
.touch-item {
  transition: background 0.2s;
}

.touch-item:active {
  background: rgba(0, 0, 0, 0.05);
}

/* Disable default webkit tap highlight */
.touch-item {
  -webkit-tap-highlight-color: transparent;
}

/* Custom tap highlight */
.touch-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity 0.2s;
}

.touch-item:active::after {
  opacity: 1;
}
```

### Haptic Feedback

**Vibration API:**
```javascript
// Vibration patterns
const HapticPattern = {
  LIGHT: 10,           // Light tap
  MEDIUM: 50,          // Medium impact
  HEAVY: 100,          // Heavy impact
  SUCCESS: [50, 50, 50], // Success pattern
  ERROR: [100, 50, 100], // Error pattern
  SELECTION: 20        // Selection change
};

// Haptic feedback utility
function haptic(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// Usage examples
haptic(HapticPattern.LIGHT);     // Button tap
haptic(HapticPattern.MEDIUM);    // Long-press trigger
haptic(HapticPattern.SUCCESS);   // Action completed
haptic(HapticPattern.ERROR);     // Error occurred
haptic(HapticPattern.SELECTION); // Picker scrolled
```

**React Hook for Haptics:**
```jsx
function useHaptic(pattern = HapticPattern.LIGHT) {
  const trigger = useCallback(() => {
    haptic(pattern);
  }, [pattern]);

  return trigger;
}

// Usage
function HapticButton({ children, onClick }) {
  const triggerHaptic = useHaptic(HapticPattern.LIGHT);

  const handleClick = (e) => {
    triggerHaptic();
    onClick?.(e);
  };

  return <button onClick={handleClick}>{children}</button>;
}
```

### Audio Feedback

**Sound Effects:**
```javascript
// Audio feedback utility
class AudioFeedback {
  constructor() {
    this.sounds = {
      tap: new Audio('/sounds/tap.mp3'),
      success: new Audio('/sounds/success.mp3'),
      error: new Audio('/sounds/error.mp3'),
      swipe: new Audio('/sounds/swipe.mp3')
    };

    // Preload sounds
    Object.values(this.sounds).forEach(sound => {
      sound.load();
    });
  }

  play(soundName, volume = 1) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Handle autoplay restrictions
      });
    }
  }
}

const audioFeedback = new AudioFeedback();

// Usage
function handleButtonTap() {
  audioFeedback.play('tap', 0.5);
  // ... button action
}
```

## Swipe Gestures

### Swipe-to-Delete

**【參考：02-screens/management/inventory-screen.md】**

```jsx
function SwipeToDelete({ item, onDelete, children }) {
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const swipe = useSwipe({
    onSwipeLeft: (distance) => {
      if (distance > 100) {
        setDeleting(true);
        onDelete(item);
      }
    }
  });

  return (
    <div className="swipe-container">
      <div
        className={`swipe-content ${deleting ? 'deleting' : ''}`}
        {...swipe}
        style={{
          transform: `translateX(${swipe.swiping ? swipe.swipeDistance.x : 0}px)`,
          transition: swipe.swiping ? 'none' : 'transform 0.3s'
        }}
      >
        {children}
      </div>

      {/* Delete background */}
      <div className="delete-background">
        <Icon name="trash" />
        <span>Delete</span>
      </div>
    </div>
  );
}
```

### Pull-to-Refresh

```jsx
function usePullToRefresh(onRefresh, threshold = 80) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const touchStart = useRef({ y: 0, scrollTop: 0 });

  const handleTouchStart = (e) => {
    const container = e.currentTarget;
    touchStart.current = {
      y: e.touches[0].clientY,
      scrollTop: container.scrollTop
    };
  };

  const handleTouchMove = (e) => {
    const container = e.currentTarget;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStart.current.y;

    // Only pull when at top of scroll
    if (touchStart.current.scrollTop === 0 && deltaY > 0) {
      setPulling(true);
      setPullDistance(Math.min(deltaY * 0.5, threshold)); // Damping effect

      if (deltaY > threshold) {
        e.preventDefault(); // Prevent scroll
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }

    setPulling(false);
    setPullDistance(0);
  };

  return {
    pulling,
    pullDistance,
    refreshing,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

// Usage
function RefreshableList({ items, onRefresh }) {
  const pullToRefresh = usePullToRefresh(onRefresh);

  return (
    <div className="refreshable-container" {...pullToRefresh}>
      {/* Pull-to-refresh indicator */}
      {(pullToRefresh.pulling || pullToRefresh.refreshing) && (
        <div className="refresh-indicator" style={{ height: pullToRefresh.pullDistance }}>
          {pullToRefresh.refreshing ? (
            <Spinner />
          ) : (
            <Icon name="arrow-down" style={{ transform: `rotate(${pullToRefresh.pullDistance / 80 * 180}deg)` }} />
          )}
        </div>
      )}

      {/* List content */}
      <div className="list-content">
        {items.map(item => <Item key={item.id} item={item} />)}
      </div>
    </div>
  );
}
```

### Swipe Navigation

```jsx
function SwipeNavigation({ screens, currentIndex, onNavigate }) {
  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (currentIndex < screens.length - 1) {
        onNavigate(currentIndex + 1);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
    },
    threshold: 50
  });

  return (
    <div className="swipe-navigation" {...swipe}>
      {screens.map((screen, index) => (
        <div
          key={index}
          className={`screen ${index === currentIndex ? 'active' : ''}`}
          style={{
            transform: `translateX(${(index - currentIndex) * 100 + swipe.swipeDistance.x}px)`
          }}
        >
          {screen}
        </div>
      ))}
    </div>
  );
}
```

## Touch Accessibility

### Large Touch Targets

Ensure all interactive elements meet minimum size requirements:

```jsx
// Touch target wrapper
function TouchTarget({ children, minSize = 44 }) {
  return (
    <div
      className="touch-target"
      style={{
        minWidth: minSize,
        minHeight: minSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {children}
    </div>
  );
}

// Usage
<TouchTarget>
  <Icon name="settings" size={24} />
</TouchTarget>
```

### Gesture Alternatives

Provide button alternatives for all gestures:

```jsx
function AccessibleSwipeItem({ item, onDelete, onEdit }) {
  const [showActions, setShowActions] = useState(false);

  // Swipe gesture for touch users
  const swipe = useSwipe({
    onSwipeLeft: () => setShowActions(true)
  });

  return (
    <div className="swipe-item">
      <div {...swipe}>
        {item.name}
      </div>

      {/* Button alternative for accessibility */}
      <button
        className="actions-toggle"
        onClick={() => setShowActions(!showActions)}
        aria-label="Show actions"
      >
        <Icon name="more" />
      </button>

      {showActions && (
        <div className="actions-menu">
          <button onClick={() => onEdit(item)}>Edit</button>
          <button onClick={() => onDelete(item)}>Delete</button>
        </div>
      )}
    </div>
  );
}
```

### Screen Reader Gestures

**VoiceOver (iOS):**
- Swipe right: Next item
- Swipe left: Previous item
- Double-tap: Activate
- Two-finger swipe down: Read from top
- Three-finger swipe: Scroll

**TalkBack (Android):**
- Swipe right: Next item
- Swipe left: Previous item
- Double-tap: Activate
- Two-finger swipe: Scroll

**Implementation:**
```jsx
// Ensure proper ARIA labels for screen readers
function AccessibleTouchElement({ label, onActivate }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onActivate}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onActivate();
        }
      }}
    >
      {/* Visual content */}
    </div>
  );
}
```

**【參考：05-interactions/accessibility.md】** for comprehensive accessibility guidelines.

## Edge Cases

### Accidental Touches

**Prevention Strategies:**

1. **Confirmation for destructive actions:**
```jsx
function ConfirmableDelete({ item, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000); // Reset after 3s
    } else {
      onDelete(item);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className={confirming ? 'confirming' : ''}
    >
      {confirming ? 'Tap again to confirm' : 'Delete'}
    </button>
  );
}
```

2. **Undo option:**
```jsx
function UndoableAction({ action, onExecute, onUndo }) {
  const [executed, setExecuted] = useState(false);
  const [showUndo, setShowUndo] = useState(false);

  const handleExecute = () => {
    setExecuted(true);
    setShowUndo(true);

    // Auto-hide undo after 5 seconds
    setTimeout(() => {
      if (executed) {
        onExecute();
        setShowUndo(false);
      }
    }, 5000);
  };

  const handleUndo = () => {
    setExecuted(false);
    setShowUndo(false);
    onUndo();
  };

  return (
    <>
      <button onClick={handleExecute}>{action}</button>

      {showUndo && (
        <Snackbar message="Action executed" action={
          <button onClick={handleUndo}>Undo</button>
        } />
      )}
    </>
  );
}
```

### Gesture Conflicts

**Prevent conflicts between gestures:**

```jsx
function handleTouchStart(e) {
  // Disable page scroll during custom gesture
  if (isCustomGesture(e)) {
    e.preventDefault();
  }
}

// Allow both tap and long-press
function useTapAndLongPress(onTap, onLongPress) {
  const longPress = useLongPress(onLongPress);
  const [tapped, setTapped] = useState(false);

  const handleTouchEnd = (e) => {
    // Only call onTap if long-press didn't trigger
    if (!longPress.pressing && tapped) {
      onTap(e);
    }
    setTapped(false);
  };

  return {
    onTouchStart: (e) => {
      setTapped(true);
      longPress.onTouchStart(e);
    },
    onTouchEnd: handleTouchEnd,
    onTouchMove: longPress.onTouchMove,
    onTouchCancel: longPress.onTouchCancel
  };
}
```

### Touch During Animations

**Disable touch during animations:**

```jsx
function AnimatedElement({ children }) {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    if (animating) {
      e.preventDefault();
      return;
    }

    setAnimating(true);
    // ... animation logic

    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div
      onClick={handleClick}
      style={{ pointerEvents: animating ? 'none' : 'auto' }}
    >
      {children}
    </div>
  );
}
```

## Implementation Examples

### Complete Touch-Enabled Button

```jsx
function TouchButton({ children, onPress, variant = 'primary', disabled = false }) {
  const [pressed, setPressed] = useState(false);
  const haptic = useHaptic(HapticPattern.LIGHT);

  const handleTouchStart = () => {
    if (!disabled) {
      setPressed(true);
      haptic();
    }
  };

  const handleTouchEnd = () => {
    if (!disabled && pressed) {
      onPress();
    }
    setPressed(false);
  };

  return (
    <button
      className={`touch-button ${variant} ${pressed ? 'pressed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => setPressed(false)}
      disabled={disabled}
      style={{
        minWidth: '44px',
        minHeight: '44px',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease'
      }}
    >
      {children}
    </button>
  );
}
```

### Complete Touch List

```jsx
function TouchList({ items, onItemSelect, onItemDelete }) {
  return (
    <div className="touch-list">
      {items.map(item => (
        <SwipeToDelete
          key={item.id}
          item={item}
          onDelete={onItemDelete}
        >
          <TouchListItem
            item={item}
            onTap={() => onItemSelect(item)}
          />
        </SwipeToDelete>
      ))}
    </div>
  );
}

function TouchListItem({ item, onTap }) {
  const longPress = useLongPress(() => {
    // Show context menu
  });

  return (
    <div
      className="touch-list-item"
      onClick={onTap}
      {...longPress}
      style={{ minHeight: '48px', padding: '12px 16px' }}
    >
      {item.name}
    </div>
  );
}
```

## Testing on Devices

### Device Testing Checklist

**iOS Testing:**
- [ ] Test on iPhone (various sizes)
- [ ] Test on iPad
- [ ] Test with VoiceOver enabled
- [ ] Test in landscape and portrait
- [ ] Test with Dynamic Type (text sizing)
- [ ] Test with Reachability (one-handed mode)

**Android Testing:**
- [ ] Test on phones (various sizes)
- [ ] Test on tablets
- [ ] Test with TalkBack enabled
- [ ] Test in landscape and portrait
- [ ] Test with large text size
- [ ] Test with gesture navigation (Android 10+)

**General Testing:**
- [ ] All touch targets at least 44x44px
- [ ] 8px minimum spacing between targets
- [ ] Tap feedback visible and immediate
- [ ] Long-press works consistently (500ms)
- [ ] Swipe gestures feel natural
- [ ] No accidental activations
- [ ] Haptic feedback appropriate (not excessive)
- [ ] Works with screen reader gestures

### Browser DevTools Testing

```javascript
// Simulate touch events in desktop browsers
function simulateTouch(element, eventType, x, y) {
  const touch = new Touch({
    identifier: Date.now(),
    target: element,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    pageX: x,
    pageY: y,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force: 0.5
  });

  const touchEvent = new TouchEvent(eventType, {
    cancelable: true,
    bubbles: true,
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch]
  });

  element.dispatchEvent(touchEvent);
}

// Usage
const button = document.querySelector('.touch-button');
simulateTouch(button, 'touchstart', 100, 100);
simulateTouch(button, 'touchend', 100, 100);
```

## Related Documentation

- **【參考：04-components/buttons.md】** - Touch-enabled button components
- **【參考：04-components/forms.md】** - Touch input interactions
- **【參考：04-components/cards.md】** - Touch card interactions
- **【參考：05-interactions/mouse-interactions.md】** - Desktop interaction equivalents
- **【參考：05-interactions/keyboard-navigation.md】** - Keyboard alternatives
- **【參考：05-interactions/accessibility.md】** - Touch accessibility requirements

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** Complete
