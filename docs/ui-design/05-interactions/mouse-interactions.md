# 滑鼠互動 (Mouse Interactions)

## Overview

Mouse interaction patterns provide intuitive and efficient ways for users to interact with the application. This document defines standard mouse behaviors, cursor states, interactive element patterns, and implementation guidelines.

**Design Principles:**
- Provide immediate visual feedback for all mouse interactions
- Support standard mouse conventions (click, double-click, right-click, hover)
- Use appropriate cursors to indicate interactive affordances
- Implement drag-and-drop for intuitive item manipulation
- Ensure smooth transitions and animations
- Consider touch device equivalents for all mouse interactions

## Basic Interactions

### Click (Primary Action)

**Single Left-Click:**
- **Purpose:** Trigger primary action, select item, focus element
- **Response Time:** Immediate (< 100ms)
- **Visual Feedback:** Button press state, selection highlight

**Use Cases:**
```
Button Click          → Execute action
Link Click           → Navigate to page
Card Click           → Open details / Select item
Checkbox Click       → Toggle state
Radio Button Click   → Select option
Menu Item Click      → Execute command
List Item Click      → Select / Focus item
```

**Implementation:**
```jsx
// Button click
<button
  onClick={handleAction}
  onMouseDown={() => setPressed(true)}
  onMouseUp={() => setPressed(false)}
  onMouseLeave={() => setPressed(false)}
>
  Click Me
</button>

// Clickable card
<div
  className="card"
  onClick={handleCardClick}
  role="button"
  tabIndex={0}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleCardClick();
    }
  }}
>
  {content}
</div>
```

### Double-Click (Special Actions)

**Double Left-Click:**
- **Purpose:** Special action, often "open" or "edit"
- **Timing:** Two clicks within 500ms
- **Visual Feedback:** Stronger emphasis than single click

**Use Cases:**
```
List Item Double-Click    → Open item details
Card Double-Click         → Enter edit mode
Text Double-Click         → Select word
File Icon Double-Click    → Open file
Skill Double-Click        → Quick assign to slot
```

**Implementation:**
```jsx
function useDoubleClick(onClick, onDoubleClick, delay = 300) {
  const [clickCount, setClickCount] = useState(0);
  const timerRef = useRef(null);

  const handleClick = (e) => {
    setClickCount(prev => prev + 1);

    if (clickCount === 0) {
      timerRef.current = setTimeout(() => {
        onClick?.(e);
        setClickCount(0);
      }, delay);
    } else {
      clearTimeout(timerRef.current);
      onDoubleClick?.(e);
      setClickCount(0);
    }
  };

  return handleClick;
}

// Usage
function SkillCard({ skill }) {
  const handleClick = useDoubleClick(
    () => console.log('Single click: preview'),
    () => console.log('Double click: assign')
  );

  return <div onClick={handleClick}>{skill.name}</div>;
}
```

### Right-Click (Context Menus)

**Right-Click:**
- **Purpose:** Show context menu with relevant actions
- **Position:** Near cursor, adjusted to stay on screen
- **Dismiss:** Click outside, Escape key, action selected

**Use Cases:**
- **【參考：02-screens/management/inventory-screen.md】**

```
Item Right-Click          → Item actions (Use, Drop, Info)
Character Right-Click     → Character actions (Edit, Remove)
Empty Space Right-Click   → General actions (New, Paste)
Text Right-Click          → Text actions (Copy, Cut, Paste)
```

**Implementation:**
```jsx
function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  // Position adjustment to stay on screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const adjustedX = Math.min(x, window.innerWidth - rect.width);
      const adjustedY = Math.min(y, window.innerHeight - rect.height);

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  // Close on click outside
  useClickOutside(menuRef, onClose);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
    >
      {items.map(item => (
        <button
          key={item.id}
          role="menuitem"
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          {item.icon && <Icon name={item.icon} />}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// Usage
function InventoryItem({ item }) {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { id: 'use', label: 'Use', icon: 'check', action: () => useItem(item) },
        { id: 'drop', label: 'Drop', icon: 'trash', action: () => dropItem(item) },
        { id: 'info', label: 'Info', icon: 'info', action: () => showInfo(item) }
      ]
    });
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {item.name}
      </div>

      {contextMenu && (
        <ContextMenu
          {...contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
```

