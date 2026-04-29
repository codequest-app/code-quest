# Storybook Scenarios

## Problem

103 stories all live at the component level — each shows a single component in isolation.
No story demonstrates a complete user flow (e.g., "user asks a question, Claude uses Bash, returns result").
To understand how chat works visually, you have to mentally assemble 5-6 separate stories.

## Solution

Add a **Scenarios layer** alongside the existing component stories:

```
Storybook Sidebar
├── 📖 Scenarios/         ← NEW: user-journey stories
│   ├── Getting Started
│   ├── Tool Use
│   ├── Permissions
│   ├── Advanced
│   ├── System Events
│   └── Session
│
├── 🧩 Components/        ← EXISTING: unchanged
│   ├── chat/compose/...
│   └── ...
```

Each scenario renders `ChatPanel` with `withStoryChannel` + a realistic message sequence.
Every scenario has `play()` functions that simulate user interaction.

## Batch Plan

| Batch | Scope | Decorator changes |
|-------|-------|-------------------|
| 1 | Foundation + Getting Started + Tool Use (7 stories) | None |
| 2 | Permissions (5 stories) | Expand withStoryChannel for `pending` |
| 3 | System Events + Advanced (9 stories) | None |
| 4 | Session Management (3 stories) | Possibly expand for rewind/fork actions |

After Batch 1, extract patterns into a Storybook skill for subsequent batches.

## Scope

- New `packages/client/src/scenarios/` directory
- Expand `test/story-fixtures.ts` with scenario factories
- Move 3 existing scenario stories from ChatPanel.stories.tsx
- No changes to existing component stories
