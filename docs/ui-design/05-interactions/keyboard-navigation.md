# 鍵盤導航 (Keyboard Navigation)

## Overview

Keyboard-first design philosophy ensures that all features are accessible and efficient to use without a mouse. This approach improves productivity for power users, ensures accessibility compliance, and provides a consistent interaction model across the application.

**Design Principles:**
- Every interactive element must be keyboard-accessible
- Provide visible focus indicators at all times
- Support standard keyboard conventions (Tab, Enter, Escape, Arrow keys)
- Offer customizable shortcuts for frequent actions
- No keyboard traps - users can always navigate away
- Provide keyboard shortcut help (? key)

## Global Hotkeys

Available everywhere in the application:

### Navigation Keys

| Key | Action | Description |
|-----|--------|-------------|
| `Tab` | Next focusable | Move focus to next interactive element |
| `Shift+Tab` | Previous focusable | Move focus to previous interactive element |
| `↑` `↓` `←` `→` | Arrow navigation | Navigate within lists, menus, or grids |
| `Home` | First item | Jump to first item in list/menu |
| `End` | Last item | Jump to last item in list/menu |
| `Page Up` | Scroll up | Scroll up one viewport height |
| `Page Down` | Scroll down | Scroll down one viewport height |

### Action Keys

| Key | Action | Description |
|-----|--------|-------------|
| `Enter` | Activate/Confirm | Trigger primary action, submit form, confirm dialog |
| `Space` | Select/Toggle | Toggle checkbox, activate button, select item |
| `Escape` | Cancel/Close | Close modal, cancel action, clear input |
| `Delete` | Delete item | Delete selected item (with confirmation) |
| `Backspace` | Go back | Navigate to previous page (where applicable) |

### Global Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+S` (Win) / `Cmd+S` (Mac) | Save | Save current changes |
| `Ctrl+Z` | Undo | Undo last action |
| `Ctrl+Shift+Z` | Redo | Redo last undone action |
| `Ctrl+F` | Search | Open search/filter |
| `Ctrl+K` | Command palette | Open command palette |
| `?` | Help | Show keyboard shortcuts help |
| `F1` | Help documentation | Open help documentation |

## Screen-Specific Hotkeys

