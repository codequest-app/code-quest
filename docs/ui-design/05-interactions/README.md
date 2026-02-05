# Interaction Design (互動設計)

## Overview

This directory contains comprehensive documentation for all interaction patterns, input methods, and accessibility guidelines in the UI design system. Our interaction design is built on three pillars: **keyboard-first**, **touch-friendly**, and **accessible to all users**.

**Core Philosophy:**
- **Multi-modal input:** Support keyboard, mouse, and touch equally well
- **Consistent patterns:** Same interactions work the same way across the app
- **Progressive enhancement:** Start with accessibility, add enhancements
- **User control:** Users can customize and control their experience
- **Immediate feedback:** All interactions provide clear visual, auditory, or haptic feedback

**Target Compliance:**
- WCAG 2.1 Level AA
- ARIA 1.2 best practices
- Platform-specific guidelines (iOS HIG, Android Material Design)

## Document Index

### 1. [keyboard-navigation.md](./keyboard-navigation.md) - 鍵盤導航
Comprehensive keyboard navigation and hotkey documentation.

**Contents:**
- Global hotkeys (navigation, actions, shortcuts)
- Screen-specific hotkeys (exploration, battle, management)
- Hotkey conflict resolution
- Customizable shortcuts
- Focus management (tab order, focus indicators, focus traps, focus restoration)
- Keyboard accessibility standards
- Implementation examples and testing

**Key Features:**
- Every feature keyboard-accessible
- Visible focus indicators
- No keyboard traps
- Help overlay (? key)
- Customizable hotkeys

### 2. [mouse-interactions.md](./mouse-interactions.md) - 滑鼠互動
Standard mouse interaction patterns and behaviors.

**Contents:**
- Basic interactions (click, double-click, right-click, hover, drag-drop)
- Cursor states (pointer, move, not-allowed, wait, help)
- Interactive element states (buttons, links, cards)
- Context menus
- Tooltips (timing, positioning, content)
- Drag and drop patterns
- Scroll interactions
- Mobile considerations

**Key Features:**
- Immediate visual feedback
- Context-appropriate cursors
- Rich tooltips
- Drag-drop for efficiency
- Right-click menus

### 3. [touch-gestures.md](./touch-gestures.md) - 觸控手勢
Touch-first design for mobile and tablet devices.

**Contents:**
- Basic gestures (tap, double-tap, long-press, swipe, pinch-to-zoom)
- Gesture mapping (iOS vs Android)
- Touch target sizing (44x44px minimum)
- Touch feedback (visual, haptic, audio)
- Swipe gestures (navigation, dismiss, pull-to-refresh)
- Multi-touch patterns
- Touch accessibility
- Edge cases and conflict resolution

**Key Features:**
- Minimum 44x44px touch targets
- 8px spacing between targets
- Haptic feedback
- Platform-specific gestures
- Gesture alternatives (buttons)

### 4. [accessibility.md](./accessibility.md) - 無障礙設計
WCAG AA compliance and inclusive design guidelines.

**Contents:**
- Screen reader support (semantic HTML, ARIA, live regions, announcements)
- Keyboard accessibility (all features, no traps, focus indicators)
- Visual accessibility (color contrast, color independence, text resize, high contrast, color blindness)
- Motion and animation (prefers-reduced-motion, pause controls)
- Content accessibility (clear language, readable fonts, alt text)
- Form accessibility (labels, errors, validation)
- ARIA patterns (modals, tabs, accordions, menus, progress bars)
- Testing tools and checklist

**Key Features:**
- WCAG 2.1 AA compliant
- 4.5:1 contrast for text
- Screen reader compatible
- All features keyboard-accessible
- Reduced motion support

### 5. [README.md](./README.md) (This file)
Overview and index of interaction design documentation.

## Key Principles

### 1. Keyboard-First Design

All features must be fully accessible via keyboard before adding mouse or touch enhancements.

**Benefits:**
- Ensures accessibility compliance
- Improves productivity for power users
- Provides fallback for when other inputs fail
- Forces clear interaction hierarchy

**Implementation:**
```jsx
// Every interactive element must support keyboard
<Card
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  {content}
</Card>
```

**【參考：keyboard-navigation.md】** for complete keyboard interaction patterns.

### 2. Touch-Friendly UI

All touch targets must be at least 44x44px with 8px minimum spacing.

