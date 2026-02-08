# Phase 3: Advanced Systems - Implementation Plan

**Phase Duration**: 3 weeks
**Phase Status**: Planning
**Dependencies**: Phase 0, 1, 2
**Deliverables**: Interactive Events (L2), Async Battle (L3), Multi-Model (L3)

---

## Phase Overview

### Goals

Phase 3 implements **advanced L2-L3 systems**:
1. **Interactive Events (L2)**: Plan Mode, User Questions, Error Handling, Permission Requests
2. **Async Battle System (L3)**: Multiple concurrent battles with Worktree isolation
3. **Multi-Model Integration (L3)**: Claude + Gemini routing, cost tracking

**Key Objectives**:
- Handle battle interruptions elegantly
- Support 3 concurrent battles max
- Smart AI model routing
- Cost tracking and budget management

### Timeline

| Week | Focus Area | Key Deliverables |
|------|-----------|------------------|
| Week 1 | Interactive Events | Plan Mode, AskUserQuestion, Error UI |
| Week 2 | Async Battle | SmartRouter, battle instances, DQ-style menu |
| Week 3 | Multi-Model | Model selection, cost tracking, bank UI |

---

## Task Checklist

### Week 1: Interactive Events

- [ ] Plan Mode UI (Stasis Chamber)
- [ ] AskUserQuestion modal
- [ ] Error event handling
- [ ] Permission request flow
- [ ] Event pause mechanics
- [ ] Tool-to-event mapping

### Week 2: Async Battle System

- [ ] SmartRouter complexity routing
- [ ] BattleInstance management (max 3)
- [ ] Worktree auto-creation
- [ ] DQ-style battle menu (Tab key)
- [ ] Battle switching UI
- [ ] Progress tracking
- [ ] Notification system

### Week 3: Multi-Model Integration

- [ ] Model configuration
- [ ] Smart model selection
- [ ] Cost calculation per model
- [ ] Bank UI with charts
- [ ] Budget warnings
- [ ] Usage statistics

---

## Key Implementation: Async Battle Manager

```typescript
export class AsyncBattleManager {
  private battles: Map<string, BattleInstance> = new Map();
  private maxConcurrent = 3;

  async createBattle(prompt: string, analysis: ComplexityAnalysis): Promise<string> {
    if (this.battles.size >= this.maxConcurrent) {
      throw new Error('已達到並發戰鬥上限(3)');
    }

    // Auto-create worktree if complexity >= 8
    let worktreePath: string | undefined;
    if (analysis.recommendation === 'async') {
      worktreePath = await this.createWorktree(analysis);
    }

    const battle: BattleInstance = {
      id: uuid(),
      prompt,
      enemy: this.enemyFactory.generate(analysis),
      worktreePath,
      state: BattleState.IN_PROGRESS,
      progress: 0,
      startedAt: new Date(),
    };

    this.battles.set(battle.id, battle);
    this.emit('battle-created', battle);

    return battle.id;
  }

  async switchToBattle(battleId: string): Promise<void> {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('戰鬥不存在');

    this.emit('battle-focus', battle);
  }

  getBattles(): BattleInstance[] {
    return Array.from(this.battles.values());
  }
}
```

---

## Integration Points

```
Interactive Events ←→ Battle System (pause/resume)
Async Battle → Worktree System (auto-create)
Multi-Model → Battle System (AI routing)
Interactive Events → Scene System (time pause)
```

---

## Success Criteria

- [ ] Plan Mode pauses battle correctly
- [ ] 3 concurrent battles run smoothly
- [ ] Worktrees auto-create for complex tasks
- [ ] Tab menu shows all battles
- [ ] Model routing reduces costs
- [ ] Bank tracks expenses accurately

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
