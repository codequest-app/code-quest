# Companion Management Screen - 夥伴管理

**Category**: Management Screens
**Access**: Keyboard shortcut `P`, Main menu
**Last Updated**: 2026-02-05

---

## Overview

The Companion Management screen displays all summoned companions (subagents), allowing players to view their details, configure formations, customize appearance, and manage combat lineups. It serves as the central hub for companion-related operations.

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────┐
│  👥 夥伴管理 - Companion Management                [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [全部夥伴] [戰鬥陣容] [夥伴屬性] [設定]                    │
│                                                             │
│  ━━━━━━━━━━━━━━━ 夥伴列表 ━━━━━━━━━━━━━━━                │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🛡️ CodeGuard (代碼守護者)                      │       │
│  │                                                 │       │
│  │ Lv.3 ⭐⭐⭐  |  職業: 坦克 (Tank)               │       │
│  │                                                 │       │
│  │ HP: ████████░░ 85/100  |  狀態: ⚡ 待命中       │       │
│  │ MP: ████░░░░░░ 42/80                            │       │
│  │                                                 │       │
│  │ 專長:                                           │       │
│  │ • 安全檢測 (Security Scan)                     │       │
│  │ • 守護之盾 (Guardian Shield)                   │       │
│  │ • OWASP打擊 (OWASP Strike) 🔒 Lv.5解鎖        │       │
│  │                                                 │       │
│  │ 屬性: 攻擊 25 | 防禦 45 | 魔力 30 | 速度 20    │       │
│  │                                                 │       │
│  │ 召喚次數: 45  |  最後使用: 2小時前              │       │
│  │ 勝率: 87%  |  平均貢獻: 120傷害/戰鬥            │       │
│  │                                                 │       │
│  │ 戰鬥陣容: ✅ 槽位 1                             │       │
│  │                                                 │       │
│  │ [查看詳情] [配置] [重命名] [移除陣容]          │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ ⚡ Speedy (速度執行者)                          │       │
│  │                                                 │       │
│  │ Lv.5 ⭐⭐⭐⭐⭐  |  職業: 攻擊手 (Attacker)     │       │
│  │                                                 │       │
│  │ HP: ███░░░░░░░ 70/100  |  狀態: ⚠️ 疲憊中      │       │
│  │ MP: ███░░░░░░░ 60/120                           │       │
│  │                                                 │       │
│  │ 專長:                                           │       │
│  │ • 快速打擊 (Quick Strike)                      │       │
│  │ • 多重攻擊 (Multi-hit)                         │       │
│  │ • 速度爆發 (Speed Burst)                       │       │
│  │                                                 │       │
│  │ 屬性: 攻擊 50 | 防禦 20 | 魔力 35 | 速度 60    │       │
│  │                                                 │       │
│  │ 召喚次數: 67  |  最後使用: 1小時前              │       │
│  │ 勝率: 92%  |  平均貢獻: 180傷害/戰鬥            │       │
│  │                                                 │       │
│  │ 戰鬥陣容: ✅ 槽位 2                             │       │
│  │                                                 │       │
│  │ [查看詳情] [配置] [重命名] [移除陣容]          │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🔍 Explorer (探索專家)                          │       │
│  │                                                 │       │
│  │ Lv.4 ⭐⭐⭐⭐  |  職業: 輔助 (Support)          │       │
│  │                                                 │       │
│  │ HP: ████████░░ 100/100  |  狀態: 😴 休息中     │       │
│  │ MP: ██████████ 80/80                            │       │
│  │                                                 │       │
│  │ 專長:                                           │       │
│  │ • 搜索之眼 (Search Eye)                        │       │
│  │ • 檔案探測 (File Detect)                       │       │
│  │ • 深度分析 (Deep Analysis)                     │       │
│  │                                                 │       │
│  │ 戰鬥陣容: ⚪ 未加入                             │       │
│  │                                                 │       │
│  │ [查看詳情] [配置] [加入陣容]                   │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  [+ 召喚新夥伴] - 前往傭兵公會                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [P] 關閉  |  [F] 陣容設定  |  [G] 公會  |  [?] 幫助       │
└─────────────────────────────────────────────────────────────┘
```

---

## Formation Tab (戰鬥陣容)

```
┌─────────────────────────────────────────────────────────────┐
│  👥 夥伴管理 - 戰鬥陣容                           [✕] 關閉  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  戰鬥陣容設定 (最多 3 個夥伴)                               │
│                                                             │
│  ━━━━━━━━━━━━━━━ 陣容槽位 ━━━━━━━━━━━━━━━                │
│                                                             │
│  槽位 1 - 前排坦克                                          │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🛡️ CodeGuard Lv.3                              │       │
│  │                                                 │       │
│  │ [拖曳更換]  [移除]  [查看詳情]                  │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  槽位 2 - 主力輸出                                          │
│  ┌─────────────────────────────────────────────────┐       │
│  │ ⚡ Speedy Lv.5                                  │       │
│  │                                                 │       │
│  │ [拖曳更換]  [移除]  [查看詳情]                  │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  槽位 3 - 輔助/治療                                         │
│  ┌─────────────────────────────────────────────────┐       │
│  │ [+] 空位 - 點擊選擇夥伴                         │       │
│  │                                                 │       │
│  │ [選擇夥伴]                                      │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ━━━━━━━━━━━━━━━ 陣容統計 ━━━━━━━━━━━━━━━                │
│                                                             │
│  總攻擊力: 75   總防禦力: 65   總魔力: 65   總速度: 80     │
│                                                             │
│  陣容評分: ⭐⭐⭐⭐ (B級)                                   │
│                                                             │
│  建議:                                                      │
│  • 考慮加入輔助型夥伴以平衡陣容                             │
│  • 總防禦偏低，建議提升防禦能力                             │
│                                                             │
│  ━━━━━━━━━━━━━━━ 預設陣容 ━━━━━━━━━━━━━━━                │
│                                                             │
│  ☑ 戰鬥開始時自動召喚此陣容                                │
│  ☐ 陣容夥伴HP低於30%時自動輪換                             │
│  ☐ 優先保護槽位1的夥伴                                     │
│                                                             │
│  [儲存陣容]  [重置]  [預覽戰鬥]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component References

### Companion Card
【參考：04-components/companion-card.md】
- Emoji avatar with animation
- Level and job class
- HP/MP bars with colors
- Status indicator
- Stats display
- Action buttons

### Formation Slot
【參考：04-components/formation-slot.md】
- Position indicator (1-3)
- Drag-and-drop zone
- Occupied/empty states
- Remove button
- Visual role indicator

### Status Indicator
【參考：04-components/status-badge.md】
- ⚡ Active (green) - Ready for battle
- ⚠️ Exhausted (yellow) - Low HP/MP
- 😴 Resting (blue) - Recovering
- 💀 Knocked Out (gray) - Need revive

### Stats Panel
【參考：04-components/stat-panel.md】
- Icon + value pairs
- Tooltips on hover
- Comparison indicators
- Color coding

---

## States & Interactions

### Companion States

1. **Active (待命中)**
   - Full color display
   - All actions available
   - Can be added to formation
   - Green status indicator

2. **Exhausted (疲憊中)**
   - Slightly dimmed
   - HP/MP below 50%
   - Yellow warning indicator
   - "Rest" action recommended

3. **Resting (休息中)**
   - Blue tint
   - Gradually recovering HP/MP
   - Cannot use in combat
   - Shows recovery timer

4. **Knocked Out (倒下)**
   - Grayscale
   - HP at 0
   - Red KO indicator
   - Requires revival item

5. **In Formation (陣容中)**
   - Green checkmark badge
   - Shows slot number
   - "Remove from formation" option
   - Priority in auto-summon

6. **Locked Skill (技能鎖定)**
   - Skill shown with lock icon
   - Displays unlock requirements
   - Cannot use until unlocked
   - Tooltip shows progress

### Keyboard Interactions

```
P            - Toggle companion management screen
↑/↓          - Navigate companion list
Enter        - Select companion (show details)
F            - Switch to formation tab
1-3          - Quick select formation slot
D            - Details of selected companion
R            - Rename selected companion
Delete       - Remove from formation
G            - Go to mercenary guild
Tab          - Cycle through tabs
Esc          - Close screen
?            - Show help
```

### Mouse Interactions

```
Click Companion      - Select companion
Double-click         - View full details
Drag Companion       - Drag to formation slot
Hover Stats          - Show detailed tooltip
Click [配置]         - Open skill configuration
Click [重命名]       - Edit name/avatar
Click [加入陣容]     - Add to formation
Click [移除陣容]     - Remove from formation
Right-click          - Context menu
```

### Touch Interactions (Mobile)

```
Tap Companion        - Select companion
Long press           - Show context menu
Drag to slot         - Add to formation
Swipe left           - Quick remove
Swipe right          - Quick details
Pinch card           - Zoom details
```

---

## Animations

### Screen Transition
【參考：01-design-system/animation-timing.md】

**Opening Animation:**
```
0.0s  ├─ Backdrop fade in (200ms)
0.1s  ├─ Panel slide in from left (300ms)
0.2s  ├─ Tab bar slide in (200ms)
0.3s  ├─ Companion cards fade in, stagger (50ms each)
```

**Tab Switch Animation:**
```
0.0s  ├─ Current tab content fade out (150ms)
0.1s  ├─ Tab indicator slide (200ms)
0.2s  ├─ New tab content fade in (200ms)
```

### Companion Card Animations

**Card Hover:**
```css
.companion-card {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.companion-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}
```

**Status Change:**
```css
@keyframes status-change {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.status-indicator.changed {
  animation: status-change 400ms ease-out;
}
```

**HP/MP Update:**
```css
.companion-hp-bar, .companion-mp-bar {
  transition: width 500ms ease-out;
}

.companion-hp-bar.critical {
  animation: pulse-red 1s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
}
```

### Formation Animations

**Drag and Drop:**
```css
.companion-card.dragging {
  opacity: 0.7;
  transform: scale(1.1) rotate(5deg);
  cursor: grabbing;
}

.formation-slot.drag-over {
  border: 3px dashed #00ccff;
  background: rgba(0, 204, 255, 0.1);
  animation: slot-pulse 1s ease-in-out infinite;
}

@keyframes slot-pulse {
  0%, 100% { border-color: #00ccff; }
  50% { border-color: #0088cc; }
}
```

**Successful Drop:**
```css
@keyframes drop-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.formation-slot.dropped {
  animation: drop-success 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**Remove Animation:**
```css
@keyframes remove-from-slot {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8) rotate(-10deg);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(-20deg);
  }
}

