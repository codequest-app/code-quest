# Phase 5: Tutorial System - Implementation Plan

**Phase Duration**: 1 week
**Phase Status**: Planning
**Dependencies**: All previous phases
**Deliverables**: Complete onboarding tutorial

---

## Phase Overview

### Goals

Phase 5 creates the **new player onboarding experience**:
1. Welcome and world introduction
2. Town tour (5 locations)
3. First conversation (dialog mode)
4. First simple task (sync battle)
5. First real battle (tutorial enemy)
6. Tutorial completion rewards

**Key Objectives**:
- Smooth new player experience
- Teach all core mechanics
- Progressive complexity
- Clear instructions
- Skip option for experienced users

### Timeline

| Week | Focus Area | Key Deliverables |
|------|-----------|------------------|
| Week 1 | Tutorial Flow | 7-step tutorial, UI guidance, hints |

---

## Tutorial Flow (7 Steps)

### Step 1: Welcome
- Spawn at Town Center
- Tutorial NPC appears
- Welcome message
- Controls hint overlay

### Step 2: Town Tour
- Guide to Tavern (conversation)
- Guide to Shopping District (shops)
- Guide to Guild Hall (worktrees)
- Guide to Stasis Chamber (plan mode)
- Visual highlights on each location

### Step 3: First Conversation
- Enter Tavern
- Prompt: "What is React?"
- AI answers immediately (no battle)
- Explain dialog mode

### Step 4: First Simple Task
- Prompt: "Create a Hello World file"
- Complexity = 2 (too simple for battle)
- Quick completion
- Small EXP reward (+10)

### Step 5: Go to Wilderness
- NPC suggests wilderness
- Guide to forest
- Scene transition animation
- Encounter rate explained

### Step 6: First Battle (Tutorial)
- Prompt: "Create a counter component"
- Complexity = 8 (battle trigger)
- Special tutorial enemy (Lv 3, reduced HP)
- Step-by-step battle guidance:
  - Wait for Claude to act
  - Use a skill manually
  - Defeat enemy
- Auto-creates worktree
- Victory rewards (+50 EXP, +20 Gold)
- Guide to merge worktree

### Step 7: Tutorial Complete
- Congratulations message
- Feature summary
- Unlock free exploration
- Achievement: "First Victory" 🏆

---

## Task Checklist

- [ ] TutorialManager service
- [ ] Tutorial state tracking
- [ ] Step progression logic
- [ ] NPC dialogue system
- [ ] Highlight overlays
- [ ] Tooltip system
- [ ] Skip tutorial option
- [ ] Tutorial completion flag
- [ ] Achievement integration

---

## Key Component: Tutorial Overlay

```typescript
export function TutorialOverlay({ step }: { step: TutorialStep }) {
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-content">
        <h2>{step.title}</h2>
        <p>{step.description}</p>
        
        {step.target && (
          <div className="tutorial-highlight">
            {/* Highlight target element */}
          </div>
        )}

        <div className="tutorial-actions">
          <button onClick={step.onNext}>下一步</button>
          <button onClick={skipTutorial}>跳過教學</button>
        </div>
      </div>
    </div>
  );
}
```

---

## Success Criteria

- [ ] Tutorial completes without errors
- [ ] All mechanics introduced clearly
- [ ] Skip option works
- [ ] Tutorial enemy beatable by new players
- [ ] Smooth transitions between steps
- [ ] No overwhelming information
- [ ] Takes 5-10 minutes to complete

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
