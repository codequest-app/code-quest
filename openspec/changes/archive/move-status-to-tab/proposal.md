## Why

HeaderBar and TabBar both display session status indicators, but they use different type systems — HeaderBar shows a 6-state `SessionStatus` (idle/processing/busy/connecting/cancelling/disconnected) while TabBar has a 3-state `TabInfo.status` (default/pending/done) that is effectively dead code (`pending` and `done` are never set). HeaderBar occupies 44px of vertical space primarily for a status dot that should live on the tab itself, where users can see all sessions' states at a glance.

## What Changes

- Replace `TabInfo.status` (`'default' | 'pending' | 'done'`) with `SessionStatus` in TabBar, showing the real 6-state session status with matching colors
- Wire `SessionStatus` from `ChannelMessagesContext` through `onChange` → `TabContext` → `TabBar`
- Remove status dot + label from HeaderBar; keep model badge, thinking level, title, and Raw button
- Remove dead `tabStatus` / `'pending'` / `'done'` code paths from TabContext and ChannelMessagesContext

## Capabilities

### New Capabilities

_(none — this is a reorganization of existing UI, not a new capability)_

### Modified Capabilities

- `client`: TabBar displays real-time SessionStatus per tab; HeaderBar no longer shows status indicator

## Impact

- `apps/web/src/components/TabBar.tsx` — TabInfo type change, status dot mapping
- `apps/web/src/components/HeaderBar.tsx` — remove status dot + label
- `apps/web/src/contexts/TabContext.tsx` — TabMeta.tabStatus → SessionStatus
- `apps/web/src/contexts/channel/ChannelMessagesContext.tsx` — onChange passes SessionStatus
- `apps/web/src/types/chat.ts` — ChannelChangeUpdate type
- `apps/web/src/components/WorkspaceLayout.tsx` — wire new status type
- Tests and stories for above components