.companion-card.removing {
  animation: remove-from-slot 400ms ease-out;
}
```

### Level Up Animation

```css
@keyframes companion-level-up {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  20% {
    transform: scale(1.2);
    filter: brightness(1.8);
  }
  40% {
    transform: scale(0.95);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

.companion-card.leveled-up {
  animation: companion-level-up 1s ease-out;
}

/* Sparkle particles */
@keyframes sparkle-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(0);
    opacity: 0;
  }
}

.companion-card.leveled-up::after {
  content: '✨';
  animation: sparkle-burst 1s ease-out;
}
```

---

## Cross-References

### Related Screens
- 【參考：02-screens/shops/mercenary-guild.md】 - Summon new companions
- 【參考：02-screens/battle/battle-screen.md】 - Companions in combat
- 【參考：02-screens/training/training-ground.md】 - Train companion skills

### Screen Transitions
【參考：03-flows/screen-transitions.md】
- From Main: Press `P` → Slide in from left
- To Guild: Click [召喚新夥伴] → Fade to guild
- To Battle: Formation preview → Battle simulation

### Design System
【參考：01-design-system/colors.md】 - Status colors
【參考：01-design-system/icons.md】 - Job class icons
【參考：01-design-system/animation-timing.md】 - Transition timings

---

## Implementation Notes

### Companion Data Structure

```typescript
interface Companion {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  level: number;
  jobClass: CompanionJob;

