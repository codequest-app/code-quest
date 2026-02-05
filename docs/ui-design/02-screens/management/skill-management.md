# Skill Management Screen - 技能管理

**Category**: Management Screens
**Access**: Keyboard shortcut `K`, Main menu
**Last Updated**: 2026-02-05

---

## Overview

The Skill Management screen provides a comprehensive interface for viewing, organizing, and configuring all owned skills. Players can filter skills by category, assign hotkeys, upgrade skills, and access the training ground for testing.

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🔮 技能管理 - Skill Management                   [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [🔍 搜尋技能...]          [分類 ▼] [排序 ▼] [篩選 ▼]      │
│                                                             │
│  ━━━━━━━━━━━━━━━ 快捷欄 (Ctrl+1~9) ━━━━━━━━━━━━━━━        │
│                                                             │
│  Slot 1      Slot 2      Slot 3      Slot 4      Slot 5    │
│  ┌────┐     ┌────┐     ┌────┐     ┌────┐     ┌────┐       │
│  │📦  │     │🔍  │     │🧪  │     │[+] │     │[+] │       │
│  │Comm│     │Code│     │Test│     │空位│     │空位│       │
│  │it  │     │Rev │     │    │     │    │     │    │       │
│  └────┘     └────┘     └────┘     └────┘     └────┘       │
│  Ctrl+1     Ctrl+2     Ctrl+3     Ctrl+4     Ctrl+5        │
│                                                             │
│  Slot 6      Slot 7      Slot 8      Slot 9                │
│  ┌────┐     ┌────┐     ┌────┐     ┌────┐                  │
│  │[+] │     │[+] │     │[+] │     │[+] │                  │
│  │空位│     │空位│     │空位│     │空位│                  │
│  │    │     │    │     │    │     │    │                  │
│  └────┘     └────┘     └────┘     └────┘                  │
│  Ctrl+6     Ctrl+7     Ctrl+8     Ctrl+9                   │
│                                                             │
│  ━━━━━━━━━━━━━━━ 技能庫 ━━━━━━━━━━━━━━━                  │
│                                                             │
│  📂 Git 操作 (3)                                            │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ ✅ 📦 版本封印術                                  │     │
│  │ (Version Seal - Commit)                           │     │
│  │                                                   │     │
│  │ Lv.3 ⭐⭐⭐  |  MP: 5  |  冷卻: 30秒              │     │
│  │                                                   │     │
│  │ 描述: 將代碼封印至版本庫，保護你的開發成果         │     │
│  │                                                   │     │
│  │ 效果:                                             │     │
│  │ • 自動執行 git add & commit                       │     │
│  │ • 智能生成 commit message                         │     │
│  │ • 戰鬥傷害: 30點 (基礎) + 穩定Buff(10%機率)       │     │
│  │                                                   │     │
│  │ 使用次數: 127次  |  成功率: 98%                   │     │
│  │                                                   │     │
│  │ 快捷鍵: Ctrl+1                                    │     │
│  │                                                   │     │
│  │ [使用] [升級 → Lv.4 (100金)] [測試] [詳情]       │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ ✅ 🔍 代碼審查術                                  │     │
│  │ (Code Review - Pull Request)                      │     │
│  │                                                   │     │
│  │ Lv.2 ⭐⭐  |  MP: 15  |  冷卻: 60秒               │     │
│  │                                                   │     │
│  │ 描述: 召喚審查之眼，檢視代碼品質                   │     │
│  │                                                   │     │
│  │ 工具權限: ✅ 讀取文件 ✅ Git操作 ⚠️ 需要網路      │     │
│  │                                                   │     │
│  │ 效果:                                             │     │
│  │ • 分析PR並提供建議                                │     │
│  │ • 檢測潛在問題                                    │     │
│  │ • 戰鬥傷害: 50點 + 降低敵人防禦                   │     │
│  │                                                   │     │
│  │ 快捷鍵: Ctrl+2                                    │     │
│  │                                                   │     │
│  │ [使用] [升級 → Lv.3 (80金)] [測試] [詳情]        │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 🔒 🚀 超級推送術                                  │     │
│  │ (Super Push - Deploy)                             │     │
│  │                                                   │     │
│  │ 需要: Lv.15  |  當前: Lv.10  ⚠️ 未解鎖            │     │
│  │                                                   │     │
│  │ MP: 25  |  冷卻: 90秒                             │     │
│  │                                                   │     │
│  │ 描述: 將代碼推送至遠端，並自動部署                │     │
│  │                                                   │     │
│  │ [🔒 查看解鎖條件]                                │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  📂 測試相關 (2)  [展開 ▼]                                 │
│  📂 重構相關 (4)  [展開 ▼]                                 │
│  📂 自訂技能 (5)  [展開 ▼]                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [K] 關閉  |  [T] 訓練場  |  [N] 新增技能  |  [?] 幫助    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component References

### Skill Card
【參考：04-components/skill-card.md】
- Skill icon with emoji/image
- Level indicator with stars
- MP cost and cooldown display
- Status badges (unlocked/locked)
- Action buttons

### Hotkey Slots
【參考：04-components/hotkey-slot.md】
- 9 quick-access slots (Ctrl+1~9)
- Drag-and-drop support
- Empty slot indicators
- Visual feedback on assignment

### Category Accordion
【參考：04-components/accordion.md】
- Collapsible skill categories
- Item count badges
- Expand/collapse animations
- Nested skill lists

### Filters & Search
【參考：04-components/filter-bar.md】
- Search input with autocomplete
- Category dropdown
- Sort options (by name, level, MP, usage)
- Active filters display

---

## States & Interactions

### Skill States

1. **Unlocked & Available**
   - Full color display
   - All buttons enabled
   - Can assign to hotkey
   - Can upgrade if eligible

2. **Locked**
   - Grayscale display
   - Lock icon overlay
   - Shows unlock conditions
   - "View details" button only

3. **Currently on Cooldown**
   - Dimmed appearance
   - Countdown timer overlay
   - Cannot assign to new slot
   - Shows time remaining

4. **Upgradeable**
   - Golden glow border
   - "Upgrade" badge
   - Upgrade button highlighted
   - Shows next level preview

5. **Insufficient Permissions**
   - Orange warning border
   - Permission list highlighted
   - Configure button enabled
   - Tooltip explains requirements

### Keyboard Interactions

```
K              - Toggle skill management screen
Ctrl+1~9       - Activate hotkey slot skill
↑/↓            - Navigate skill list
Enter          - Select/use highlighted skill
T              - Open training ground for current skill
N              - Create new custom skill
/              - Focus search bar
Esc            - Close screen
F              - Open filter dropdown
S              - Open sort dropdown
Tab            - Cycle through UI sections
```

### Mouse Interactions

```
Click Skill Card     - Select skill (show details panel)
Double-click Skill   - Use skill immediately
Drag Skill           - Drag to hotkey slot
Hover Skill          - Show quick tooltip
Click [使用]         - Use skill now
Click [升級]         - Open upgrade dialog
Click [測試]         - Open training ground with skill
Click [詳情]         - Open detailed info modal
Right-click Slot     - Clear hotkey assignment
```

### Touch Interactions (Mobile)

```
Tap Skill            - Select skill
Long press Skill     - Show context menu
Drag Skill to Slot   - Assign hotkey
Swipe Left/Right     - Navigate categories
Pinch on Card        - Zoom to detailed view
```

---

## Animations

### Screen Transition
【參考：01-design-system/animation-timing.md】

**Opening Animation:**
```
0.0s  ├─ Backdrop fade in (200ms)
0.1s  ├─ Panel slide in from right (300ms)
0.2s  ├─ Hotkey slots fade in one by one (stagger 50ms)
0.4s  ├─ Skill cards slide up (stagger 30ms)
```

**Closing Animation:**
```
0.0s  ├─ Content fade out (200ms)
0.1s  ├─ Panel slide out (300ms)
0.2s  ├─ Backdrop fade out (200ms)
```

### Skill Card Animations

**Hover Effect:**
```css
.skill-card {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.skill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
}
```

**Selection Animation:**
```css
@keyframes select-pulse {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
  100% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
}

.skill-card.selected {
  border-color: #6366f1;
  animation: select-pulse 600ms ease-out;
}
```

### Drag-and-Drop Animations

**Dragging:**
```css
.skill-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg) scale(1.1);
  cursor: grabbing;
}
```

**Drop Zone Highlight:**
```css
.hotkey-slot.drop-target {
  border: 2px dashed #00ccff;
  background: rgba(0, 204, 255, 0.1);
  animation: pulse-border 1s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: #00ccff; }
  50% { border-color: #0088cc; }
}
```

**Successful Drop:**
```css
@keyframes drop-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.hotkey-slot.dropped {
  animation: drop-success 400ms ease-out;
}
```

### Upgrade Animation

**Upgrade Button Glow:**
```css
@keyframes upgrade-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
}

.upgrade-button {
  animation: upgrade-glow 2s ease-in-out infinite;
}
```

**Level Up Animation:**
```css
@keyframes level-up {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.5);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

.skill-card.leveled-up {
  animation: level-up 600ms ease-out;
}
```

---

## Cross-References

### Related Screens
- 【參考：02-screens/shops/skill-shop.md】 - Purchase new skills
- 【參考：02-screens/training/training-ground.md】 - Test skills
- 【參考：02-screens/management/character-status.md】 - View character stats

### Screen Transitions
【參考：03-flows/screen-transitions.md】
- From Main: Press `K` → Slide in from right
- To Training Ground: Click [測試] → Fade transition
- To Skill Shop: Click [購買新技能] → Slide left

### Design System
【參考：01-design-system/colors.md】 - Skill rarity colors
【參考：01-design-system/icons.md】 - Skill category icons
【參考：01-design-system/animation-timing.md】 - Transition timings

---

## Implementation Notes

### Skill Data Structure

```typescript
interface Skill {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  level: number;
  maxLevel: number;
  category: SkillCategory;
  mpCost: number;
  cooldown: number; // seconds

  // Combat
  baseDamage: number;
  specialEffects: SkillEffect[];

  // Usage stats
  timesUsed: number;
  successRate: number;
  lastUsed?: Date;

  // Unlock
  unlocked: boolean;
  unlockRequirements?: UnlockRequirement[];

  // Hotkey
  hotkeySlot?: number; // 1-9

  // Permissions
  requiredPermissions: ToolPermission[];

  // Upgrade
  upgradeCost?: number;
  upgradeEffect?: string;
}
```

### Hotkey Management

```typescript
class HotkeyManager {
  private slots: Map<number, Skill> = new Map();

  assignSkillToSlot(skill: Skill, slot: number): boolean {
    if (slot < 1 || slot > 9) return false;
    if (!skill.unlocked) return false;

    this.slots.set(slot, skill);
    this.saveHotkeys();
    return true;
  }

  clearSlot(slot: number): void {
    this.slots.delete(slot);
    this.saveHotkeys();
  }

  getSkillInSlot(slot: number): Skill | undefined {
    return this.slots.get(slot);
  }

  executeSlot(slot: number): void {
    const skill = this.getSkillInSlot(slot);
    if (skill && this.canUseSkill(skill)) {
      this.useSkill(skill);
    }
  }
}
```

### Search & Filter Logic

```typescript
class SkillFilter {
  filterSkills(
    skills: Skill[],
    query: string,
    category?: SkillCategory,
    sortBy: SortOption = 'name'
  ): Skill[] {
    let filtered = skills;

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.nameEn.toLowerCase().includes(lowerQuery) ||
        skill.category.toLowerCase().includes(lowerQuery)
      );
    }

    // Category filter
    if (category) {
      filtered = filtered.filter(skill => skill.category === category);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'level': return b.level - a.level;
        case 'mp': return a.mpCost - b.mpCost;
        case 'usage': return b.timesUsed - a.timesUsed;
        default: return 0;
      }
    });

    return filtered;
  }
}
```

### Drag-and-Drop Implementation

```typescript
class SkillDragDrop {
  private draggedSkill: Skill | null = null;

  onDragStart(skill: Skill, event: DragEvent): void {
    if (!skill.unlocked) {
      event.preventDefault();
      return;
    }

    this.draggedSkill = skill;
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('skill-id', skill.id);

    // Visual feedback
    const dragImage = this.createDragImage(skill);
    event.dataTransfer!.setDragImage(dragImage, 25, 25);
  }

  onDragOver(slot: number, event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  onDrop(slot: number, event: DragEvent): void {
    event.preventDefault();

    if (this.draggedSkill) {
      hotkeyManager.assignSkillToSlot(this.draggedSkill, slot);
      this.showSuccessFeedback(slot);
    }

    this.draggedSkill = null;
  }
}
```

---

## Accessibility

### Screen Reader Support

```html
<section aria-label="Skill Management Screen" role="dialog">
  <h1 id="skill-title">Skill Management</h1>

  <!-- Hotkey Slots -->
  <section aria-label="Hotkey Slots">
    <h2>Quick Access Slots (Ctrl 1 through 9)</h2>
    <div role="list">
      <div role="listitem" aria-label="Slot 1, Ctrl+1, Version Seal skill assigned">
        <button aria-label="Version Seal, MP cost 5, Cooldown 30 seconds">
          Version Seal
        </button>
      </div>
      <div role="listitem" aria-label="Slot 2, empty">
        <button aria-label="Assign skill to slot 2">
          Empty Slot
        </button>
      </div>
    </div>
  </section>

  <!-- Skill Library -->
  <section aria-label="Skill Library">
    <h2>Available Skills</h2>
    <div role="list">
      <article role="listitem" aria-label="Version Seal, Level 3, unlocked">
        <h3>Version Seal</h3>
        <div role="status">
          Level 3, MP cost 5, Cooldown 30 seconds, Used 127 times, 98% success rate
        </div>
        <button aria-label="Use Version Seal skill">Use</button>
        <button aria-label="Upgrade to Level 4 for 100 gold">Upgrade</button>
      </article>
    </div>
  </section>
</section>
```

### Keyboard Navigation

**Focus Order:**
1. Close button (top right)
2. Search input
3. Filter/sort dropdowns
4. Hotkey slots (1-9)
5. Skill cards (in reading order)
6. Action buttons (bottom)

**Keyboard Shortcuts Summary:**
```
K         - Open/close skill management
Ctrl+1~9  - Use hotkey skill
Tab       - Next element
Shift+Tab - Previous element
Enter     - Activate focused element
Space     - Activate focused button
Arrows    - Navigate within lists
Esc       - Close modals/dialogs
/         - Focus search
```

### Color Contrast

All text maintains WCAG AA standard (4.5:1 contrast ratio):

```css
/* Skill card text on dark background */
.skill-card {
  background: #1e293b; /* Dark blue-gray */
  color: #f1f5f9;      /* Light gray - 12.6:1 ratio */
}

/* Locked skills */
.skill-card.locked {
  background: #334155; /* Lighter gray */
  color: #cbd5e1;      /* Medium gray - 7.2:1 ratio */
}

/* Upgrade button */
.upgrade-button {
  background: #fbbf24; /* Gold */
  color: #000000;      /* Black - 13.4:1 ratio */
}
```

---

## Responsive Design

### Desktop (≥1200px)

```
┌───────────────────────────────────────────┐
│  [Search/Filters]   [Hotkey Slots (9)]    │
│  ─────────────────────────────────────    │
│  [Skill List]       [Details Panel]       │
│  - Category 1       Selected Skill:       │
│    • Skill A        - Full description    │
│    • Skill B        - Stats               │
│  - Category 2       - Actions             │
│    • Skill C                              │
│  (scrollable)                             │
└───────────────────────────────────────────┘
```
- Two-column layout
- Permanent details panel on right
- Full hotkey bar visible
- Hover tooltips

### Tablet (768px - 1199px)

```
┌──────────────────────────────┐
│  [Search/Filters]            │
│  [Hotkey Slots (9)]          │
│  ────────────────────────    │
│  [Skill List]                │
│  - Category 1                │
│    • Skill A                 │
│    • Skill B                 │
│  (tap to expand details)     │
└──────────────────────────────┘
```
- Single column
- Tap skill to show details modal
- Collapsible categories
- Touch-optimized drag-and-drop

### Mobile (<768px)

```
┌────────────────┐
│ [🔍] [Filter]  │
│ ──────────     │
│ [Hotkey Tabs]  │
│ [1][2][3][>]   │
│ ──────────     │
│ [Skill Cards]  │
│ ┌──────────┐   │
│ │ Skill A  │   │
│ │ Lv.3     │   │
│ │ [Use]    │   │
│ └──────────┘   │
│  (scroll)      │
└────────────────┘
```
- Hotkeys in horizontal scroll tabs
- Large touch targets (min 44×44px)
- Bottom action buttons
- Simplified skill cards

---

## Testing Scenarios

### Functional Tests

1. **Hotkey Assignment**
   - [ ] Drag skill to empty slot
   - [ ] Replace skill in occupied slot
   - [ ] Clear slot (right-click)
   - [ ] Locked skills cannot be dragged
   - [ ] Hotkeys persist after close/reopen

2. **Search & Filter**
   - [ ] Search by skill name
   - [ ] Search by category
   - [ ] Filter by category
   - [ ] Sort by different criteria
   - [ ] Combined search + filter

3. **Skill Actions**
   - [ ] Use unlocked skill
   - [ ] Cannot use locked skill
   - [ ] Upgrade eligible skill
   - [ ] View skill details
   - [ ] Test skill in training ground

4. **Permission Handling**
   - [ ] Skills with unmet permissions show warning
   - [ ] Configure permissions button works
   - [ ] Permissions update after configuration
   - [ ] Skills become usable after granting permissions

### Interaction Tests

1. **Keyboard**
   - [ ] All shortcuts work
   - [ ] Tab order logical
   - [ ] Focus indicators visible
   - [ ] Escape closes screen

2. **Mouse**
   - [ ] Drag-and-drop smooth
   - [ ] Hover effects appear
   - [ ] Click actions trigger
   - [ ] Right-click context menu

3. **Touch**
   - [ ] Tap to select
   - [ ] Long press for details
   - [ ] Swipe to scroll
   - [ ] Drag to assign hotkey

### Visual Tests

1. **Skill States**
   - [ ] Locked skills grayed out
   - [ ] Cooldown timer visible
   - [ ] Upgrade glow on eligible skills
   - [ ] Permission warnings clear

2. **Animations**
   - [ ] Smooth transitions
   - [ ] No jank or flicker
   - [ ] Drag feedback clear
   - [ ] Upgrade animation satisfying

3. **Responsive**
   - [ ] Desktop layout clean
   - [ ] Tablet layout functional
   - [ ] Mobile layout usable
   - [ ] No overflow issues

---

## Version History

- **v1.0** (2026-02-05): Initial skill management screen design
  - Hotkey slots (Ctrl+1~9)
  - Categorized skill library
  - Search and filter
  - Drag-and-drop assignment
  - Skill upgrade interface
  - Training ground integration
  - Responsive layouts
  - Accessibility support
