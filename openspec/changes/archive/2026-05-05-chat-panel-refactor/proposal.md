## Why

`ChatPanel` 目前同時承擔 layout 組裝與所有 business logic（resume、diff review、elicitation、hotkeys、side panel 狀態），導致元件難以閱讀且無法從外部 inject 內容。將其重構為 Compound Component 可讓呼叫端（`TabContent`）決定各區塊的內容，同時讓 `ChatPanel` 本身只負責 layout。

## What Changes

- **新增** `ChatPanel` Compound Component：純 layout shell，提供 `ChatPanel.Header`、`ChatPanel.Body`、`ChatPanel.Footer`、`ChatPanel.Side` 四個 slot
- **新增** `ChatSession` 元件：承接原 `ChatPanel` 的所有 business logic，內部使用 `ChatPanel` 組裝 slots
- **修改** `TabContainer.tsx` `TabContent`：改用 `<ChatSession>` 替換原本的 `<ChatPanel title={title} />`
- **修改** `ChatPanel.test.tsx`：測試目標改為 layout 驗證（slots 是否正確渲染）
- **新增** `ChatSession.test.tsx`：從原 `ChatPanel.test.tsx` 搬移所有 behavioral 測試
- **移動** `RawEventPanel`：從 `ChatPanel` 內部的 floating div 改為透過 `ChatPanel.Side` slot 傳入

## Capabilities

### New Capabilities

- `chat-panel-compound`: `ChatPanel` 作為純 layout compound component，支援 Header / Body / Footer / Side 四個 slot 的 inject

### Modified Capabilities

- `layout-shell`: `ChatPanel` 不再是 God component，layout 與 logic 職責分離

## Impact

- `apps/web/src/components/chat/ChatPanel.tsx` — 重寫為 compound layout
- `apps/web/src/components/chat/ChatSession.tsx` — 新增，承接 business logic
- `apps/web/src/components/workspace/TabContainer.tsx` — `TabContent` 改用 `ChatSession`
- `apps/web/src/components/chat/__tests__/ChatPanel.test.tsx` — 改為 layout 測試
- `apps/web/src/components/chat/__tests__/ChatSession.test.tsx` — 新增，behavioral 測試