### Exploration Mode Hotkeys
**【參考：02-screens/exploration/*.md】**

| Key | Action | Screen | Description |
|-----|--------|--------|-------------|
| `C` | Character | All exploration | Open character panel |
| `K` | Skills | All exploration | Open skills panel |
| `I` | Inventory | All exploration | Open inventory |
| `P` | Party | All exploration | Open party management |
| `M` | Map | All exploration | Toggle map view |
| `Q` | Quest log | All exploration | Open quest log |
| `E` | Interact | Field screen | Interact with highlighted object |
| `W` `A` `S` `D` | Move | Field screen | Move character (alternative to arrows) |
| `Shift+E` | Quick actions | Field screen | Show quick action menu |
| `T` | Talk | Town screen | Talk to NPC |
| `B` | Shop | Town screen | Open shop/market |
| `R` | Rest | Town screen | Rest at inn |

### Battle Mode Hotkeys
**【參考：02-screens/battle/*.md】**

| Key | Action | Description |
|-----|--------|-------------|
| `1-9` | Character select | Select party member 1-9 |
| `Ctrl+1-9` | Quick skill | Use assigned quick skill slot |
| `A` | Attack | Basic attack |
| `D` | Defend | Defend action |
| `S` | Skills | Open skills menu |
| `F` | Items | Open items menu |
| `Space` | Confirm action | Confirm selected action |
| `Escape` | Cancel/Back | Cancel action, return to previous menu |
| `Tab` | Next target | Cycle to next enemy target |
| `Shift+Tab` | Previous target | Cycle to previous enemy target |
| `Enter` | Execute | Execute selected command |
| `H` | Hint | Show action hints |
| `Ctrl+A` | Auto battle | Toggle auto battle mode |

### Management Hotkeys
**【參考：02-screens/management/*.md】**

| Key | Action | Screen | Description |
|-----|--------|--------|-------------|
| `Ctrl+N` | New | Various | Create new item |
| `Ctrl+E` | Edit | Various | Edit selected item |
| `Ctrl+D` | Duplicate | Various | Duplicate selected item |
| `Delete` | Remove | Various | Remove selected item |
| `Ctrl+Up/Down` | Reorder | Lists | Move item up/down in list |
| `Ctrl+Click` | Multi-select | Lists | Add/remove from selection |
| `Shift+Click` | Range select | Lists | Select range of items |
| `Ctrl+A` | Select all | Lists | Select all items |
| `Ctrl+Shift+A` | Deselect all | Lists | Deselect all items |

### Modal/Dialog Hotkeys

| Key | Action | Description |
|-----|--------|-------------|
| `Escape` | Close modal | Close modal/dialog |
| `Enter` | Confirm | Confirm and close (primary button) |
| `Tab` | Next field | Move to next form field |
| `Shift+Tab` | Previous field | Move to previous form field |
| `Ctrl+Enter` | Submit | Submit form (alternative) |

## Hotkey Conflicts Resolution

### Conflict Priority
1. **Modal/Dialog context** - Highest priority when modal is open
2. **Screen-specific context** - Active when on specific screen
3. **Global context** - Lowest priority, available everywhere

### Conflict Examples and Solutions

```
Conflict: 'S' key
- Battle screen: Opens skills menu (screen-specific)
- Global: Save (global shortcut)
Resolution: In battle, 'S' opens skills. Use Ctrl+S for save.

Conflict: 'A' key
- Battle screen: Attack action (screen-specific)
- Management: Select all (Ctrl+A)
Resolution: Battle uses 'A' alone. Select all requires Ctrl modifier.

Conflict: 'Escape' key
- Modal open: Close modal (modal context)
- Input focused: Clear input (field context)
- Global: Open menu (global)
Resolution: Prioritize context - modal > field > global.
```

## Customization

### User-Configurable Shortcuts

Allow users to customize shortcuts for:
- Character actions (C, K, I, P, M, Q)
- Battle commands (A, D, S, F)
- Quick skill slots (Ctrl+1-9)
- Global shortcuts (with restrictions)

**Restrictions:**
- Cannot override system shortcuts (Ctrl+C, Ctrl+V)
- Cannot override modal actions (Tab, Escape, Enter)
- Must avoid conflicts with browser shortcuts
- Warn users of conflicts before saving

**Implementation:**
```javascript
// Shortcut customization interface
const customShortcuts = {
  'character.inventory': 'I',
  'character.skills': 'K',
  'battle.attack': 'A',
  'battle.quickSkill1': 'Ctrl+1',
  // ... user customizations
};

// Check for conflicts
function validateShortcut(action, key) {
  const reserved = ['Tab', 'Escape', 'Enter'];
  if (reserved.includes(key)) {
    return { valid: false, reason: 'Reserved key' };
  }

  const existing = findConflictingAction(key);
  if (existing) {
    return { valid: false, reason: `Conflicts with ${existing}` };
  }

  return { valid: true };
}
```

## Focus Management

### Focus Order (Tab Order)

**Logical Tab Order:**
```
┌─────────────────────────────────────────┐
│  Header Navigation                      │
│  [Logo] → [Menu] → [Search] → [Profile]│
│         (Tab order: 1-4)                │
├─────────────────────────────────────────┤
│  Main Content Area                      │
│  ┌─────────────────────┐                │
│  │ Form / Interactive  │                │
│  │ [Field 1] (5)       │                │
│  │ [Field 2] (6)       │                │
│  │ [Field 3] (7)       │                │
│  │ [Button] (8)        │                │
│  └─────────────────────┘                │
├─────────────────────────────────────────┤
│  Sidebar (if present)                   │
│  [Widget 1] → [Widget 2] → [Widget 3]   │
│  (Tab order: 9-11)                      │
└─────────────────────────────────────────┘
```

**Tab Order Rules:**
1. **Top to bottom**, left to right (in LTR languages)
2. **Skip over** non-interactive elements
3. **Enter containers** before moving to siblings
4. **Complete sub-navigation** before leaving containers
5. **Follow DOM order** unless explicitly set with tabindex

**Implementation:**
```jsx
// Explicit tab order using tabindex (use sparingly)
<nav>
  <button tabIndex={1}>Primary Nav</button>
  <button tabIndex={2}>Secondary Nav</button>
</nav>

// Natural tab order (preferred)
<nav>
  <button>Primary Nav</button>  {/* Tab order follows DOM */}
  <button>Secondary Nav</button>
</nav>

// Remove from tab order
<div tabIndex={-1}>Not focusable by Tab</div>