### Hover (Tooltips, Previews)

**Mouse Hover:**
- **Purpose:** Show additional information, preview state changes
- **Delay:** 500ms before showing tooltip (configurable)
- **Dismiss:** Mouse leave, or after timeout

**Use Cases:**
```
Button Hover         → Show tooltip
Link Hover           → Show destination preview
Skill Hover          → Show skill details
Item Hover           → Show item stats
Chart Point Hover    → Show data values
Icon Hover           → Show label
```

**Implementation:**
```jsx
function Tooltip({ content, delay = 500, children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="tooltip"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}

// Usage
<Tooltip content="Save your progress">
  <button>Save Game</button>
</Tooltip>
```

### Drag and Drop

**Drag and Drop:**
- **Purpose:** Reorder items, move items between containers, assign items
- **Visual Feedback:** Ghost image, drop target highlight, cursor change
- **Validation:** Show valid/invalid drop targets

**Use Cases:**
- **【參考：02-screens/management/character-build-screen.md】**
- **【參考：02-screens/management/inventory-screen.md】**

```
Skills Drag-Drop      → Assign to quick slot
Items Drag-Drop       → Move between inventory/equipment
Party Drag-Drop       → Reorder party members
UI Drag-Drop          → Customize UI layout
```

**Implementation:** (See dedicated section below)

## Cursor States

### Cursor Types

| Cursor | CSS | Use Case |
|--------|-----|----------|
| Default | `cursor: default` | Normal state, non-interactive |
| Pointer | `cursor: pointer` | Clickable elements (buttons, links) |
| Move | `cursor: move` | Draggable items |
| Grab | `cursor: grab` | Can be grabbed |
| Grabbing | `cursor: grabbing` | Currently dragging |
| Text | `cursor: text` | Text input, selectable text |
| Not-allowed | `cursor: not-allowed` | Disabled elements, invalid drops |
| Wait | `cursor: wait` | Loading, processing |
| Help | `cursor: help` | Help available (info tooltips) |
| Crosshair | `cursor: crosshair` | Precise selection (targeting) |
| Resize | `cursor: nwse-resize` | Resizable elements |

### Cursor Visual Examples

```
┌──────────────────────────────────────────┐
│  Default Cursor (→)                      │
│  Normal page content, non-interactive    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Pointer Cursor (👆)                     │
│  [Button]  <a>Link</a>  [Card]           │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Move Cursor (✋)                         │
│  [Draggable Item]                        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Not-allowed Cursor (🚫)                 │
│  [Disabled Button] [Invalid Drop Zone]  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Wait Cursor (⏳)                        │
│  Loading content...                      │
└──────────────────────────────────────────┘
```

### Implementation

```css
/* Default cursors */
body {
  cursor: default;
}

/* Interactive elements */
button, a, [role="button"], .clickable {
  cursor: pointer;
}

button:disabled, a.disabled {
  cursor: not-allowed;
}

/* Draggable items */
.draggable {
  cursor: grab;
}

.draggable.dragging {
  cursor: grabbing;
}

/* Text input */
input[type="text"], textarea, .editable-text {
  cursor: text;
}

/* Loading state */
.loading, .loading * {
  cursor: wait !important;
}

/* Help elements */
.help-icon, [data-tooltip] {
  cursor: help;
}

/* Resizable */
.resizable-handle {
  cursor: nwse-resize;
}
```

## Interactive Elements

### Buttons

**States:**
- **Default:** Normal appearance
- **Hover:** Slight elevation, color change
- **Active/Pressed:** Depressed appearance
- **Disabled:** Grayed out, not-allowed cursor
- **Focus:** Focus indicator (keyboard)

**Visual Transitions:**
```css
.button {
  /* Default state */
  background: #4A90E2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;

  /* Hover state */
  &:hover {
    background: #357ABD;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  /* Active state */
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  /* Disabled state */
  &:disabled {
    background: #CCC;
    color: #888;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Focus state (keyboard) */
  &:focus-visible {
    outline: 2px solid #4A90E2;
    outline-offset: 2px;
  }
}
```

