## Context

目前 `ChatPanel.tsx` 是一個 God component，同時負責：
1. Layout（HeaderBar、MessageList、ChatInputArea、RawEventPanel 的位置）
2. Business logic（resume、pendingDiffReview、pendingElicitation、activeSidePanel 狀態、hotkeys、command palette 註冊）

呼叫端 `TabContent`（在 `TabContainer.tsx`）只傳入 `title` prop，無法從外部 inject 任何內容。`RawEventPanel` 用 `fixed/absolute` 定位，跟 layout 脫節。

## Goals / Non-Goals

**Goals:**
- `ChatPanel` 成為純 layout compound component，提供四個 slot
- `ChatSession` 承接所有 business logic，組裝 `ChatPanel` slots
- `TabContent` 改用 `ChatSession`，可讀性提升
- 行為不變，現有測試全數通過（搬移後）

**Non-Goals:**
- 不改變 `RightPane`（Files/Git/Spec）的位置
- 不新增 `ChatPanel.Side` 的實際內容（此次只建立 slot 機制）
- 不修改 `ChatInputArea` 內部邏輯

## Decisions

### D1：Slot 萃取方式 — `React.Children` type check

使用 `React.Children.forEach` + `child.type === ChatPanel.Header` 比對，將子節點分類到各 slot。

**選擇原因**：簡單直接，不需要額外 context。適用於 `TabContent` 這種單一組裝點（不會有動態 wrapper 包住 slot）。

**Alternative considered**：Named props（`header={...}`、`body={...}`）。較穩健但失去 JSX slot 語法的可讀性優勢，與使用者需求不符。

**Alternative considered**：Context-based slot（Radix 風格）。過於複雜，對此 use case 沒有額外價值。

### D2：Business logic 的新家 — `ChatSession`

原本 `ChatPanel` 的所有 hooks 和 state 移到新的 `ChatSession.tsx`，`ChatSession` 內部組裝 `<ChatPanel>` slots。

**選擇原因**：
- `ChatSession` 清楚表達「一個有狀態的 chat 工作階段」
- `ChatPanel` 清楚表達「chat 的 layout panel」
- 測試分離：layout 測試 vs behavioral 測試

### D3：`RawEventPanel` 透過 `ChatPanel.Side` 傳入

原本 `RawEventPanel` 用 `fixed inset-0` + `md:static` 的 hack。改由 `ChatSession` 控制 `activeSidePanel` 狀態，並將 `RawEventPanel` 放入 `ChatPanel.Side` slot，由 `ChatPanel` 負責 side panel 的 layout 位置（`w-72 shrink-0`）。

### D4：Dialogs 留在 `ChatSession`

`ContentPreviewDialog`、`ElicitationDialog`、`SideQuestionDialog` 不屬於任何 slot（它們是 overlay），繼續在 `ChatSession` 層級 render，不放入任何 slot。

## Risks / Trade-offs

- `React.Children` type check 在 slot 被額外 wrapper 包住時會失效 → 透過測試保護，`TabContent` 是唯一組裝點，不會有此問題
- `ChatSession` 命名可能讓人以為是 context 或 socket session → 可考慮 `ChatView`，但 `ChatSession` 更貼切（對應一個 channel session）