// Make non-interactive element focusable
<div tabIndex={0} role="button">Custom button</div>
```

### Focus Indicators (Visual Cues)

**Default Focus Styles:**
```css
/* Global focus indicator */
*:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove outline for mouse users, keep for keyboard */
*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}
```

**Component-Specific Focus Styles:**
```css
/* Button focus */
button:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.2);
}

/* Input focus */
input:focus, textarea:focus, select:focus {
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  outline: none;
}

/* Card focus */
.card:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 4px;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* List item focus */
.list-item:focus-visible {
  background-color: rgba(74, 144, 226, 0.1);
  outline: 2px solid #4A90E2;
  outline-offset: -2px;
}
```

**Visual Indicators:**
- **Color**: Blue (#4A90E2) for default focus
- **Thickness**: 2px outline
- **Offset**: 2px from element edge
- **Shadow**: Optional subtle shadow for depth
- **Animation**: Optional subtle scale or elevation change

### Focus Traps (in Modals)

When a modal is open, focus should be trapped within the modal to prevent users from interacting with background content.

**Focus Trap Flow:**
```
Modal Opens
    ↓
Save previous focus (returnFocus)
    ↓
Move focus to modal (first focusable element or modal container)
    ↓
Tab navigation cycles within modal
    ↓
    ┌─────────────────────────────────┐
    │ [X Close]  ← Shift+Tab wraps    │
    │                                 │
    │ [Input Field 1]                 │
    │ [Input Field 2]                 │
    │ [Cancel] [Confirm]              │
    │              ↓                  │
    └──────────────Tab wraps──────────┘
                   ↓
Modal Closes
    ↓
Restore focus to returnFocus element
```

**Implementation:**
```javascript
// Focus trap implementation
class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
  }

  activate() {
    // Save current focus
    this.previousFocus = document.activeElement;

    // Get all focusable elements
    this.focusableElements = Array.from(
      this.element.querySelectorAll(this.focusableSelectors)
    );

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];

    // Focus first element
    this.firstFocusable?.focus();

    // Add event listener
    this.element.addEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift+Tab: wrap to last element
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab: wrap to first element
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }

  deactivate() {
    // Remove event listener
    this.element.removeEventListener('keydown', this.handleKeyDown);

    // Restore previous focus
    this.previousFocus?.focus();
  }
}

// Usage in React
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  const focusTrapRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      focusTrapRef.current = new FocusTrap(modalRef.current);
      focusTrapRef.current.activate();

      return () => {
        focusTrapRef.current?.deactivate();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

### Focus Restoration (After Closing Modals)

When a modal closes, focus should return to the element that opened it.

**Restoration Strategies:**

1. **Save trigger element:**
```javascript
// Save reference to button that opened modal
const openButton = document.activeElement;

// When modal closes
openButton.focus();
```

2. **Use data attributes:**
```jsx
<button
  onClick={(e) => {
    openModal();
    e.currentTarget.dataset.restoreFocus = 'true';
  }}
>
  Open Modal
</button>

// On close
const triggerElement = document.querySelector('[data-restore-focus="true"]');
triggerElement?.focus();
triggerElement?.removeAttribute('data-restore-focus');
```

3. **Focus management context:**
```javascript
// Focus manager
const FocusManager = {
  stack: [],

  push(element) {
    this.stack.push(element);
  },

  pop() {
    const element = this.stack.pop();
    element?.focus();
  },

  clear() {
    this.stack = [];
  }
};

// Usage
button.addEventListener('click', () => {
  FocusManager.push(button);
  openModal();
});

modal.addEventListener('close', () => {
  FocusManager.pop();
});
```

## Keyboard Accessibility

### All Features Keyboard-Accessible

**Checklist:**
- [ ] Every interactive element reachable via Tab
- [ ] All actions performable with Enter or Space
- [ ] All forms completable without mouse
- [ ] All menus navigable with Arrow keys
- [ ] All dialogs closeable with Escape
- [ ] All drag-drop has keyboard alternative
- [ ] All hover content accessible via focus

**Example: Drag-Drop Alternative**
```jsx
// Mouse users can drag-drop
// Keyboard users use menu
<DraggableItem
  item={skill}
  onDrop={handleDrop}
  onKeyboardAssign={() => {
    // Show menu: "Assign to slot 1, 2, 3..."
    showAssignmentMenu(skill);
  }}
/>
```

### No Keyboard Traps

Users must always be able to navigate away from any element using standard keyboard keys.

**Anti-pattern (Keyboard Trap):**
```javascript
// DON'T: Prevent Tab from leaving custom component
input.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault(); // TRAP!
    e.stopPropagation();
  }
});
```

**Correct Pattern:**
```javascript
// DO: Allow Tab, handle it internally if needed
input.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    // Handle tab within component if needed
    // But allow default behavior if reaching boundaries
    if (shouldAllowEscape(e)) {
      // Let default Tab behavior happen
      return;
    }
    // Custom handling for internal navigation
    e.preventDefault();
    focusNextInternalElement();
  }
});
```

### Skip to Content Links

Provide skip links for keyboard users to bypass repetitive navigation.

```html
<!-- Skip link at top of page (visible on focus) -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<nav>
  <!-- Navigation items -->
</nav>

<main id="main-content" tabindex="-1">
  <!-- Main content -->
</main>
```

```css
/* Skip link styles */
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

### Keyboard Shortcuts Help (? Key)

Provide an overlay showing all available keyboard shortcuts.

```jsx
// Keyboard shortcuts help modal
function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        setIsOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2>Keyboard Shortcuts</h2>

      <section>
        <h3>Global</h3>
        <ShortcutList shortcuts={globalShortcuts} />
      </section>

      <section>
        <h3>Navigation</h3>
        <ShortcutList shortcuts={navigationShortcuts} />
      </section>

      <section>
        <h3>Current Screen</h3>
        <ShortcutList shortcuts={screenSpecificShortcuts} />
      </section>
    </Modal>
  );
}

