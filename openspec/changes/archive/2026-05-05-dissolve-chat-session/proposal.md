## Why

`ChatSession` 是一個混合了 chat UI、channel dialogs、tab routing 邏輯的組件，導致關注點不清晰，也讓 `ChatPanel` 無法作為 workspace 層直接組合的 layout primitive。消除 `ChatSession`，讓每個關注點回到它真正屬於的層次。

## What Changes

- **BREAKING** 移除 `ChatSession` 組件
- `ChatPanel` 升為 `TabContent` 直接組合的 public layout API
- `TabContent` 負責組合 `ChatPanel` 的所有 slots，並傳入 tab 層的 callbacks（`onResumed`）
- `ChannelOverlays` 新組件：將 `ContentPreviewDialog`、`ElicitationDialog`、`SideQuestionDialog`、`OnboardingOverlay` 集中為自給自足的 channel 事件層，放在 `ChatPanel.Body` 內
- `ResumeButton` 的 `onResumed` routing 邏輯（`replaceTab`、`setActiveProject`、`requestActivateChannel`）上移至 `TabContent`
- `MessageList` 自帶 `registerJumpTo`（scroll → CommandPalette 綁定）
- `ChatInputArea` 自帶 `/` hotkey（focusTextarea）
- `RightPane` 移入 `ChatPanel.Side`，由 `TabContent` 的 `rightOpen` 狀態控制，TabBar 因此獲得完整寬度
- `WorkspaceLayout` 移除右側 `DrawerAside` 和 `rightOpen` state

## Capabilities

### New Capabilities

- `channel-overlays`: 自給自足的 channel 事件 dialogs 組件，在 ChannelProvider context 內獨立運作

### Modified Capabilities

（無 spec 層級的行為改變，皆為實作層重組）

## Impact

- `apps/web/src/components/chat/ChatSession.tsx` — 刪除
- `apps/web/src/components/chat/ChatPanel.tsx` — 不變（已是 compound component）
- `apps/web/src/components/workspace/TabContainer.tsx` — TabContent 大幅重寫
- `apps/web/src/components/workspace/WorkspaceLayout.tsx` — 移除 rightOpen / DrawerAside(right)
- `apps/web/src/components/workspace/WorkspaceTopbar.tsx` — 移除 onToggleRight
- `apps/web/src/components/chat/conversation/MessageList.tsx` — 加入 registerJumpTo
- `apps/web/src/components/chat/compose/ChatInputArea.tsx` — 加入 `/` hotkey
- 新增 `apps/web/src/components/chat/ChannelOverlays.tsx`