**【參考：04-components/buttons.md】**

### Links

**States:**
- **Default:** Blue color, no underline (or subtle underline)
- **Hover:** Underline appears, slight color change
- **Active:** Darker color
- **Visited:** Purple color (optional for web)
- **Focus:** Focus indicator

```css
.link {
  color: #4A90E2;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    color: #357ABD;
  }

  &:active {
    color: #2A5F8D;
  }

  &:visited {
    color: #9B59B6; /* Optional */
  }

  &:focus-visible {
    outline: 2px solid #4A90E2;
    outline-offset: 2px;
    border-radius: 2px;
  }
}
```

### Cards

**States:**
- **Default:** Flat or subtle shadow
- **Hover:** Elevated shadow, slight scale increase
- **Active/Selected:** Border or background color change
- **Focus:** Focus indicator

**【參考：04-components/cards.md】**

```css
.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &.selected {
    border: 2px solid #4A90E2;
    background: rgba(74, 144, 226, 0.05);
  }

  &:focus-visible {
    outline: 2px solid #4A90E2;
    outline-offset: 2px;
  }
}
```

### Draggable Items

**States:**
- **Default:** Normal appearance, grab cursor
- **Hover:** Slight elevation hint
- **Dragging:** Semi-transparent, grabbing cursor
- **Over Valid Drop:** Green border/highlight
- **Over Invalid Drop:** Red border/not-allowed cursor

```css
.draggable {
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.dragging {
    opacity: 0.5;
    cursor: grabbing;
    transform: scale(1.05);
  }
}

.drop-target {
  border: 2px dashed transparent;
  transition: all 0.2s ease;

  &.drag-over-valid {
    border-color: #27AE60;
    background: rgba(39, 174, 96, 0.1);
  }

  &.drag-over-invalid {
    border-color: #E74C3C;
    background: rgba(231, 76, 60, 0.1);
    cursor: not-allowed;
  }
}
```

## Context Menus

### Context Menu Patterns

**Item Context Menu:**
```jsx
const itemContextMenuItems = [
  { id: 'use', label: 'Use Item', icon: 'check', shortcut: 'Enter' },
  { id: 'equip', label: 'Equip', icon: 'shield', shortcut: 'E' },
  { type: 'separator' },
  { id: 'drop', label: 'Drop', icon: 'trash', shortcut: 'Delete', danger: true },
  { id: 'info', label: 'Item Info', icon: 'info', shortcut: 'I' }
];
```

**Character Context Menu:**
```jsx
const characterContextMenuItems = [
  { id: 'view', label: 'View Character', icon: 'user' },
  { id: 'edit', label: 'Edit Build', icon: 'edit', shortcut: 'Ctrl+E' },
  { type: 'separator' },
  { id: 'duplicate', label: 'Duplicate', icon: 'copy', shortcut: 'Ctrl+D' },
  { id: 'export', label: 'Export Build', icon: 'download' },
  { type: 'separator' },
  { id: 'remove', label: 'Remove', icon: 'trash', shortcut: 'Delete', danger: true }
];
```

### Context Menu Implementation