**Benefits:**
- Prevents accidental taps
- Comfortable for users with motor impairments
- Works well on all device sizes
- Reduces user frustration

**Implementation:**
```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

.button-group {
  display: flex;
  gap: 8px; /* Minimum spacing */
}
```

**【參考：touch-gestures.md】** for complete touch interaction patterns.

### 3. Accessible to All Users

Design for the widest possible audience, including users with disabilities.

**Benefits:**
- Legal compliance (ADA, Section 508)
- Larger addressable audience
- Better experience for everyone
- Future-proof design

**Implementation:**
```jsx
// Accessible button with proper ARIA
<button
  aria-label="Save character"
  aria-describedby="save-help"
  disabled={!hasChanges}
>
  <Icon name="save" aria-hidden="true" />
  Save
</button>
<span id="save-help" className="sr-only">
  Keyboard shortcut: Ctrl+S
</span>
```

**【參考：accessibility.md】** for complete accessibility guidelines.

### 4. Consistent Interaction Patterns

Use the same patterns for the same actions throughout the application.

**Examples:**
- **Primary action:** Always Enter key or primary button
- **Cancel/Close:** Always Escape key or X button
- **Delete:** Always Delete key or trash icon with confirmation
- **Context menu:** Always right-click or long-press (500ms)
- **Navigation:** Always Tab/Shift+Tab or swipe left/right

**Benefits:**
- Reduced learning curve
- Faster user proficiency
- Fewer errors
- Better user satisfaction

## Quick Reference

### Common Hotkeys

| Key | Action | Context |
|-----|--------|---------|
| `Tab` | Next focusable | Global |
| `Shift+Tab` | Previous focusable | Global |
| `Enter` | Activate/Confirm | Global |
| `Escape` | Cancel/Close | Global |
| `Space` | Select/Toggle | Global |
| `Ctrl+S` | Save | Global |
| `Ctrl+K` | Command palette | Global |
| `?` | Show keyboard help | Global |
| `C` | Character panel | Exploration |
| `I` | Inventory | Exploration |
| `M` | Map | Exploration |
| `1-9` | Select character | Battle |
| `A` | Attack | Battle |
| `S` | Skills menu | Battle |

**【參考：keyboard-navigation.md】** for complete hotkey reference.

### Common Gestures

| Gesture | Action | Duration/Threshold |
|---------|--------|-------------------|
| Tap | Primary action | < 200ms |
| Double-tap | Special action / Zoom | 2 taps within 300ms |
| Long-press | Context menu | 500ms |
| Swipe left/right | Navigate / Dismiss | 50px minimum |
| Swipe down | Refresh / Dismiss | 80px minimum |
| Pinch | Zoom in/out | Two-finger |
| Two-finger scroll | Scroll container | iOS standard |

**【參考：touch-gestures.md】** for complete gesture reference.

### Accessibility Guidelines Summary

**Visual:**
- 4.5:1 contrast ratio for normal text
- 3:1 for large text (18pt+) and UI components
- Don't rely on color alone (use icons + text)
- Support text resize up to 200%

**Keyboard:**
- All features keyboard-accessible
- Visible focus indicators (2px blue outline)
- No keyboard traps
- Logical tab order

**Screen Readers:**
- Semantic HTML or ARIA equivalents
- Alt text for all images
- ARIA labels for icon buttons
- Announce dynamic changes (aria-live)

**Motion:**
- Respect `prefers-reduced-motion`
- Provide pause controls for auto-play > 5s
- Smooth, not jarring, transitions

**【參考：accessibility.md】** for complete accessibility checklist.

## Learning Path

Recommended reading order for new team members:

### 1. Start with Accessibility (Essential Foundation)
**Read:** [accessibility.md](./accessibility.md)

**Why First:** Understanding accessibility constraints ensures all subsequent interaction patterns are inclusive from the start.

**Key Learnings:**
- WCAG AA requirements
- Screen reader support
- Keyboard accessibility basics
- Color contrast rules
- ARIA patterns

### 2. Keyboard Navigation (Core Interaction)
**Read:** [keyboard-navigation.md](./keyboard-navigation.md)

**Why Second:** Keyboard is the foundation for all accessible interactions. Mouse and touch are enhancements on top of keyboard support.

**Key Learnings:**
- Global and screen-specific hotkeys
- Focus management
- Tab order
- Keyboard accessibility patterns
- Custom shortcut system

### 3. Mouse Interactions (Desktop Enhancement)
**Read:** [mouse-interactions.md](./mouse-interactions.md)

