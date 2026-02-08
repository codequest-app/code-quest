# Phase 6: Achievements & Meta - Implementation Plan

**Phase Duration**: 1 week
**Phase Status**: Planning
**Dependencies**: All previous phases
**Deliverables**: Achievement system, meta-game features

---

## Phase Overview

### Goals

Phase 6 adds **achievement system and meta-game features**:
1. Achievement tracking (50+ achievements)
2. Statistics and leaderboards
3. Save/load system
4. Settings and preferences
5. Meta-progression rewards

**Key Objectives**:
- Reward player milestones
- Track comprehensive statistics
- Persistent save system
- User preferences
- End-game content

### Timeline

| Week | Focus Area | Key Deliverables |
|------|-----------|------------------|
| Week 1 | Achievements & Meta | 50+ achievements, stats, save system |

---

## Achievement Categories

### Combat Achievements (15)
- First Victory
- 10 Victories
- 100 Victories
- Perfect Victory (no damage)
- Fast Kill (3 turns)
- Bug Terminator (10 bug enemies)
- Boss Slayer (defeat all bosses)
- Combo Master (10 combo skills)
- Overkill (damage > 1000)

### Exploration Achievements (10)
- Visited all towns
- Visited all wilderness
- Completed all dungeons
- Fast traveler (unlock all points)
- Cartographer (reveal full map)

### Companion Achievements (10)
- First companion
- 5 companions
- Companion Lv 10
- Companion Lv 20
- Perfect teamwork (companion wins)

### Shop Achievements (10)
- First purchase
- Big spender (1000 gold spent)
- Skill collector (own 20 skills)
- Custom skill creator
- MCP tool master (install 5)

### Worktree Achievements (5)
- First worktree
- 10 worktrees created
- 10 successful merges
- Parallel master (3 concurrent)

---

## Task Checklist

### Achievement System
- [ ] Achievement data structure (50+ achievements)
- [ ] Achievement tracker service
- [ ] Unlock logic
- [ ] Notification on unlock
- [ ] Achievement UI (Treasury)
- [ ] Progress bars
- [ ] Reward distribution

### Statistics System
- [ ] Track all game stats:
  - [ ] Battles fought/won/lost
  - [ ] Total damage dealt
  - [ ] Skills used (breakdown)
  - [ ] Companions summoned
  - [ ] Worktrees created/merged
  - [ ] Gold earned/spent
  - [ ] Time played
  - [ ] Locations visited
- [ ] Statistics dashboard UI
- [ ] Charts and graphs

### Save/Load System
- [ ] Save game state to localStorage
- [ ] Auto-save every 5 minutes
- [ ] Manual save button
- [ ] Load game on startup
- [ ] Multiple save slots (3)
- [ ] Export/import saves
- [ ] Cloud save (optional)

### Settings System
- [ ] Game settings:
  - [ ] RPG mode intensity (0-100%)
  - [ ] Animation speed
  - [ ] Auto-battle
  - [ ] Difficulty
- [ ] Audio settings:
  - [ ] Master volume
  - [ ] BGM volume
  - [ ] SFX volume
  - [ ] Mute all
- [ ] Display settings:
  - [ ] Theme (dark/light)
  - [ ] Font size
  - [ ] High contrast
  - [ ] Reduce motion
- [ ] Advanced settings:
  - [ ] AI model preference
  - [ ] Auto-save interval
  - [ ] Notification frequency

---

## Key Implementation: Achievement Tracker

```typescript
export class AchievementTracker {
  private achievements: Map<string, Achievement> = new Map();
  private unlocked: Set<string> = new Set();

  register(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
  }

  check(eventType: string, data: any): void {
    for (const [id, achievement] of this.achievements) {
      if (this.unlocked.has(id)) continue;

      if (achievement.condition(eventType, data)) {
        this.unlock(id);
      }
    }
  }

  private unlock(id: string): void {
    const achievement = this.achievements.get(id);
    if (!achievement) return;

    this.unlocked.add(id);

    // Grant rewards
    if (achievement.rewards) {
      this.grantRewards(achievement.rewards);
    }

    // Show notification
    this.showUnlockNotification(achievement);

    this.emit('achievement-unlocked', achievement);
  }
}

// Example achievement definition
const FIRST_VICTORY: Achievement = {
  id: 'first-victory',
  name: '首次勝利',
  description: '完成你的第一場戰鬥',
  icon: '🏆',
  rarity: 'common',
  rewards: {
    exp: 50,
    gold: 0,
    title: '新手冒險者',
  },
  condition: (event, data) => {
    return event === 'battle-ended' && data.victory === true;
  },
};
```

---

## Success Criteria

- [ ] 50+ achievements implemented
- [ ] All achievements triggerable
- [ ] Statistics accurate
- [ ] Save/load works reliably
- [ ] Settings persist
- [ ] Achievements feel rewarding
- [ ] No lost progress on refresh

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