  // Stats
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;

  // Skills
  skills: CompanionSkill[];

  // Status
  status: CompanionStatus;
  formationSlot?: number; // 1-3, undefined if not in formation

  // Usage
  summonCount: number;
  lastUsed?: Date;
  winRate: number;
  avgDamagePerBattle: number;

  // Customization
  customAvatar?: string;
  customName?: string;
}

type CompanionJob = 'tank' | 'attacker' | 'support' | 'specialist';

type CompanionStatus =
  | 'active'     // ⚡ Ready
  | 'exhausted'  // ⚠️ Low HP/MP
  | 'resting'    // 😴 Recovering
  | 'ko';        // 💀 Knocked out

interface CompanionSkill {
  id: string;
  name: string;
  mpCost: number;
  cooldown: number;
  damage?: number;
  effects?: SkillEffect[];
  unlockLevel: number;
}
```

### Formation Manager

```typescript
class FormationManager {
  private slots: (Companion | null)[] = [null, null, null];
  private maxSlots: number = 3;

  addToFormation(companion: Companion, slot: number): boolean {
    // Validate slot
    if (slot < 0 || slot >= this.maxSlots) {
      return false;
    }

    // Check if companion already in formation
    const currentSlot = this.slots.indexOf(companion);
    if (currentSlot !== -1) {
      this.slots[currentSlot] = null;
    }

    // Add to new slot
    this.slots[slot] = companion;
    companion.formationSlot = slot;

    this.updateFormationStats();
    this.saveFormation();
    return true;
  }

