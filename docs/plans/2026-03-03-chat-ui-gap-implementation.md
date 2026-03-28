# Chat UI Gap Analysis & Implementation Plan

Date: 2026-03-03
Source: `docs/ui/` (VS Code extension UI docs) + `docs/protocol/` (CLI protocol docs) vs current codebase

---

## Gap Summary

Cross-referencing protocol/UI documentation against current implementation revealed **14 gaps** grouped by priority. **All 10 P0+P1 gaps have been implemented.**

### Priority Legend
- **P0** — High impact, improves daily usage
- **P1** — Medium impact, completes feature parity
- **P2** — Low impact, VS Code-specific or complex

---

## P0 — High Impact (All Complete)

### Gap 1. Proactive Suggestion Cards ✅

**Files changed**: `socket-events.ts` (Suggestion type), `SuggestionsPanel.tsx`, `SuggestionsPanel.stories.tsx`, `SuggestionsPanel.test.tsx`

Added `title?` and `description?` to Suggestion interface. SuggestionsPanel renders card-style layout when title present, falls back to pill-style for prompt-only.

---

### Gap 2. Usage Quota Bars ✅

**Files changed**: `socket-events.ts` (UsageQuota types), `chat-store.ts`, `use-chat.ts`, `UsageBar.tsx` (new), `StatsBar.tsx`, `UsageBar.stories.tsx`, `UsageBar.test.tsx`

Progress bars with color coding (green ≤50%, yellow 50-80%, red >80%) for each quota tier. Integrated into StatsBar.

---

### Gap 3. @ Mention with File Search ✅

**Files changed**: `socket-events.ts` (FileSearchResult, file:search), `schemas/chat.ts`, `ChatInput.tsx`, `ChatPanel.tsx`, `use-chat.ts`, `chat-handler.ts`, `ChatInput.test.tsx`, `ChatInput.stories.tsx`

Async file search with 200ms debounce. Server handler walks filesystem (depth 4, skips node_modules/.git). Dropdown shows file/directory icons.

---

### Gap 4. Inline Diff Accept/Reject ✅

**Files changed**: `DiffViewer.tsx` (new, extracted from ChatMessage), `ChatMessage.tsx`, `use-chat.ts`, `DiffViewer.test.tsx`, `DiffViewer.stories.tsx`

Accept/Reject buttons on editable diffs. Read-only diffs (rewind preview) show no buttons.

---

### Gap 5. Subagent Stop Button ✅

**Files changed**: `socket-events.ts` (ChatStopTaskPayload), `schemas/chat.ts`, `MessageList.tsx`, `use-chat.ts`, `chat-handler.ts`, `MessageList.test.tsx`

■ stop button in SubagentChildren header. Emits `chat:stop_task` with task_id.

---

## P1 — Medium Impact (All Complete)

### Gap 6. Git Status Display ✅

**Files changed**: `socket-events.ts` (Git types), `schemas/chat.ts`, `GitStatusPanel.tsx` (new), `use-chat.ts`, `chat-handler.ts`, `GitStatusPanel.test.tsx`, `GitStatusPanel.stories.tsx`

Shows branch name, clean/dirty indicator, changed files with colored status badges (M=yellow, A=green, D=red). Server runs `git status --porcelain` and `git checkout`.

---

### Gap 7. Notification with Action Buttons ✅

**Files changed**: `socket-events.ts` (NotificationPayload/Response), `use-chat.ts`, `use-chat.test.ts`

Server emits `notification` with buttons array. Client renders toast via sonner with action buttons. Callback sends `{ buttonValue }` on click or `{}` on dismiss.

---

### Gap 8. File Change Tracking ✅

**Files changed**: `socket-events.ts` (file_updated event), `chat-store.ts`, `use-chat.ts`, `StatsBar.tsx`, `StatsBar.test.tsx`, `StatsBar.stories.tsx`

`file_updated` stream events tracked in store. StatsBar shows "N files modified" badge with expandable file list.

---

### Gap 9. Plugin Management Panel ✅

**Files changed**: `socket-events.ts` (Plugin types), `schemas/chat.ts`, `PluginPanel.tsx` (new), `use-chat.ts`, `PluginPanel.test.tsx`, `PluginPanel.stories.tsx`

Lists plugins with name/version/description, toggle enabled/disabled, install/uninstall buttons. "Restart required" banner.

---

### Gap 10. Auth/Login UI ✅

**Files changed**: `socket-events.ts` (Auth types), `chat-store.ts`, `LoginOverlay.tsx` (new), `use-chat.ts`, `LoginOverlay.test.tsx`, `LoginOverlay.stories.tsx`

Full-screen login overlay with OAuth button, loading state, error display. Hidden when authenticated.

---

## P2 — Low Impact / Complex (Deferred)

### Gap 11. Plan Comment System
**Complexity**: High — needs Markdown preview panel with text selection handling.

### Gap 12. Speech-to-Text
**Complexity**: Medium — needs browser MediaRecorder API or server-side STT.

### Gap 13. Remote Sessions / Teleportation
**Complexity**: High — requires remote session storage + git branch management.

### Gap 14. Experiment Gates
**Complexity**: Low code, but needs design decision on which features to gate.

---

## Verification Results

```
Client: 36 test files, 422 tests passed
Server: 7 test files, 90 tests passed
TypeScript: no errors (tsc --noEmit clean)
```
