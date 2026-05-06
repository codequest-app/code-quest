## 1. TDD — ChatPanel layout tests (Red)

- [x] 1.1 建立 `ChatPanel.test.tsx`，測試 Header slot 渲染內容
- [x] 1.2 加入 Body slot 測試
- [x] 1.3 加入 Footer slot 測試
- [x] 1.4 加入 Side slot 有/無時的渲染測試
- [x] 1.5 加入無 children 不 crash 測試

## 2. TDD — ChatSession behavioral tests (Red)

- [x] 2.1 建立 `ChatSession.test.tsx`，從 `ChatPanel.test.tsx` 複製所有 behavioral 測試，改 import 為 `ChatSession`

## 3. 實作 ChatPanel compound component (Green)

- [x] 3.1 重寫 `ChatPanel.tsx` 為純 layout，定義 `ChatPanel.Header`、`ChatPanel.Body`、`ChatPanel.Footer`、`ChatPanel.Side` 四個 slot component
- [x] 3.2 `ChatPanel` 用 `React.Children.forEach` 萃取各 slot，render 到正確 layout 位置
- [x] 3.3 Side slot 有內容才 render side panel 容器（`w-72 shrink-0`）
- [x] 3.4 確認 ChatPanel layout tests 全綠

## 4. 實作 ChatSession (Green)

- [x] 4.1 建立 `ChatSession.tsx`，搬入原 `ChatPanel` 的所有 hooks 和 state
- [x] 4.2 `ChatSession` 內部組裝 `<ChatPanel>` slots（Header=HeaderBar、Body=MessageList、Footer=ChatInputArea、Side=RawEventPanel）
- [x] 4.3 Dialogs（ContentPreviewDialog、ElicitationDialog、SideQuestionDialog）在 `ChatSession` 層級 render
- [x] 4.4 確認 ChatSession behavioral tests 全綠

## 5. 更新呼叫端

- [x] 5.1 `TabContainer.tsx` `TabContent` 改用 `<ChatSession title={title} />` 替換 `<ChatPanel title={title} />`
- [x] 5.2 移除舊 `ChatPanel.test.tsx` 的 behavioral 測試（已移至 ChatSession.test.tsx）、改為 layout 測試

## 6. 收尾驗證

- [x] 6.1 執行全部測試確認全綠
- [x] 6.2 確認 TypeScript 無 error

## 7. Overlay 清理 — 將 overlay 元件移出 slot (Red → Green)

- [x] 7.1 加入測試：`SideQuestionDialog` 不在 `ChatPanel.Body` 的 DOM 子樹內
- [x] 7.2 加入測試：`SessionHistoryPopover` 不在 `ChatPanel.Header` 的 DOM 子樹內（`Popover.Root` 提升至 `ChatSession` 層級）
- [x] 7.3 將 `SideQuestionDialog` 從 `ChatPanel.Body` 移至 `ChatSession` 頂層
- [x] 7.4 將 `Popover.Root` 提升至 `ChatSession` 頂層，`SessionHistoryPopover` 移出 Header slot
- [x] 7.5 確認所有測試全綠、TypeScript 無 error

## 8. HeaderBar 自包含 resume popover

- [x] 8.1 加入測試：點擊 Session history 按鈕，popover 由 `HeaderBar` 內部控制（驗證 `HeaderBar` 有 `onResumed` prop）
- [x] 8.2 將 `Popover.Root`、`resumeOpenSignal`、`SessionHistoryPopover` 移入 `HeaderBar`，新增 `onResumed` prop
- [x] 8.3 `ChatSession` header slot 改為 `<HeaderBar title={title} showResumeButton onResumed={handleResumed} />`
- [x] 8.4 確認所有測試全綠、TypeScript 無 error

## 9. TabBar divider 修正 — main worktree 不應被視為 linked worktree

**問題**：`findWorktreeByCwd` 把 `path === projectCwd` 的 main worktree 也 match 到，
導致 main branch tab 被賦予 `worktree` prop、擁有 non-null group key，
divider 因此出現在錯誤位置（worktree tab 排序亦因全部 non-null 而失準）。

- [x] 9.1 加入測試：main-tree tab（cwd === projectCwd）不顯示 scope tag、排在 worktree tab 之前、兩者之間出現一個 divider
- [x] 9.2 修正 `findWorktreeByCwd`：排除 `w.path === projectCwd` 的 entry（main worktree）
- [x] 9.3 確認所有測試全綠、TypeScript 無 error
