## Context

Session status is displayed in two places: HeaderBar (per-channel, 6-state `SessionStatus`) and TabBar (per-tab, 3-state `'default' | 'pending' | 'done'`). The TabBar states are dead code — only `'default'` is ever set via the `onChange` callback. HeaderBar uses 44px vertical space primarily for a status dot.

Data flow today:
```
ChannelMessagesContext.status (SessionStatus)
  → onChange({ status: 'default' })  // loses information
  → TabContext.tabStatus ('default' | 'pending' | 'done')
  → TabBar
```

## Goals / Non-Goals

**Goals:**
- TabBar shows real-time `SessionStatus` per tab with correct status colors
- Remove redundant status display from HeaderBar
- Clean up dead `'pending'` / `'done'` code paths

**Non-Goals:**
- Redesigning TabBar layout or adding new features
- Changing how `SessionStatus` is computed in `ChannelMessagesContext`
- Moving model/thinking badges to TabBar (keep in HeaderBar)

## Decisions

### 1. Pass `SessionStatus` through `onChange` instead of mapping to tri-state

**Rationale:** The current mapping (`idle|connecting → 'default'`) discards useful information. Pass the real `SessionStatus` value directly.

**Change:** `ChannelChangeUpdate.status` type changes from `'default' | 'pending' | 'done'` to `SessionStatus`.

### 2. Keep HeaderBar for model/title/Raw button, remove only status indicator

**Rationale:** HeaderBar still has value showing model badge, thinking level, session title, and Raw events toggle. Only the status dot + label are redundant with TabBar.

### 3. TabBar status dot color mapping matches HeaderBar's existing scheme

```
idle         → bg-success (green)
processing   → bg-accent animate-pulse
busy         → bg-accent animate-pulse
connecting   → bg-accent animate-pulse
cancelling   → bg-warning animate-pulse
disconnected → bg-danger (red)
```

## Risks / Trade-offs

- [Low] HeaderBar height reduction changes visual layout slightly → Acceptable, saves space
- [Low] TabBar dots are smaller (1.5x1.5) than HeaderBar dots (2x2) → Status colors are still distinguishable at small size