```jsx
function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % items.filter(item => item.type !== 'separator').length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + items.length) % items.length);
          break;
        case 'Enter':
          e.preventDefault();
          items[selectedIndex]?.action?.();
          onClose();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, items, onClose]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="separator" role="separator" />;
        }

        return (
          <button
            key={item.id}
            role="menuitem"
            className={`menu-item ${item.danger ? 'danger' : ''} ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => {
              item.action();
              onClose();
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {item.icon && <Icon name={item.icon} />}
            <span>{item.label}</span>
            {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
```

## Tooltips

### Tooltip Configuration

**Default Settings:**
```javascript
const tooltipConfig = {
  delay: 500,              // ms before showing
  hideDelay: 0,            // ms before hiding (instant)
  offset: 8,               // px from target
  maxWidth: 300,           // px max width
  position: 'auto',        // 'top', 'bottom', 'left', 'right', 'auto'
  animation: 'fade',       // 'fade', 'scale', 'none'
  arrow: true              // show arrow pointer
};
```

### Tooltip Positioning

```
Target positioning priority:

1. Preferred position (if specified)
2. Top (if space available)
3. Bottom (if space available)
4. Right (if space available)
5. Left (if space available)
6. Fallback: overlay on target

┌─────────────────────────────────────┐
│          [Tooltip Top]              │
│              ▼                      │
│         [Button Target]             │
│              ▲                      │
│         [Tooltip Bottom]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Tooltip] ▶ [Target] ◀ [Tooltip]   │
│   Left                   Right      │
└─────────────────────────────────────┘
```

### Tooltip Implementation

```jsx
function useTooltip(options = {}) {
  const {
    delay = 500,
    position = 'auto',
    offset = 8
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const targetRef = useRef(null);

  const show = useCallback((target) => {
    targetRef.current = target;

    timeoutRef.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const pos = calculatePosition(rect, position, offset);
      setTooltipPosition(pos);
      setIsVisible(true);
    }, delay);
  }, [delay, position, offset]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  return { isVisible, tooltipPosition, show, hide };
}

function calculatePosition(targetRect, preferredPosition, offset) {
  const tooltipWidth = 200; // estimated
  const tooltipHeight = 40;  // estimated

  const positions = {
    top: {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top - offset
    },
    bottom: {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.bottom + offset
    },
    left: {
      x: targetRect.left - offset,
      y: targetRect.top + targetRect.height / 2
    },
    right: {
      x: targetRect.right + offset,
      y: targetRect.top + targetRect.height / 2
    }
  };

  // Check if preferred position fits on screen
  let position = positions[preferredPosition] || positions.top;

  // Adjust if out of bounds
  if (position.x < tooltipWidth / 2) position.x = tooltipWidth / 2;
  if (position.x > window.innerWidth - tooltipWidth / 2) {
    position.x = window.innerWidth - tooltipWidth / 2;
  }
  if (position.y < 0) position = positions.bottom;
  if (position.y > window.innerHeight - tooltipHeight) position = positions.top;

  return position;
}
```

### Tooltip Content Guidelines

**Good Tooltip Content:**
- Brief (1-2 lines max)
- Descriptive (explains purpose or action)
- Not redundant with visible label
- Includes keyboard shortcuts if applicable

**Examples:**
```jsx
// Good: Provides additional info
<Tooltip content="Save your progress (Ctrl+S)">
  <button>Save</button>
</Tooltip>

// Good: Explains icon
<Tooltip content="Character Stats">
  <Icon name="stats" />
</Tooltip>

// Bad: Redundant with button text
<Tooltip content="Save">
  <button>Save</button>
</Tooltip>

// Bad: Too much information
<Tooltip content="This button saves your current game progress to the local storage and also uploads a backup to the cloud server if you're online.">
  <button>Save</button>
</Tooltip>
```

## Drag and Drop

### Drag-Drop Flow

```
1. Mouse Down on Draggable
   ↓
2. Move mouse (threshold: 5px)
   ↓
3. Start Drag
   - Create ghost image
   - Change cursor to 'grabbing'
   - Highlight drop targets
   ↓
4. Drag Over Drop Target
   - Validate drop
   - Show valid/invalid feedback
   ↓
5. Drop
   - If valid: Execute drop action
   - If invalid: Cancel / Return to origin
   ↓
6. End Drag
   - Remove ghost image
   - Reset cursor
   - Clear highlights
```

### Implementation

**HTML5 Drag-Drop API:**
```jsx
function DraggableItem({ item, onDragStart, onDragEnd }) {
  const handleDragStart = (e) => {
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(item));

    // Optional: Custom ghost image
    const ghost = e.currentTarget.cloneNode(true);
    ghost.style.opacity = '0.5';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);

    onDragStart?.(item);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className="draggable-item"
    >
      {item.name}
    </div>
  );
}