function ShortcutList({ shortcuts }) {
  return (
    <dl className="shortcuts-list">
      {shortcuts.map(({ key, description }) => (
        <div key={key}>
          <dt><kbd>{key}</kbd></dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  );
}
```

## Implementation Examples

### Keyboard Event Handling

**Basic Key Handler:**
```javascript
function handleKeyDown(event) {
  const { key, ctrlKey, shiftKey, altKey, metaKey } = event;

  // Build modifier string
  const modifiers = [
    ctrlKey && 'Ctrl',
    shiftKey && 'Shift',
    altKey && 'Alt',
    metaKey && 'Meta'
  ].filter(Boolean).join('+');

  const fullKey = modifiers ? `${modifiers}+${key}` : key;

  // Check against shortcut map
  const action = shortcutMap[fullKey];
  if (action) {
    event.preventDefault();
    action();
  }
}

// Shortcut map
const shortcutMap = {
  'C': openCharacterPanel,
  'K': openSkillsPanel,
  'I': openInventory,
  'Ctrl+S': saveGame,
  'Ctrl+K': openCommandPalette,
  '?': showKeyboardHelp
};
```

**React Hook for Keyboard Shortcuts:**
```javascript
function useKeyboardShortcut(shortcut, callback, options = {}) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event) {
      const matches = matchShortcut(event, shortcut);

      if (matches) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, callback, enabled, preventDefault]);
}

// Helper to match shortcut
function matchShortcut(event, shortcut) {
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  if (event.key !== key) return false;

  const hasCtrl = modifiers.includes('Ctrl');
  const hasShift = modifiers.includes('Shift');
  const hasAlt = modifiers.includes('Alt');
  const hasMeta = modifiers.includes('Meta');

  return (
    (!hasCtrl || event.ctrlKey) &&
    (!hasShift || event.shiftKey) &&
    (!hasAlt || event.altKey) &&
    (!hasMeta || event.metaKey)
  );
}

// Usage
function CharacterScreen() {
  useKeyboardShortcut('I', () => {
    openInventory();
  });

  useKeyboardShortcut('Ctrl+S', () => {
    saveCharacter();
  });

  return <div>...</div>;
}
```

**Arrow Key Navigation:**
```javascript
function useArrowNavigation(listRef, options = {}) {
  const {
    orientation = 'vertical', // 'vertical' | 'horizontal' | 'grid'
    loop = true,
    selector = '[role="option"]'
  } = options;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    function handleKeyDown(event) {
      const items = Array.from(list.querySelectorAll(selector));
      const currentIndex = items.indexOf(document.activeElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex + 1;
          }
          break;

        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex - 1;
          }
          break;

        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex + 1;
          }
          break;

        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'grid') {
            event.preventDefault();
            nextIndex = currentIndex - 1;
          }
          break;

        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;

        default:
          return;
      }

      // Handle looping
      if (loop) {
        nextIndex = (nextIndex + items.length) % items.length;
      } else {
        nextIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
      }

      // Focus next item
      items[nextIndex]?.focus();
    }

    list.addEventListener('keydown', handleKeyDown);
    return () => list.removeEventListener('keydown', handleKeyDown);
  }, [listRef, orientation, loop, selector]);
}

