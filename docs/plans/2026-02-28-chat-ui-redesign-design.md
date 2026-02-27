# Chat UI Redesign — VS Code Style

## Goal

Improve visual quality of the chat UI with a design system and better layout. Keep ChatPanel as the foundation for future RPG theming.

## Design System (@theme tokens)

```css
@theme {
  /* Surface hierarchy — VS Code Dark+ */
  --color-bg: #1e1e1e;
  --color-surface: #252526;
  --color-surface-hover: #2a2d2e;
  --color-border: #3c3c3c;

  /* Text hierarchy */
  --color-text: #cccccc;
  --color-text-muted: #858585;
  --color-text-bright: #e0e0e0;

  /* Semantic colors */
  --color-accent: #007acc;
  --color-success: #4ec9b0;
  --color-warning: #dcdcaa;
  --color-danger: #f44747;

  /* Role colors */
  --color-user: #569cd6;
  --color-assistant: #9cdcfe;
}
```

All components use semantic token names (`bg-surface`, `text-muted`, `border-border`) instead of hardcoded hex values.

## Layout

```
┌─────────────────────────────────────────┐
│ HeaderBar: ● Connected │ Session #abc   │ 40px
├─────────────────────────────────────────┤
│                                         │
│  MessageList (flex-1, scrollable)       │
│    user:  left border user color        │
│    asst:  left border assistant color   │
│    tool:  indented card, surface bg     │
│    error: danger border                 │
│                                         │
├─────────────────────────────────────────┤
│ ControlRequestBanner (if pending)       │
├─────────────────────────────────────────┤
│ StatsBar: $0.01 │ 2.3s │ ↑1.2k │ ↓800 │
├─────────────────────────────────────────┤
│ ChatInput: [textarea] [Send]            │
└─────────────────────────────────────────┘
```

## Components

### HeaderBar (NEW)
- Connection status indicator (green/red dot)
- Session ID display
- Compact, 40px height
- `bg-surface` background, `border-border` bottom border

### ChatMessage (MODIFY)
- Left border color distinguishes roles: `border-user` for user, `border-assistant` for assistant
- tool_use / tool_result wrapped in `bg-surface` card with `border-border`
- thinking: collapsible, `text-muted` styling
- error: `border-danger` left border, `text-danger`
- Code blocks: `bg-surface` instead of hardcoded hex

### ChatInput (MODIFY)
- `bg-surface` background, `border-border`
- Focus: `border-accent` ring
- Send button: `bg-accent` with hover state

### StatsBar (MODIFY)
- `text-muted` color, `border-border` top separator

### ControlRequestBanner (MODIFY)
- Approve: `bg-success` button
- Deny: `bg-danger` button
- Warning styling: `border-warning`

## Scope

- Design tokens via `@theme` in App.css
- Update all 6 components to use tokens
- New HeaderBar component
- All existing tests updated (use data attributes, not classes)
- Sidebar: deferred to future iteration
