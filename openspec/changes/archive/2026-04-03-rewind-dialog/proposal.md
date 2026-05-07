## Why

Extension has a "Rewind" entry in the Command Menu that opens a message picker dialog, letting users select any past user message to rewind to. Our current rewind is only accessible by hovering a specific user message — harder to discover and requires knowing which message to target.

## What Changes

- Add "Rewind" option to Command Menu (Context section)
- New `RewindDialog` component: lists all user messages with timestamps, keyboard navigation (↑↓ Enter Esc)
- Selecting a message shows RewindPreview (existing component), then executes rewind + auto-fork + fills original prompt into input
- Existing MessageActions hover menu (fork, rewind, copy) remains unchanged

## Capabilities

### New Capabilities

- `rewind-dialog`: Command Menu "Rewind" action opens a message picker dialog for selecting which point to rewind to

### Modified Capabilities

## Impact

- `apps/web/src/components/command-menu-items.tsx` — add "Rewind" menu item
- `apps/web/src/components/RewindDialog.tsx` — new component
- `apps/web/src/components/ComposeToolbar.tsx` or `ChatPanel.tsx` — mount RewindDialog
- Reuses existing `rewindToMessage` and `forkSession` actions from ChannelMessagesContext
- No server changes needed