  removeFromFormation(slot: number): boolean {
    if (slot < 0 || slot >= this.maxSlots) {
      return false;
    }

    const companion = this.slots[slot];
    if (companion) {
      companion.formationSlot = undefined;
      this.slots[slot] = null;
      this.updateFormationStats();
      this.saveFormation();
      return true;
    }

    return false;
  }

  swapSlots(slot1: number, slot2: number): void {
    const temp = this.slots[slot1];
    this.slots[slot1] = this.slots[slot2];
    this.slots[slot2] = temp;

    if (this.slots[slot1]) {
      this.slots[slot1]!.formationSlot = slot1;
    }
    if (this.slots[slot2]) {
      this.slots[slot2]!.formationSlot = slot2;
    }

    this.updateFormationStats();
    this.saveFormation();
  }

  getFormation(): (Companion | null)[] {
    return [...this.slots];
  }

  getFormationStats(): FormationStats {
    const companions = this.slots.filter(c => c !== null) as Companion[];

    return {
      totalAttack: companions.reduce((sum, c) => sum + c.attack, 0),
      totalDefense: companions.reduce((sum, c) => sum + c.defense, 0),
      totalMagic: companions.reduce((sum, c) => sum + c.magic, 0),
      totalSpeed: companions.reduce((sum, c) => sum + c.speed, 0),
      rating: this.calculateFormationRating(companions)
    };
  }

  private calculateFormationRating(companions: Companion[]): string {
    if (companions.length === 0) return 'E';

    const avgLevel = companions.reduce((sum, c) => sum + c.level, 0) / companions.length;
    const jobVariety = new Set(companions.map(c => c.jobClass)).size;

    // Rating based on level and job diversity
    if (avgLevel >= 8 && jobVariety >= 3) return 'S';
    if (avgLevel >= 6 && jobVariety >= 2) return 'A';
    if (avgLevel >= 4) return 'B';
    if (avgLevel >= 2) return 'C';
    return 'D';
  }

  autoSummonFormation(): void {
    const formation = this.getFormation();
    formation.forEach(companion => {
      if (companion && companion.status === 'active') {
        this.summonCompanion(companion);
      }
    });
  }
}
```

### Status Management

```typescript
class CompanionStatusManager {
  updateStatus(companion: Companion): void {
    const hpPercent = (companion.hp / companion.maxHp) * 100;
    const mpPercent = (companion.mp / companion.maxMp) * 100;

    if (companion.hp <= 0) {
      companion.status = 'ko';
    } else if (hpPercent < 50 || mpPercent < 50) {
      companion.status = 'exhausted';
    } else if (companion.status === 'resting') {
      // Keep resting until full recovery
      if (hpPercent >= 100 && mpPercent >= 100) {
        companion.status = 'active';
      }
    } else {
      companion.status = 'active';
    }
  }

  startResting(companion: Companion): void {
    companion.status = 'resting';
    this.scheduleRecovery(companion);
  }

  private scheduleRecovery(companion: Companion): void {
    const recoveryInterval = setInterval(() => {
      if (companion.status !== 'resting') {
        clearInterval(recoveryInterval);
        return;
      }

      // Recover 10% HP/MP every 30 seconds
      companion.hp = Math.min(companion.maxHp, companion.hp + companion.maxHp * 0.1);
      companion.mp = Math.min(companion.maxMp, companion.mp + companion.maxMp * 0.1);

      this.updateStatus(companion);

      if (companion.status === 'active') {
        clearInterval(recoveryInterval);
        this.notifyRecoveryComplete(companion);
      }
    }, 30000); // 30 seconds
  }

