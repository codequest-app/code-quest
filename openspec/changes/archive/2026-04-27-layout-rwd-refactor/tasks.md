# Tasks

## Task 1 — EditorArea: remove redundant `h-full`
- File: `apps/web/src/components/EditorArea.tsx`
- Change: `flex flex-col flex-1 h-full` → `flex flex-col flex-1`
- Test: existing EditorArea tests pass

## Task 2 — Tab content wrapper: remove leftover `relative`
- File: `apps/web/src/components/EditorArea.tsx` (tab content div)
- Change: `flex flex-1 overflow-hidden relative` → `flex flex-1 overflow-hidden`
- Test: existing layout tests pass

## Task 3 — ChatPanel root: fix redundant `h-full w-full`
- File: `apps/web/src/components/ChatPanel.tsx`
- Change: `flex h-full w-full overflow-hidden` → `flex flex-1 overflow-hidden min-w-0`
- Test: ChatPanel renders correctly; existing tests pass

## Task 4 — WorkspaceLayout projects container: remove `h-full`, fix class order
- File: `apps/web/src/components/WorkspaceLayout.tsx`
- Change: `flex-1 min-w-0 flex h-full` → `flex flex-1 min-w-0`
- Test: WorkspaceLayoutRWD tests pass

## Task 5 — Fix per-project div missing min-w-0 in WorkspaceLayout (RWD/InputArea bug)
- File: `apps/web/src/components/WorkspaceLayout.tsx`
- Change: per-project div `flex flex-1` → `flex flex-1 min-w-0`
- Root cause: without min-w-0, div expands to natural content width (762px) on mobile/tablet
- Test: WorkspaceLayoutRWD — assert per-project div has correct width matching viewport

## Task 6 — Fix per-tab div missing min-w-0 in EditorArea (RWD/InputArea bug)
- File: `apps/web/src/components/EditorArea.tsx`
- Change: per-tab div `flex flex-1` → `flex flex-1 min-w-0`
- Root cause: same overflow issue; causes ChatInput max-w-[680px] to center within 762px instead of viewport, creating ~41px invisible left margin on mobile
- Test: verify active tab div has min-w-0
