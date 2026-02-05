# UI Interaction - Requirements

**Document Date**: 2026-02-05
**Version**: v1.0

---

## Core Design Principles

### 1. Immediate Feedback（即時回饋）
- All operations have immediate visual/audio feedback
- HP/MP/EXP changes show animated transitions
- Skill casting has visual effects and sound
- Button clicks have press animations

### 2. State Visibility（狀態可見）
- HP/MP/EXP always visible in status bar
- Current level and resources displayed prominently
- AI processing state clearly indicated
- Connection status always shown

### 3. Reduced Cognitive Load（減少認知負擔）
- Preset skills lower usage barrier
- Common tasks accessible via shortcuts
- Auto-generated prompts from skill templates
- Clear visual hierarchy

### 4. Progressive Disclosure（漸進式揭露）
- Advanced features hidden initially
- Expand sections on demand
- Avoid overwhelming new users
- Gradual feature introduction

### 5. Error Tolerance（錯誤容忍）
- Retry mechanisms for failures
- Auto-save conversations
- Network reconnection handling
- Undo/cancel operations

### 6. Accessibility（無障礙）
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Flexible font sizes

---

## User Flow Requirements

### Startup Flow

```
User Launch
    ↓
Loading Screen
├─ Pixel art logo animation
├─ "Connecting to wizard..." message
└─ Progress indicator
    ↓
Connection Check
├─ Success → Main Interface
└─ Failure → Error Screen with retry
```

**Requirements**:
- Loading should complete within 3 seconds
- Show progress during connection
- Clear error messages if connection fails
- Retry button always available

### Main Interaction Loop

```
User Input
    ↓
Validation
├─ Non-empty check
├─ MP sufficient check
└─ Format validation
    ↓
Display User Message
    ↓
Send to Backend
    ↓
Stream AI Response
├─ Typewriter effect
├─ Markdown rendering
└─ Code highlighting
    ↓
Update Stats (MP, EXP, Gold)
    ↓
Wait for Next Input
```

---

## Interface Layout Requirements

### Status Bar (Top, Fixed)

**Must Include**:
- Player level and name
- HP bar with current/max values
- MP bar with current/max values
- Gold amount
- Notification icon with badge count
- Settings icon
- History icon

**Format Requirements**:
- HP: `❤️ HP: 80/100` with 10-block progress bar
- MP: `⚡ MP: 60/100` with 10-block progress bar
- Gold: `💰 1,250` with comma separators
- Level: `Lv.5 [Name]` clickable

### Dialogue Area (Scrollable)

**Requirements**:
- AI avatar and name displayed
- Status indicator (thinking/casting/complete)
- Message bubbles with timestamp
- Code blocks with syntax highlighting
- Copy button for each message
- Favorite button for important messages
- Smooth scroll behavior
- Virtual scrolling for performance

### Input Area

**Requirements**:
- Multi-line text input support
- Placeholder text: "Tell the wizard your needs..."
- Voice input button
- File attachment button
- Send button (Enter key)
- Clear conversation button
- Mode indicator (free dialogue/skill mode)

**Keyboard Shortcuts**:
- Enter: Send message
- Shift+Enter: New line
- Ctrl+K: Clear input
- Esc: Cancel current operation

### Skill Bar (Bottom or Side)

**Requirements**:
- Display 5-6 most used skills
- Show skill icon, name, and MP cost
- Indicate skill state (available/cooldown/locked/insufficient MP)
- Hover shows skill description
- Click triggers skill parameter dialog
- "Show more skills" button
- Drag-and-drop reordering support

---

## Skill Casting Requirements

### Validation Flow

```
User Clicks Skill
    ↓
Check MP Sufficient
├─ Yes → Show Parameter Dialog
└─ No → Show "Insufficient MP" Error
    ↓
User Fills Parameters
    ↓
Generate Complete Prompt
    ↓
Display in Input Box
├─ Auto-send (configurable)
└─ or Wait for User Confirmation
    ↓
Execute Skill
├─ Play casting animation
├─ Deduct MP with animation
└─ Send to AI
```

### Parameter Dialog Requirements

**Must Include**:
- Skill name and icon
- Parameter input fields with labels
- MP cost display
- Cancel button
- Cast button
- Tab navigation between fields
- Enter key submits
- Esc key cancels

### Animation Requirements

**Casting Animation Sequence**:
1. Skill icon enlarges and glows (0.2s)
2. Magic particle effects (0.3s)
3. MP bar decreases with step animation (0.3s)
4. Sound effect plays
5. AI starts processing indicator shows

---

## Dialogue Interaction Requirements

### Streaming Display

**Requirements**:
- Receive chunks via WebSocket
- Display with typewriter effect
- Render Markdown in real-time
- Syntax highlight code blocks
- Show cursor animation during typing
- Speed: 50ms per character (configurable)

### Message Format Support

**Must Support**:
- Plain text
- **Bold** and *italic*
- Inline `code`
- Code blocks with language specification
- Lists (ordered and unordered)
- Links (clickable)
- Images (if applicable)

### Code Block Requirements

**Requirements**:
- Language-specific syntax highlighting
- Line numbers (optional)
- Copy button appears on hover
- Copy success feedback ("✓ Copied", 2s duration)
- Proper indentation preserved
- Wrap long lines (configurable)

---

## State Change Requirements

### HP/MP/EXP Updates

**Animation Requirements**:
- Progress bar fills/empties smoothly (0.3-0.5s)
- Floating numbers show change amount
- Color indicates type (green=gain, red=loss)
- Sound effect for each type of change