  reviveCompanion(companion: Companion): void {
    if (companion.status !== 'ko') return;

    companion.hp = companion.maxHp * 0.5; // Revive with 50% HP
    companion.mp = companion.maxMp * 0.5;
    companion.status = 'active';

    this.notifyRevived(companion);
  }
}
```

---

## Accessibility

### Screen Reader Support

```html
<section aria-label="Companion Management Screen" role="dialog">
  <h1 id="companion-title">Companion Management</h1>

  <nav aria-label="Companion tabs">
    <button aria-label="All companions" aria-selected="true">All</button>
    <button aria-label="Formation" aria-selected="false">Formation</button>
    <button aria-label="Settings" aria-selected="false">Settings</button>
  </nav>

  <div role="list" aria-label="Companion list">
    <article role="listitem" aria-label="CodeGuard, Level 3, Tank, Active">
      <h2>CodeGuard (Code Guardian)</h2>
      <div role="status">
        Level 3, Job: Tank, HP: 85 out of 100, MP: 42 out of 80, Status: Active
      </div>

      <section aria-label="Skills">
        <h3>Skills</h3>
        <ul>
          <li>Security Scan</li>
          <li>Guardian Shield</li>
          <li>OWASP Strike - Locked, unlocks at level 5</li>
        </ul>
      </section>

      <div role="group" aria-label="Actions">
        <button>View Details</button>
        <button>Configure</button>
        <button>Rename</button>
        <button>Remove from formation</button>
      </div>
    </article>
  </div>
</section>
```

### Keyboard Navigation

**Focus Order:**
1. Close button
2. Tab navigation
3. Companion cards (arrow keys)
4. Action buttons
5. Formation slots
6. Settings controls

**Keyboard Shortcuts:**
```
P            - Open/close companion screen
Arrow keys   - Navigate companions
Enter        - Select companion
F            - Formation tab
1-3          - Formation slots
D            - Details
R            - Rename
G            - Guild
Tab          - Next section
Esc          - Close
```

### Visual Accessibility

**Status Indicators:**
- Use icons AND color
- Text labels for all states
- High contrast borders

```css
/* High contrast mode */
@media (prefers-contrast: high) {
  .companion-card {
    border-width: 3px;
  }

  .companion-card.active {
    border-color: #0f0;
  }

  .companion-card.exhausted {
    border-color: #ff0;
  }

  .companion-card.ko {
    border-color: #f00;
  }
}
```

**Color Blindness Support:**
- Status shown with icons + patterns
- Job classes use different shapes
- Formation slots numbered

---

## Responsive Design

### Desktop (≥1200px)

```
┌───────────────────────────────────────┐
│  [Tabs]                               │
│  ──────────────────────────────────   │
│  [Companion List]  [Details Panel]    │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Companion 1  │  │ Selected:    │   │
│  │ Companion 2  │  │ CodeGuard    │   │
│  │ Companion 3  │  │              │   │
│  │ (scroll)     │  │ Full details │   │
│  └──────────────┘  │ Stats        │   │
│                    │ Skills       │   │
│                    │ [Actions]    │   │
│                    └──────────────┘   │
└───────────────────────────────────────┘
```
- Two-column layout
- Permanent details panel
- Hover tooltips

### Tablet (768px - 1199px)

```
┌──────────────────────────────┐
│  [Tabs]                      │
│  ────────────────────────    │
│  [Companion Cards]           │
│  ┌──────────────────────┐    │
│  │ Companion 1          │    │
│  │ Brief info           │    │
│  │ [Tap for details]    │    │
│  └──────────────────────┘    │
│  (scroll down)               │
└──────────────────────────────┘
```
- Single column
- Tap for details modal
- Touch-optimized

### Mobile (<768px)

```
┌────────────────┐
│ [Tab Pills]    │
│ (horizontal)   │
│ ───────────    │
│ [Companions]   │
│ ┌──────────┐   │
│ │   Card   │   │
│ │  ┌────┐  │   │
│ │  │ 🛡️ │  │   │
│ │  └────┘  │   │
│ │ Guard    │   │
│ │ Lv.3     │   │
│ │ [...]    │   │
│ └──────────┘   │
│  (scroll)      │
└────────────────┘
```
- Vertical scroll
- Large touch targets
- Bottom sheet details
- Swipe actions

---

## Version History

- **v1.0** (2026-02-05): Initial companion management screen design
  - Companion roster view
  - Formation management (3 slots)
  - Status indicators
  - Skill display
  - Stats panel
  - Customization options
  - Responsive layouts
  - Accessibility support