function DropTarget({ onDrop, validateDrop, children }) {
  const [dragOver, setDragOver] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();

    // Validate drop
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const item = JSON.parse(data);
      const valid = validateDrop?.(item) ?? true;
      setIsValid(valid);
      e.dataTransfer.dropEffect = valid ? 'move' : 'none';
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const item = JSON.parse(data);
      if (validateDrop?.(item) ?? true) {
        onDrop(item);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`drop-target ${dragOver ? (isValid ? 'drag-over-valid' : 'drag-over-invalid') : ''}`}
    >
      {children}
    </div>
  );
}
```

**Usage Example: Skill Assignment**
```jsx
function SkillQuickSlots() {
  const [slots, setSlots] = useState(Array(9).fill(null));

  const handleDrop = (slotIndex) => (skill) => {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = skill;
      return newSlots;
    });
  };

  const validateDrop = (skill) => {
    // Can only assign active skills
    return skill.type === 'active';
  };

  return (
    <div className="quick-slots">
      {slots.map((slot, index) => (
        <DropTarget
          key={index}
          onDrop={handleDrop(index)}
          validateDrop={validateDrop}
        >
          {slot ? (
            <DraggableItem item={slot}>
              <SkillIcon skill={slot} />
            </DraggableItem>
          ) : (
            <div className="empty-slot">
              Slot {index + 1}
            </div>
          )}
        </DropTarget>
      ))}
    </div>
  );
}
```

### Cancel Drag (Escape)

```jsx
function useDragCancel(onCancel) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);
}

// Usage
function DraggableWithCancel({ item }) {
  const [isDragging, setIsDragging] = useState(false);

  useDragCancel(() => {
    if (isDragging) {
      setIsDragging(false);
      // Reset to original position
    }
  });

  return <div draggable onDragStart={() => setIsDragging(true)}>...</div>;
}
```

## Scroll Interactions

### Smooth Scrolling

```css
/* Enable smooth scrolling globally */
html {
  scroll-behavior: smooth;
}

/* Smooth scroll within containers */
.scrollable-container {
  overflow-y: auto;
  scroll-behavior: smooth;
}
```

### Scroll to Element

```javascript
// Smooth scroll to element
function scrollToElement(element, options = {}) {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
    offset = 0
  } = options;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior
  });
}

// Usage
const target = document.getElementById('character-stats');
scrollToElement(target, { offset: 80 }); // 80px for fixed header
```

### Infinite Scroll

```jsx
function useInfiniteScroll(callback, options = {}) {
  const { threshold = 100 } = options;

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        callback();
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
}

// Usage
function ItemList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useInfiniteScroll(() => {
    loadMoreItems(page + 1);
    setPage(p => p + 1);
  });

  return <div>{items.map(item => <ItemCard key={item.id} item={item} />)}</div>;
}
```

## Mobile Considerations

### Touch-Friendly Mouse Interactions

For touch devices, mouse interactions should map to touch equivalents:

| Mouse | Touch | Notes |
|-------|-------|-------|
| Click | Tap | Immediate, no delay |
| Double-click | Double-tap | 300ms gap tolerance |
| Right-click | Long-press | 500ms duration |
| Hover | N/A | Show on tap instead |
| Drag | Touch-drag | Same gesture |

**Hover on Touch:**
```jsx
function AdaptiveTooltip({ content, children }) {
  const [isTouch, setIsTouch] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window);
  }, []);

  if (isTouch) {
    // On touch: show tooltip on tap
    return (
      <>
        <div onClick={() => setShowTooltip(!showTooltip)}>
          {children}
        </div>
        {showTooltip && <div className="tooltip">{content}</div>}
      </>
    );
  }

  // On desktop: show tooltip on hover
  return (
    <Tooltip content={content}>
      {children}
    </Tooltip>
  );
}
```

**【參考：05-interactions/touch-gestures.md】** for comprehensive touch interaction patterns.

## Related Documentation

- **【參考：04-components/buttons.md】** - Button interaction patterns
- **【參考：04-components/cards.md】** - Card interaction states
- **【參考：04-components/forms.md】** - Form input interactions
- **【參考：05-interactions/keyboard-navigation.md】** - Keyboard alternatives
- **【參考：05-interactions/touch-gestures.md】** - Touch equivalents
- **【參考：05-interactions/accessibility.md】** - Accessible mouse interactions

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** Complete