**MP Consumption**:
```
Before: ⚡ ██████████ 60/100
After:  ⚡ █████░░░░░ 50/100
        ↑ Step animation, right to left
        ↑ Sound: "mp_down.wav"
```

**HP Recovery**:
```
Before: ❤️ ████░░░░░░ 40/100
After:  ❤️ ██████░░░░ 60/100
        ↑ Fill animation, left to right
        ↑ Sound: "heal.wav"
        ↑ Floating text: "+20 HP"
```

### Level Up Requirements

**Trigger**: When EXP reaches required amount for next level

**Animation Sequence**:
1. EXP bar fills to 100%
2. Flash effect (0.3s)
3. Level number changes with scale animation (0.5s)
4. Full-screen celebration modal appears
5. Display rewards (HP/MP increase, new skills, gold)
6. Sound: "level_up.wav"
7. Allow user to dismiss

**Modal Must Show**:
- Old level → New level
- HP max increase
- MP max increase
- Gold reward
- Newly unlocked skills (if any)
- "Awesome!" button to dismiss

---

## Special Scenario Requirements

### Connection Failure

**Requirements**:
- Clear error message
- Troubleshooting steps
- Retry button
- Link to setup guide
- Auto-retry every 5 seconds (max 10 attempts)

**Error Message Must Include**:
- What went wrong
- Possible causes
- Action steps to resolve
- Support link

### MP Exhausted

**Requirements**:
- Block new requests
- Show "Wizard needs rest" modal
- Display current MP and max MP
- Show recovery options:
  - Wait for auto-recovery (show countdown)
  - Complete daily quests
  - Use MP recovery items (if available)

**Recovery Rates**:
- Auto-recovery: 20 MP per hour
- Daily quest: 30-50 MP per quest
- MP potion: 50 MP instant

### First-Time User Onboarding

**Requirements**:
- 3-step guided tutorial
- Step 1: Enter player name
- Step 2: Choose character class
- Step 3: Try first skill
- Skippable at any step
- Never show again after completion

---

## Accessibility Requirements

### Keyboard Navigation

**Tab Order**:
1. Input box
2. Send button
3. Skill buttons (left to right)
4. Top bar buttons (notifications, settings, history)
5. Interactive elements in dialogue

**Keyboard Shortcuts**:
- Tab: Next element
- Shift+Tab: Previous element
- Enter: Send message / activate button
- Esc: Close modal / cancel operation
- Ctrl+H: Open history
- Ctrl+,: Open settings
- Ctrl+1~5: Use skill 1-5

### Screen Reader Support

**Requirements**:
- All interactive elements have aria-labels
- Status changes announced via aria-live
- Progress bars have text equivalents
- Buttons describe their action
- Forms have proper labeling

**Example**:
```html
<button aria-label="Code generation skill, costs 10 MP">
  ⚔️ Code Generation
</button>
```

### High Contrast Mode

**Requirements**:
- Detect system preference `prefers-contrast: high`
- Increase border widths to 3px
- Use pure black and white
- Maintain 7:1 contrast ratio
- Avoid relying solely on color

---

## Performance Requirements

### Response Time Targets

- Initial load: < 3 seconds
- Skill activation: < 100ms
- Message send: < 200ms
- First AI response chunk: < 2 seconds
- UI animation frame rate: 60 FPS

### Optimization Requirements

**Virtual Scrolling**:
- Only render visible messages (±5 buffer)
- Unload off-screen content
- Maintain scroll position on updates

**Lazy Loading**:
- Load images on demand
- Defer non-critical scripts
- Progressive enhancement

**Resource Management**:
- Limit stored messages to 1000
- Auto-archive old conversations
- Clear cache on low memory

---

## Data Format Requirements

### HP/MP/EXP Display Format

**Standard Format**:
```
❤️ HP: 80/100  ████████░░
⚡ MP: 60/100  ██████░░░░
⭐ EXP: 300/500 ███░░░░░░░
```

**Rules**:
- Format: `current/max` with numbers right-aligned
- Progress bar: 10 blocks for normal, 4 blocks for compact
- Filled: `█`, Empty: `░`
- Colors: HP=#E74C3C, MP=#3498DB, EXP=#F39C12

**Compact Format** (for companions):
```
HP: ███░ 75/100
MP: ██░░ 50/100
```

---

## Error Handling Requirements

### Error Message Standards

**Bad Example**:
```
Error: ENOENT: no such file or directory
```

**Good Example**:
```
┌──────────────────────────────┐
│  ⚠️  Cannot find claude-cli  │
│                              │
│  Please install:             │
│  $ npm install -g @anthropi…│
│                              │
│  [Setup Guide] [Retry]       │
└──────────────────────────────┘
```

**Requirements**:
- Use friendly language
- Explain what went wrong
- Provide actionable steps
- Offer help/documentation links
- Include retry mechanism

### Network Error Handling

**Requirements**:
- Detect disconnection immediately
- Show reconnection attempts progress
- Save unsent messages
- Auto-resume on reconnection
- Notify user of success/failure

---

## Summary

### Core Requirements Checklist

**✅ Functional**:
- Skill casting with MP management
- Real-time dialogue streaming
- State tracking and visualization
- Progress saving and recovery

**✅ User Experience**:
- Immediate visual/audio feedback
- Smooth animations
- Clear state indicators
- Intuitive navigation

**✅ Accessibility**:
- Keyboard support
- Screen reader compatible
- High contrast mode
- Flexible scaling

**✅ Performance**:
- Fast initial load
- Efficient rendering
- Resource optimization
- Smooth 60 FPS animations

**✅ Reliability**:
- Error recovery
- Network resilience
- Data persistence
- Graceful degradation

---

**Version**: v1.0
**Last Updated**: 2026-02-05