// Usage
function SkillsList() {
  const listRef = useRef(null);
  useArrowNavigation(listRef, { orientation: 'vertical', loop: true });

  return (
    <div ref={listRef} role="listbox">
      {skills.map(skill => (
        <div key={skill.id} role="option" tabIndex={0}>
          {skill.name}
        </div>
      ))}
    </div>
  );
}
```

## Testing Scenarios

### Manual Testing Checklist

**Basic Navigation:**
- [ ] Tab through all interactive elements in logical order
- [ ] Shift+Tab moves backwards through elements
- [ ] Focus indicator visible on all elements
- [ ] Arrow keys work in lists and menus
- [ ] Home/End keys jump to first/last items

**Modal Testing:**
- [ ] Focus moves to modal when opened
- [ ] Tab cycles within modal (focus trap)
- [ ] Escape closes modal
- [ ] Focus returns to trigger element when closed
- [ ] Background content not focusable while modal open

**Form Testing:**
- [ ] All form fields reachable via Tab
- [ ] Enter submits form from any field
- [ ] Escape clears/resets form
- [ ] Error messages announced and focusable
- [ ] Radio buttons navigable with Arrow keys

**Screen-Specific Testing:**
- [ ] All screen shortcuts work as documented
- [ ] No conflicts with global shortcuts
- [ ] Custom shortcuts persist after configuration
- [ ] Shortcuts shown in help overlay (?)

**Browser Testing:**
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test on Windows
- [ ] Test on Mac
- [ ] Test on Linux

### Automated Testing

```javascript
// Example: Test keyboard navigation with Testing Library
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('Tab navigates through form fields', async () => {
  const user = userEvent.setup();

  render(<LoginForm />);

  const usernameInput = screen.getByLabelText('Username');
  const passwordInput = screen.getByLabelText('Password');
  const submitButton = screen.getByRole('button', { name: 'Login' });

  // Focus first field
  usernameInput.focus();
  expect(usernameInput).toHaveFocus();

  // Tab to next field
  await user.tab();
  expect(passwordInput).toHaveFocus();

  // Tab to button
  await user.tab();
  expect(submitButton).toHaveFocus();

  // Shift+Tab back
  await user.tab({ shift: true });
  expect(passwordInput).toHaveFocus();
});

test('Escape closes modal and restores focus', async () => {
  const user = userEvent.setup();

  render(<App />);

  const openButton = screen.getByRole('button', { name: 'Open Modal' });

  // Open modal
  await user.click(openButton);

  const modal = screen.getByRole('dialog');
  expect(modal).toBeInTheDocument();

  // Close with Escape
  await user.keyboard('{Escape}');

  expect(modal).not.toBeInTheDocument();
  expect(openButton).toHaveFocus();
});

test('Arrow keys navigate list', async () => {
  const user = userEvent.setup();

  render(<SkillsList />);

  const items = screen.getAllByRole('option');

  // Focus first item
  items[0].focus();
  expect(items[0]).toHaveFocus();

  // Arrow down
  await user.keyboard('{ArrowDown}');
  expect(items[1]).toHaveFocus();

  // Arrow up
  await user.keyboard('{ArrowUp}');
  expect(items[0]).toHaveFocus();

  // Home key
  items[2].focus();
  await user.keyboard('{Home}');
  expect(items[0]).toHaveFocus();

  // End key
  await user.keyboard('{End}');
  expect(items[items.length - 1]).toHaveFocus();
});
```

## Related Documentation

- **【參考：02-screens/*/\*.md】** - Screen-specific keyboard shortcuts
- **【參考：04-components/buttons.md】** - Button keyboard interactions
- **【參考：04-components/forms.md】** - Form keyboard navigation
- **【參考：04-components/modals.md】** - Modal focus management
- **【參考：05-interactions/accessibility.md】** - Keyboard accessibility requirements
- **【參考：05-interactions/mouse-interactions.md】** - Alternative input methods

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** Complete