**Why Third:** Mouse provides additional efficiency for desktop users but should never be the only way to accomplish tasks.

**Key Learnings:**
- Click, hover, right-click patterns
- Cursor states
- Tooltips
- Context menus
- Drag-drop patterns

### 4. Touch Gestures (Mobile Enhancement)
**Read:** [touch-gestures.md](./touch-gestures.md)

**Why Last:** Touch is the most platform-specific input method. Understanding keyboard and mouse first provides context for touch equivalents.

**Key Learnings:**
- Touch target sizing
- Basic gestures (tap, swipe, long-press)
- Touch feedback
- Platform differences (iOS vs Android)
- Gesture accessibility

### 5. Integration and Practice
**Apply:** Use all four documents together when implementing features.

**Practice:**
- Implement keyboard support first
- Add mouse enhancements
- Add touch gestures
- Test with screen readers
- Run accessibility audits

## Implementation Guidelines

### Step-by-Step Feature Implementation

**1. Design with Accessibility First**
```
Questions to ask:
- Can this be operated with keyboard only?
- How will screen readers announce this?
- What's the tab order?
- Does color contrast meet requirements?
- What's the focus indicator?
```

**2. Implement Keyboard Support**
```jsx
// Always start with keyboard
<button
  onClick={handleAction}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
  aria-label="Descriptive action name"
>
  Action
</button>
```

**3. Add Mouse Enhancements**
```jsx
// Add hover, cursor states, tooltips
<button
  onClick={handleAction}
  onKeyPress={handleKeyPress}
  aria-label="Save character"
  className="button"
  style={{ cursor: 'pointer' }}
>
  <Tooltip content="Save your progress (Ctrl+S)">
    <Icon name="save" />
    Save
  </Tooltip>
</button>
```

**4. Add Touch Support**
```jsx
// Add touch gestures, ensure 44x44px minimum size
<button
  onClick={handleAction}
  onKeyPress={handleKeyPress}
  onTouchStart={handleTouchFeedback}
  aria-label="Save character"
  style={{
    minWidth: '44px',
    minHeight: '44px',
    cursor: 'pointer'
  }}
>
  <Tooltip content="Save your progress (Ctrl+S)">
    <Icon name="save" />
    Save
  </Tooltip>
</button>
```

**5. Test Thoroughly**
```
Checklist:
- [ ] Keyboard-only testing
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Touch device testing (iOS, Android)
- [ ] Color contrast check
- [ ] Automated accessibility audit (axe, WAVE)
- [ ] Manual WCAG checklist
```

## Testing Checklist

### Keyboard Testing
- [ ] Tab through all elements in logical order
- [ ] All actions available via keyboard
- [ ] Focus visible on all elements
- [ ] No keyboard traps
- [ ] Escape closes modals/cancels actions
- [ ] Arrow keys work in lists/menus
- [ ] Enter activates buttons/links
- [ ] Space toggles checkboxes

### Mouse Testing
- [ ] Hover shows tooltips (500ms delay)
- [ ] Cursor changes appropriately
- [ ] Click provides immediate feedback
- [ ] Right-click shows context menus
- [ ] Drag-drop works smoothly
- [ ] Double-click for special actions
- [ ] Tooltips positioned correctly

### Touch Testing
- [ ] All touch targets ≥ 44x44px
- [ ] 8px spacing between targets
- [ ] Tap provides visual feedback
- [ ] Long-press shows context menu (500ms)
- [ ] Swipe gestures work smoothly
- [ ] Pinch-to-zoom (where applicable)
- [ ] No accidental touches
- [ ] Haptic feedback appropriate

### Accessibility Testing
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast ≥ 4.5:1 (text)
- [ ] Works with screen reader
- [ ] Supports keyboard-only navigation
- [ ] Respects prefers-reduced-motion
- [ ] Text resizable to 200%
- [ ] No content relies on color alone

### Cross-Browser/Platform Testing
- [ ] Chrome (Windows, Mac, Android)
- [ ] Firefox (Windows, Mac)
- [ ] Safari (Mac, iOS)
- [ ] Edge (Windows)
- [ ] iOS Safari (iPhone, iPad)
- [ ] Android Chrome (Phone, Tablet)

## Common Patterns

### Modal/Dialog Pattern

```jsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);

  // Focus management
  useFocusTrap(modalRef, isOpen);
  useRestoreFocus(isOpen);

  // Keyboard support
  useEscapeKey(onClose, isOpen);

  // Announcements
  const announce = useLiveAnnouncement();

  useEffect(() => {
    if (isOpen) {
      announce(`${title} dialog opened`);
    }
  }, [isOpen, title, announce]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="Close dialog">
        Close
      </button>
    </div>
  );
}
```

### Form Input Pattern

```jsx
function AccessibleInput({
  label,
  error,
  helpText,
  required,
  ...props
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>

      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          [
            error && errorId,
            helpText && helpId
          ].filter(Boolean).join(' ')
        }
        aria-required={required}
        {...props}
      />

      {helpText && (
        <span id={helpId} className="help-text">
          {helpText}
        </span>
      )}

      {error && (
        <span id={errorId} className="error-message" role="alert">
          <Icon name="error" aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  );
}
```

### Button with Loading State

```jsx
function ActionButton({
  children,
  loading,
  disabled,
  onClick,
  ...props
}) {
  const haptic = useHaptic();
  const announce = useLiveAnnouncement();

  const handleClick = async (e) => {
    haptic();

    if (loading || disabled) return;

    try {
      await onClick(e);
      announce('Action completed successfully');
    } catch (error) {
      announce('Action failed', 'assertive');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      aria-busy={loading}
      aria-disabled={disabled}
      style={{
        minWidth: '44px',
        minHeight: '44px',
        cursor: loading ? 'wait' : disabled ? 'not-allowed' : 'pointer'
      }}
      {...props}
    >
      {loading && (
        <>
          <Spinner aria-hidden="true" />
          <span className="sr-only">Loading...</span>
        </>
      )}
      {!loading && children}
    </button>
  );
}
```

### Swipeable List Item

```jsx
function SwipeableListItem({
  item,
  onTap,
  onLongPress,
  onSwipeDelete
}) {
  // Touch gestures
  const swipe = useSwipe({
    onSwipeLeft: (distance) => {
      if (distance > 100) onSwipeDelete(item);
    }
  });

  const longPress = useLongPress(() => onLongPress(item), {
    threshold: 500
  });

  // Keyboard support
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') onTap(item);
    if (e.key === 'Delete') onSwipeDelete(item);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTap(item)}
      onKeyPress={handleKeyPress}
      {...swipe}
      {...longPress}
      style={{
        minHeight: '48px',
        transform: `translateX(${swipe.swipeDistance.x}px)`,
        transition: swipe.swiping ? 'none' : 'transform 0.3s'
      }}
    >
      {item.name}

      {/* Delete action revealed on swipe */}
      <div className="delete-action" aria-hidden="true">
        <Icon name="trash" />
      </div>
    </div>
  );
}
```

## Related Documentation

### Screens
**【參考：02-screens/*/\*.md】** - Screen-specific interaction patterns
- Exploration mode interactions
- Battle mode interactions
- Management screen interactions
- Modal/dialog interactions

### Components
**【參考：04-components/*.md】** - Component-specific interactions
- Button interactions
- Form interactions
- Card interactions
- Modal interactions
- Navigation interactions

### User Flows
**【參考：03-flows/*.md】** - Cross-screen interaction flows
- Character creation flow
- Battle flow
- Item management flow
- Skill management flow

## Tools and Resources

### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Performance and accessibility audits
- **ColorOracle** - Color blindness simulator

### Testing Tools
- **NVDA** - Free screen reader (Windows)
- **JAWS** - Commercial screen reader (Windows)
- **VoiceOver** - Built-in screen reader (Mac/iOS)
- **TalkBack** - Built-in screen reader (Android)

### Documentation
- **WCAG 2.1** - https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices** - https://www.w3.org/WAI/ARIA/apg/
- **MDN Accessibility** - https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **WebAIM** - https://webaim.org/

### Libraries
- **React ARIA** - Accessible UI primitives
- **Radix UI** - Unstyled, accessible components
- **Headless UI** - Unstyled, accessible components
- **Reach UI** - Accessible component library

## Change Log

### Version 1.0 (2026-02-05)
- Initial creation of interaction design documentation
- Keyboard navigation patterns documented
- Mouse interaction patterns documented
- Touch gesture patterns documented
- Accessibility guidelines established
- Quick reference tables created
- Common patterns and examples added

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** Complete
**Stage:** Stage 3 Batch 3 - Interaction Design Documentation
