# Chat UI Redesign v2 — AI Assistant Style

## Goal

Redesign the chat interface to follow AI assistant conventions (ChatGPT / Claude.ai style): avatar + role labels, centered content column, collapsible tool/thinking messages, card-style input area.

## Design Decisions

- **Style**: AI Assistant (not IM bubble style)
- **Tool messages**: Collapsed by default, click to expand
- **Thinking messages**: Collapsed with "Thought for Xs" label
- **Input area**: Rounded card containing textarea + Send button inside
- **Layout**: `max-w-3xl mx-auto` centered content

## Layout

```
┌─ HeaderBar ── full-width, h-11, bg-surface ─────────┐
│  ● Connected                         session-abc123 │
├─────────────────────────────────────────────────────┤
│                                                     │
│         ┌── max-w-3xl mx-auto ──┐                   │
│         │  message rows here    │                   │
│         └───────────────────────┘                   │
│                                                     │
├─ InputArea ── full-width, bg-surface ───────────────┤
│         ┌── max-w-3xl mx-auto ──┐                   │
│         │ ControlRequestBanner  │                   │
│         │ ╭─ rounded-xl card ─╮ │                   │
│         │ │ textarea    [Send]│ │                   │
│         │ ╰───────────────────╯ │                   │
│         │ StatsBar (muted)      │                   │
│         └───────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

## Message Row Structure

```
┌─ py-6, border-b border-border/30 ──────────────────┐
│  ┌─ avatar ─┐  Role Label (bold)                   │
│  │  24x24   │  message content...                  │
│  └──────────┘                                      │
└────────────────────────────────────────────────────┘
```

### Roles

| Role | Avatar | Label | Label Color |
|------|--------|-------|-------------|
| user | 👤 on `bg-user/20` rounded-md | You | `text-user` |
| assistant | ✦ on `bg-assistant/20` rounded-md | Assistant | `text-assistant` |

### Consecutive Messages

Same-role consecutive messages omit avatar and label; content aligns with first message using left padding.

### Message Types

| Type | Display |
|------|---------|
| `text` | Markdown rendered (unchanged) |
| `thinking` | Collapsed: `💭 Thought for Xs`, expand to show content (italic, muted) |
| `tool_use` | Collapsed: `⚙ tool_name`, expand to show input JSON |
| `tool_result` | Collapsed: `✓ Result`, expand to show pre output |
| `error` | Not collapsed. `bg-danger-bg border border-danger/20 rounded-lg` |
| `control_request` | Not collapsed. `bg-warning-bg border-l-2 border-l-warning` |

## Input Area

- Outer card: `rounded-xl bg-bg border border-border`
- Textarea: inside card, `bg-transparent`, no extra border
- Focus: outer card gets `border-accent glow-accent-ring`
- Send button: inside card, bottom-right, `bg-accent rounded-lg`
- ControlRequestBanner: above input card
- StatsBar: below input card

## Empty State

```
        ✦
    CC Office
How can I help you today?
```

- `✦` in `text-assistant`, `text-4xl`
- Title: `text-text-bright font-medium text-lg`
- Subtitle: `text-text-muted text-sm`

## New Token

| Token | Value | Usage |
|---|---|---|
| `--color-assistant-bg` | `#1a1528` | Assistant avatar background |

## Not Included (YAGNI)

- No timestamps displayed
- No copy/retry action buttons
- No avatar image upload
- No sidebar / dual-pane layout
