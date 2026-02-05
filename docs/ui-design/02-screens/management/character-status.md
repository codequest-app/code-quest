# Character Status Screen - 角色狀態

**Category**: Management Screens
**Access**: Keyboard shortcut `C`, Main menu
**Last Updated**: 2026-02-05

---

## Overview

The Character Status screen displays comprehensive player information including stats, attributes, equipment, buffs/debuffs, and achievements. It serves as the central hub for viewing character progression and current status.

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────┐
│  👤 角色狀態 - Character Status                   [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │             │   CodeMaster                               │
│  │     👤      │   Lv.10 開發者                              │
│  │   (Avatar)  │                                            │
│  │             │   🏆 "Bug終結者"                            │
│  └─────────────┘                                            │
│                                                             │
│  ━━━━━━━━━━━━━━━ 基本資訊 ━━━━━━━━━━━━━━━                │
│                                                             │
│  HP: ████████░░ 85/100                                     │
│      (生命值)                                               │
│                                                             │
│  MP: ██████░░░░ 60/100                                     │
│      (魔力值)                                               │
│                                                             │
│  EXP: ███████░░░ 1,750/2,500                               │
│       (經驗值) 距離 Lv.11 還需 750 EXP                      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 屬性 ━━━━━━━━━━━━━━━                    │
│                                                             │
│  ⚔️  攻擊力:  45  (+10 來自裝備)                           │
│  🛡️  防禦力:  30  (+5 來自Buff)                            │
│  ✨  魔力:    50                                            │
│  ⚡  速度:    35                                            │
│  🍀  幸運值:  20                                            │
│                                                             │
│  ━━━━━━━━━━━━━━━ 裝備欄 ━━━━━━━━━━━━━━━                  │
│                                                             │
│  🎩 頭部: [Code思維帽] (+5 魔力)                           │
│  👕 身體: [重構護甲] (+10 防禦)                            │
│  🤲 武器: [Bug終結劍] (+10 攻擊)                           │
│  💍 飾品: [經驗之戒] (+10% EXP獲得)                        │
│                                                             │
│  ━━━━━━━━━━━━━━━ 狀態效果 ━━━━━━━━━━━━━━━                │
│                                                             │
│  ✅ Buff (增益效果)                                        │
│     🛡️ [守護之盾] 防禦 +5  (剩餘 3 回合)                  │
│     ⚡ [加速] 速度 +10  (剩餘 2 回合)                      │
│                                                             │
│  ⚠️ Debuff (減益效果)                                      │
│     (無)                                                    │
│                                                             │
│  ━━━━━━━━━━━━━━━ 成就徽章 ━━━━━━━━━━━━━━━                │
│                                                             │
│  ✅ 初次擊敗      ✅ 連勝達人      ✅ 經驗獵人              │
│  ✅ 技能大師      🔒 傳說冒險者    🔒 完美戰鬥              │
│                                                             │
│  已獲得: 15/50 個成就                                       │
│  [查看全部成就]                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [C] 關閉  |  [E] 編輯名稱  |  [A] 成就詳情  |  [?] 幫助   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component References

### Status Bars
【參考：04-components/status-bar.md】
- HP bar with gradient (green → yellow → red)
- MP bar (cyan color)
- EXP bar with level-up animation
- Smooth fill animations (500ms)

### Avatar Display
【參考：04-components/avatar.md】
- Emoji or custom image support
- Level badge overlay
- Editable on click
- Floating animation effect

### Stat Display
【參考：04-components/stat-display.md】
- Icon + Label + Value format
- Bonus indicators (+X from equipment/buff)
- Tooltip on hover showing source

### Badge Grid
【參考：04-components/badge-grid.md】
- Grid layout for achievements
- Locked/unlocked states
- Hover shows achievement details
- Click to view full achievement screen

---

## States & Interactions

### Display States

1. **Normal State**
   - All stats visible
   - Active buffs/debuffs shown
   - Equipment slots displayed

2. **Low HP Warning (HP < 20%)**
   - HP bar flashes red
   - Warning icon appears
   - Pulsing animation

3. **Near Level-Up (EXP > 90%)**
   - EXP bar glows golden
   - "Almost there!" indicator
   - Subtle sparkle animation

4. **Buff/Debuff Active**
   - Colored border around status section
   - Animation on buff/debuff icons
   - Turn countdown visible

### Keyboard Interactions

```
C         - Toggle character status screen
E         - Edit character name/title
A         - View all achievements
↑/↓       - Scroll through status
Tab       - Cycle through sections
Esc       - Close screen
?         - Show help tooltip
```

### Mouse Interactions

```
Click Avatar       - Edit avatar
Hover Stat         - Show detailed tooltip
Click Equipment    - View equipment details
Click Badge        - View achievement details
Click Buff/Debuff  - Show effect details
```

### Touch Interactions (Mobile)

```
Tap Avatar         - Edit dialog
Long press Stat    - Detailed view
Swipe Up/Down      - Scroll content
Pinch to zoom      - Enlarge text (accessibility)
```

---

## Animations

### Screen Transition
【參考：01-design-system/animation-timing.md】

**Opening Animation:**
```
0.0s  ├─ Backdrop fade in (opacity 0 → 0.8, 200ms)
0.1s  ├─ Panel slide in from right (translateX 100% → 0, 300ms)
0.2s  ├─ Content fade in (opacity 0 → 1, 200ms)
0.3s  ├─ Stats count up animation (300ms)
```

**Closing Animation:**
```
0.0s  ├─ Content fade out (200ms)
0.1s  ├─ Panel slide out to right (300ms)
0.2s  ├─ Backdrop fade out (200ms)
```

### Status Bar Animations

**HP/MP Change:**
```css
.status-bar-fill {
  transition: width 500ms ease-out;
}

.status-bar-fill.decrease {
  transition: width 300ms ease-in;
}
```

**EXP Gain:**
```css
@keyframes exp-fill {
  0% { width: var(--old-width); }
  100% { width: var(--new-width); }
}

.exp-bar {
  animation: exp-fill 800ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Buff/Debuff Indicators

**Active Buff Animation:**
```css
@keyframes buff-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.buff-active {
  animation: buff-pulse 2s ease-in-out infinite;
}
```

**Expiring Soon (1 turn left):**
```css
@keyframes buff-expire {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.buff-expiring {
  animation: buff-expire 1s ease-in-out infinite;
  border: 2px dashed #ff9800;
}
```

---

## Cross-References

### Related Screens
- 【參考：02-screens/management/skill-management.md】 - View and manage skills
- 【參考：02-screens/management/inventory.md】 - Manage equipment and items
- 【參考：02-screens/management/settings.md】 - Configure character display preferences

### Screen Transitions
【參考：03-flows/screen-transitions.md】
- From Main Screen: Press `C` → Slide in from right
- To Skill Screen: Press `K` → Slide transition
- To Inventory: Press `I` → Slide transition

### Design System
【參考：01-design-system/colors.md】 - Color palette for stats
【參考：01-design-system/typography.md】 - Font sizes and hierarchy
【參考：01-design-system/spacing.md】 - Padding and margins

---

## Implementation Notes

### Data Display Priority

1. **Critical Information** (Always visible):
   - Current HP/MP
   - Level and EXP progress
   - Active debuffs (combat-critical)

2. **Secondary Information** (Scrollable):
   - Detailed attributes
   - Equipment details
   - Achievement progress

3. **Optional Information** (Show on demand):
   - Full achievement list
   - Stat breakdown tooltips
   - Equipment lore/description

### Real-Time Updates

The character status screen should update in real-time when:
- HP/MP changes during actions
- Buffs/debuffs are applied or expire
- Experience is gained
- Level up occurs
- Equipment is changed

Use event-driven updates to maintain synchronization with game state.

### Performance Considerations

```javascript
// Throttle stat updates to avoid excessive re-renders
const throttledStatUpdate = throttle((stats) => {
  updateCharacterDisplay(stats);
}, 100);

// Batch buff/debuff updates
const buffUpdates = [];
const flushBuffUpdates = () => {
  if (buffUpdates.length > 0) {
    renderBuffs(buffUpdates);
    buffUpdates.length = 0;
  }
};
```

---

## Accessibility

### Screen Reader Support

```html
<section aria-label="Character Status Screen" role="dialog">
  <h1 id="character-name">CodeMaster Level 10</h1>

  <div role="status" aria-live="polite" aria-label="Character Stats">
    <div aria-label="Health Points">HP: 85 out of 100</div>
    <div aria-label="Magic Points">MP: 60 out of 100</div>
    <div aria-label="Experience">EXP: 1750 out of 2500, 750 needed for next level</div>
  </div>

  <section aria-label="Active Effects">
    <h2>Buffs</h2>
    <ul>
      <li>Guardian Shield: Defense plus 5, 3 turns remaining</li>
      <li>Speed Boost: Speed plus 10, 2 turns remaining</li>
    </ul>
  </section>
</section>
```

### Keyboard Navigation

**Tab Order:**
1. Close button
2. Avatar (editable)
3. Status sections (scrollable)
4. Equipment slots
5. Buff/Debuff items
6. Achievement badges
7. Action buttons (bottom)

**Focus Indicators:**
```css
.character-status *:focus {
  outline: 2px solid #00ccff;
  outline-offset: 2px;
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .character-status {
    background: #000;
    color: #fff;
    border: 3px solid #fff;
  }

  .status-bar {
    border: 2px solid #fff;
  }

  .buff-active {
    border: 3px solid #0f0;
  }

  .debuff-active {
    border: 3px solid #f00;
  }
}
```

---

## Responsive Design

### Desktop (≥1200px)

```
┌─────────────────────────────────────────┐
│  [Avatar]  [Stats]     [Equipment]      │
│            [Attributes]                 │
│            [Buffs/Debuffs]              │
│            [Achievements Grid]          │
└─────────────────────────────────────────┘
```
- Three-column layout
- Full achievement grid visible
- Hover tooltips enabled

### Tablet (768px - 1199px)

```
┌───────────────────────────┐
│  [Avatar + Name]          │
│  [Stats]                  │
│  [Attributes]             │
│  [Equipment] [Effects]    │
│  [Achievements (scroll)]  │
└───────────────────────────┘
```
- Two-column for equipment/effects
- Achievements in horizontal scroll
- Touch-optimized buttons

### Mobile (<768px)

```
┌─────────────┐
│ [Avatar]    │
│ [Name]      │
│ ───────     │
│ [Stats]     │
│ [Attrs]     │
│ [Equip]     │
│ [Effects]   │
│ [Badges]    │
│  (scroll)   │
└─────────────┘
```
- Single column, vertical scroll
- Collapsible sections
- Larger touch targets (min 44×44px)
- Sticky header with close button

---

## Testing Scenarios

### Visual Tests

1. **Stats Display**
   - [ ] All stats visible and readable
   - [ ] Progress bars animate smoothly
   - [ ] Buff/debuff icons clear
   - [ ] Equipment slots properly aligned

2. **State Changes**
   - [ ] Low HP warning appears at <20%
   - [ ] Near level-up glow at >90% EXP
   - [ ] Buff expiration animation
   - [ ] Stat changes reflect immediately

3. **Responsive Layout**
   - [ ] Desktop layout clean
   - [ ] Tablet layout functional
   - [ ] Mobile scrolling smooth
   - [ ] No content overflow

### Interaction Tests

1. **Keyboard Navigation**
   - [ ] All elements focusable
   - [ ] Tab order logical
   - [ ] Shortcuts work (C, E, A, Esc)
   - [ ] Focus indicators visible

2. **Mouse Interactions**
   - [ ] Hover tooltips appear
   - [ ] Click events trigger
   - [ ] Drag-to-scroll works
   - [ ] Cursor changes appropriately

3. **Touch Interactions**
   - [ ] Tap targets adequate size
   - [ ] Swipe scrolling smooth
   - [ ] Long press shows details
   - [ ] No accidental clicks

### Accessibility Tests

1. **Screen Reader**
   - [ ] All content announced
   - [ ] Navigation clear
   - [ ] Live updates announced
   - [ ] Buttons labeled

2. **Keyboard Only**
   - [ ] All features accessible
   - [ ] Focus trapped in modal
   - [ ] Escape closes screen
   - [ ] No keyboard traps

3. **Visual Impairment**
   - [ ] High contrast works
   - [ ] Text scalable
   - [ ] Colors not sole indicator
   - [ ] Icons have labels

---

## Version History

- **v1.0** (2026-02-05): Initial character status screen design
  - Basic stats display
  - Equipment slots
  - Buff/debuff indicators
  - Achievement badges
  - Responsive layouts
  - Accessibility support
