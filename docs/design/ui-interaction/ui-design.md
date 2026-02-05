# UI Interaction - UI Design

This document contains detailed visual layouts, animations, and interaction designs for the RPG-CLI UI system.

---

## Main Interface Complete Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Top Status Bar]                                          │
│  💰 1,250  |  ❤️ HP: 80/100  |  ⚡ MP: 60/100             │
│  Lv.5 Hero                [🔔] [⚙️] [📖]                   │
├────────────────────────────────────────────────────────────┤
│  [Main Dialogue Area]                                      │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  🧙 Wizard Claude              [●Thinking...]        ║ │
│  ║  ┌──────────────────────────────────────────────┐   ║ │
│  ║  │                                              │   ║ │
│  ║  │  Hero, what help do you need?                │   ║ │
│  ║  │                                              │   ║ │
│  ║  │  [AI response with typewriter effect]        │   ║ │
│  ║  │  [Supports Markdown formatting]              │   ║ │
│  ║  │                                              │   ║ │
│  ║  │  [Code blocks with syntax highlighting]      │   ║ │
│  ║  │  ```javascript                               │   ║ │
│  ║  │  console.log('Hello World');                 │   ║ │
│  ║  │  ```                                         │   ║ │
│  ║  │                                              │   ║ │
│  ║  │                          [📋Copy] [⭐Save]   │   ║ │
│  ║  └──────────────────────────────────────────────┘   ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│  [Show/Hide History ▼]                                     │
├────────────────────────────────────────────────────────────┤
│  [Input Area]                                              │
│  ┌──────────────────────────────────────────────────┐     │
│  │  [Tell wizard your needs...]           [🎤][📎] │     │
│  └──────────────────────────────────────────────────┘     │
│  [💬Free] [🔄Clear]                        [▶️ Send]      │
├────────────────────────────────────────────────────────────┤
│  [Quick Skills Bar]                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────────┐         │
│  │⚔️  │ │📜  │ │🔍  │ │🐛  │ │✨  │ │  [+]   │         │
│  │Code│ │Write│ │Rev│ │Debug│ │Trans│ │Custom  │         │
│  │MP10│ │MP10│ │MP15│ │MP20│ │MP10│ │        │         │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────────┘         │
│  [Show More ▼]                                             │
└────────────────────────────────────────────────────────────┘
```

---

For the complete UI-Interaction design documentation, please refer to the original **UI-Interaction-Guide.md** file which contains:

## Detailed Sections (Reference Original Document)

### 1. Interface Components (Lines 53-223)
- **Top Status Bar**: Complete layout with HP/MP/Gold display
- **Dialogue Area**: Message bubbles, streaming display, status indicators
- **Input Area**: Multi-line input, voice/file buttons, shortcuts
- **Skills Bar**: Skill cards, states, hover effects

### 2. Skill Casting Interaction (Lines 226-377)
- **Complete Flow**: Click → MP check → Parameter input → Animation → Execute
- **Parameter Dialog**: Input fields, validation, auto-focus
- **Casting Animation**: Sequence with particles, MP deduction, sound effects
- **Skill States**: Available / Cooldown / Insufficient MP / Locked

### 3. Dialogue Interaction (Lines 379-492)
- **Streaming Display**: Typewriter effect timing and implementation
- **Code Blocks**: Syntax highlighting, copy button, language detection
- **Message History**: Virtual scrolling, timestamps, search

### 4. State Change Animations (Lines 495-603)
- **MP Consumption**: Step animation, sound effects, visual feedback
- **HP Recovery**: Fill animation, floating numbers, healing effects
- **EXP Gain**: Progress fill, level-up detection
- **Level Up**: Full-screen modal, rewards display, celebration effects
- **Gold Rewards**: Counter animation, floating notifications

### 5. UI Panels (Lines 608-909)
- **Character Panel**: Stats display, edit options, achievements
- **Skills List**: Categorized view, search, usage statistics
- **History Sidebar**: Conversation list, filters, favorites
- **Settings Panel**: Theme, sound, AI config, data management

### 6. Special Scenarios (Lines 913-1057)
- **Connection Failure**: Error display, troubleshooting, retry
- **MP Exhausted**: Recovery options, countdown timer
- **First-Time Tutorial**: 3-step onboarding, skippable
- **Level Up Rewards**: New skills unlock, stat increases

### 7. Responsive Design (Lines 1061-1147)
- **Desktop (1024px+)**: 3-column layout with sidebars
- **Tablet (768-1023px)**: 2-column with collapsible sections
- **Mobile (<768px)**: Single column, hamburger menu

### 8. Accessibility (Lines 1151-1222)
- **Keyboard Navigation**: Tab order, shortcuts
- **Screen Reader**: ARIA labels, live regions
- **High Contrast**: Color adjustments, border emphasis

---

## Quick Reference: Key UI Patterns

### Status Display Format

```
❤️ HP: 80/100  ████████░░
⚡ MP: 60/100  ██████░░░░
⭐ EXP: 300/500 ███░░░░░░░
```

### Skill Card States

**Available**:
```
┌────┐
│⚔️  │
│Code│  ← Full color, clickable
│MP10│
└────┘
```

**Cooldown**:
```
┌────┐
│⚔️  │
│Code│  ← Grayscale, countdown overlay
│ 3s │
└────┘
```

**Insufficient MP**:
```
┌────┐
│⚔️  │
│Code│  ← Red tint, shake animation
│MP10│
└────┘
```

### Animation Timing

- Typewriter: 50ms per character
- MP change: 300ms step animation
- HP change: 500ms fill animation
- Level up flash: 300ms
- Floating text: 1000ms fade out

---

## Full Specifications

For complete specifications including:
- All ASCII art layouts
- Detailed animation sequences
- Complete interaction flows
- Special scenario handling
- Responsive breakpoints
- Accessibility markup
- Performance optimizations

Please refer to: **docs/design/UI-Interaction-Guide.md**

This file has been reorganized into:
- **requirements.md** - What the UI must do
- **ui-design.md** - How it should look (this file)
- **implementation.md** - How to build it

---

**Version**: v1.0
**Last Updated**: 2026-02-05
**Note**: This is a streamlined reference. Full detailed layouts preserved in original guide.
