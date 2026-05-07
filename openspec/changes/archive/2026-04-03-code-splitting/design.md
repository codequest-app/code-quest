## Overview

Add React.lazy() code splitting for conditionally rendered components to reduce initial bundle size.

## Candidates

Components that are conditionally rendered (dialog/panel pattern):

| Component | Location | Condition | Est. Size |
|-----------|----------|-----------|-----------|
| ManageMcpDialog | ComposeToolbar | activeDialog === 'manageMcp' | Medium |
| AccountUsageDialog | ComposeToolbar | activeDialog === 'usage' | Medium |
| PluginsPanel | ComposeToolbar | activeDialog === 'plugins' | Medium |
| AuthDialog | ComposeToolbar | activeDialog === 'auth' | Small |
| ModelPickerPanel | ComposeToolbar | activeDialog === 'modelPicker' | Small |
| InitOptionsDialog | ComposeToolbar | activeDialog === 'initOptions' | Small |
| CommandMenu | ChatPanel | slash command open | Large |
| DiffViewer | ToolUseBlock/ToolResultBlock | content is diff | Medium (includes diff pkg) |

## Approach

### Pattern

```tsx
const LazyManageMcpDialog = lazy(() => import('./ManageMcpDialog'));

// In render:
{activeDialog === 'manageMcp' && (
  <Suspense fallback={null}>
    <LazyManageMcpDialog open onClose={closeDialog} ... />
  </Suspense>
)}
```

### Key decisions

1. **Fallback = null** — dialogs appear over existing content, no layout shift risk
2. **Conditional render gate** — only mount `<Suspense>` when dialog is active, so chunk loads on first open
3. **DiffViewer special case** — used inside message blocks during streaming. Lazy is OK because diffs only appear after tool_result completes (not during typing)
4. **CommandMenu** — already conditionally rendered. Lazy works.

## Files Changed

| File | Change |
|------|--------|
| `ComposeToolbar.tsx` | Lazy load 6 dialog components |
| `ChatPanel.tsx` | Lazy load CommandMenu |
| `message-blocks/ToolUseBlock.tsx` | Lazy load DiffViewer |
| `message-blocks/ToolResultBlock.tsx` | Lazy load DiffViewer |
