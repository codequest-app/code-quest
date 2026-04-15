## Context

Claude CLI 已有 `side_question` control request subtype，server 可透過 `ch.sendRequest('message:side_question', { question })` 對 Claude process 發問，取得獨立回答而不影響主對話。現有 `chat:rewind_code` → `ch.sendRequest('message:rewind', ...)` 是完全相同的 pattern，可直接照抄。

目前 `/btw` 尚未出現在 slash command 清單中；compose 端的 slash command 執行走 `executeSlashCommand(cmd)` → 送 message 給 Claude，**不適用**於 side_question（side question 是 control request，不是 user message）。需要在 channel context 加一個獨立 action。

## Goals / Non-Goals

**Goals:**
- 使用者在 compose 輸入 `/btw <question>`，觸發 side_question control request
- 回答以 dialog overlay 顯示於 ChatPanel 內（absolute 定位，不影響主對話）
- Dialog 使用 `MarkdownContent` 渲染回答（支援 code block、格式等）
- Loading 狀態、error 狀態、空答案皆有對應 UI

**Non-Goals:**
- 回答不寫入主對話 message list
- 不支援 side question 的歷史紀錄
- 不支援 side question 串接追問

## Decisions

### 1. `/btw` 的 compose 執行路徑

`executeSlashCommand` 會把 command 文字作為 user message 送給 Claude，不適用。改用 `insertSlashCommand` 填入文字後由 ChatInputArea 辨識，或直接在 `command-menu-items` 加一個 `action` type item 執行自訂邏輯。

**選擇**：在 `command-menu-items` 加 `/btw` item，`onSelect` 時取 slash filter 後面的文字呼叫新的 context action `askSideQuestion(question)`。這樣不需要改變現有 submit/execute 路徑。

### 2. Server RPC 命名

照 `chat:rewind_code` 的模式，新增 socket event `chat:ask_side_question`，payload `{ question: string }`，callback 回傳 `RpcResult<{ answer: string }>`。

### 3. SideQuestionDialog 定位

照 `SessionDropdown` 的模式：在 ChatPanel 內以 `absolute inset-0 z-30` overlay，dialog 本體 `max-w-[600px] w-full mx-auto mt-[15vh]` 垂直偏上置中（不要正中央，避免遮住 compose area）。

### 4. Dialog 內容渲染

直接使用 `MarkdownContent` 吃 `answer: string`，不構造假 Message 物件，不進 messages[] state。Dialog 自持 `{ loading, answer, error }` local state。

### 5. question 的取得方式

`/btw` 輸入格式為 `/btw <question text>`，slash filter = `btw`，但實際的 question 是 `/btw ` 之後的全文。在 command menu 執行時從 `compose.value` 截取 `/btw ` 之後的部分。

## Risks / Trade-offs

- [Risk] `side_question` control request 在 Claude process 非 idle 時的行為未知 → 由 server 直接發送，Claude 本身處理排隊；若 Claude 忙碌回傳 error，dialog 顯示 error 訊息即可
- [Risk] question 為空時觸發 → client 端 guard：question trim 後為空則不送出，command menu item disabled

## Open Questions

(none)
