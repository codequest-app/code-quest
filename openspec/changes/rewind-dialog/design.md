## Overview

Add "Rewind" to Command Menu that opens a message picker dialog, matching the VS Code extension's behavior.

## Architecture

```
Command Menu → "Rewind" click
     ↓
ComposeToolbar state: showRewindDialog = true
     ↓
RewindDialog component
  - reads messages from useChannelMessages()
  - filters: type === 'user' && !parentToolUseId && has id
  - displays list with prompt text + relative time
  - keyboard nav: ↑↓ Enter Esc
     ↓
User selects message
     ↓
rewindToMessage(id, false) → rewind code
     ↓
forkSession(id) → create new session
     ↓
Fill original prompt into compose input
```

## Key Decisions

### 1. RewindDialog is a standalone component
Not embedded in Command Menu — it's a separate dialog that opens when Command Menu's "Rewind" is clicked. Command Menu closes, RewindDialog opens.

### 2. Message filtering
Same as extension: `type === 'user' && !parentToolUseId && message.id exists`. Exclude synthetic/tool messages.

### 3. No dry-run preview in picker flow
Extension skips dry-run preview in the picker flow (goes straight to rewind). The existing MessageActions hover flow still has dry-run preview for individual messages.

### 4. Relative time display
Use `formatRelativeDate` utility (already exists) for timestamps like "1h ago", "2d ago".

### 5. Rewind action as Command Menu callback
Add `onRewind` callback to CommandMenuProps, same pattern as `onOpenModelPicker`, `onMcpStatus` etc. ComposeToolbar handles the dialog state.

## Files Changed

| File | Change |
|------|--------|
| `command-menu-items.tsx` | Add "Rewind" item to context section |
| `RewindDialog.tsx` | New: message picker dialog |
| `ComposeToolbar.tsx` | Mount RewindDialog, add callback |
| `CommandMenu.tsx` | Pass onRewind callback |
