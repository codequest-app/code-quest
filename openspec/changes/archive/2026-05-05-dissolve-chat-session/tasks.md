## 1. 刪除 OnboardingOverlay

- [x] 1.1 刪除 `OnboardingOverlay.tsx`、`OnboardingOverlay.stories.tsx`、`OnboardingOverlay.test.tsx`

## 2. 建立 ChannelOverlays（獨立，無依賴）

- [x] 2.1 建立 `ChannelOverlays.tsx`：自帶 `useChannelControl` + `useBtwState`，渲染 ContentPreviewDialog / ElicitationDialog / SideQuestionDialog
- [x] 2.2 為 `ChannelOverlays` 補測試

## 3. 消除 ChatSession（一次完成）

以下所有子任務在同一個 commit 完成：

- [x] 3.1 `TabContent` 直接組合 `ChatPanel`，加入 `ChannelOverlays` 至 `ChatPanel.Body`
- [x] 3.2 `TabContent` 加入 `handleResumed` routing 邏輯，傳入 `ResumeButton`
- [x] 3.3 `MessageList` 自帶 `registerJumpTo` / `unregisterJumpTo`（從 ChatSession 移入）
- [x] 3.4 `MessageList` 自帶 `mod+f` hotkey（openPalette messages tab）
- [x] 3.5 `ChatInputArea` 自帶 `/` hotkey（focusTextarea）
- [x] 3.6 刪除 `ChatSession.tsx` 和對應測試，補 `ChatView` 整合測試

## 4. 移動 RightPane（最後）

- [x] 4.1 `TabContainer` 加入 `rightOpen` state（從 `WorkspaceLayout` 移入）
- [x] 4.2 `WorkspaceLayout` 移除 `rightOpen` state、右側 `DrawerAside`、`onToggleRight`
- [x] 4.3 `WorkspaceTopbar` 移除 `onToggleRight` prop 和對應按鈕
- [x] 4.4 `TabContent` 根據 `rightOpen` 決定是否渲染 `ChatPanel.Side`（`RightPane`）

## 5. 收尾

- [x] 5.1 確認所有現有測試通過，更新受影響的測試（1939 passed）
- [x] 5.2 確認 RightPane 在 `ChatPanel.Side` 的視覺與行為正確（TabBar 完整寬度）
