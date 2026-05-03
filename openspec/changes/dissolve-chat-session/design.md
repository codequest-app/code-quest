## Context

`ChatSession` 目前混合三個不同層次的關注點：
1. Chat UI layout（組合 ChatPanel slots）
2. Channel 事件 dialogs（ContentPreviewDialog、ElicitationDialog 等）
3. Tab / navigation routing（handleResumed、replaceTab）

`ChatPanel` 剛被重構為 compound component，但因為被 `ChatSession` 私有包覆，無法作為 workspace 層直接使用的 layout primitive。`RightPane` 也因此卡在 workspace 層的 `DrawerAside`，讓 TabBar 的可用寬度被壓縮。

## Goals / Non-Goals

**Goals:**
- 消除 `ChatSession`，讓每個關注點回到正確層次
- `ChatPanel` 成為 `TabContent` 直接組合的 public layout API
- `RightPane` 移入 `ChatPanel.Side`，TabBar 獲得完整寬度
- Chat 相關的 dialogs 以自給自足的 `ChannelOverlays` 封裝，放在 `ChatPanel.Body` 內
- Tab routing 邏輯（handleResumed）移至 `TabContent`

**Non-Goals:**
- 不改變任何現有的 UI 外觀或互動行為
- 不重構 `ChatPanel` 本身的 compound component 結構
- 不移動 `RightPane` 的內容（Files / Git / Spec tabs）

## Decisions

**D1：`TabContent` 直接組合 `ChatPanel`**

```
TabContent (ChannelProvider)
  ├── ChannelOverlays        ← channel 事件層（dialogs）
  └── ChatPanel
        ├── Header: HeaderBar + ResumeButton(onResumed from TabContent) + WorktreeBanner
        ├── Body: MessageList（自帶 registerJumpTo + mod+f hotkey）
        ├── Footer: ChatInputArea（自帶 / hotkey）
        └── Side: RightPane（rightOpen 由 TabContainer 控制）
```

**D2：`ChannelOverlays` 放在 `ChatPanel.Body` 內**

Dialogs 是 portal，放在哪都能浮出。放在 Body 內語義清楚（「這些是 chat 互動的一部分」），且讓 ChatPanel 完全自足，不需要外部額外掛載。

**D3：`rightOpen` state 移至 `TabContainer`**

`TabContainer` 持有 `rightOpen` 狀態，透過 `TabContent` props 傳入，決定是否在 `ChatPanel.Side` 渲染 `RightPane`。`WorkspaceTopbar` 的 `onToggleRight` 按鈕移除，toggle 按鈕日後可加在 `HeaderBar`（透過 TabContent 傳入 HeaderBar children）。

**D4：`ResumeButton` 的 `onResumed` 由 `TabContent` 提供**

routing 邏輯（`replaceTab`、`setActiveProject`、`requestActivateChannel`）上移至 `TabContent`，`ResumeButton` 保持 presentational，僅負責 UI 觸發。

**D5：`MessageList` 自帶 `registerJumpTo`，`ChatInputArea` 自帶 `/` hotkey**

這些 side effects 屬於各自組件的職責，不需要在外層協調。

## Risks / Trade-offs

- `TabContent` 變重：原本 ChatSession 的邏輯分散到 TabContent + 各子組件。可讀性需靠清楚的組件命名和分層來維持。
- `ChannelOverlays` 是新概念：需確保它只讀 hooks，不接受任何 props，維持自給自足。
- `mod+f` hotkey 從 ChatSession 移至 MessageList，需確認 hotkey scope 在新位置仍然正確（只在 chat 視窗 focused 時觸發）。
