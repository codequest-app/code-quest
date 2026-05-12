## 1. 建 NodeContent（wrap 現有 renderBody）

先建一個 thin wrapper，讓呼叫方可以切換，不改內部邏輯。

- [x] 1.1 建 `NodeContent` component — 內部讀 store + 呼叫 `renderBody`
- [x] 1.2 測試：2067 tests green（行為完全不變）

## 2. 切換呼叫方

逐一把 `ChatMessage` 替換成 `NodeContent`。

- [x] 2.1 `CollapsibleTimeline` — `TimelineRow` 的 `ChatMessage` → `NodeContent`
- [x] 2.2 `MessageList` — 單獨 node 的 `ChatMessage` → `NodeContent`
- [x] 2.3 `SubagentChildren` — 已間接完成（內部用 CollapsibleTimeline 已切換）
- [x] 2.4 測試：2067 tests green

## 3. NodeContent 內化（不再呼叫 renderBody）

用 if + early return 取代 switch，每個 type 直接 render 對應 Content，不經 ViewModel。

- [x] 3.1 text/thinking/error/result/hooks 等直接 render
- [x] 3.2 tool_use 暫時用 buildToolUseVm（過渡）
- [x] 3.3 assistant_turn blocks 遞迴
- [x] 3.4 ToolUseBlock 改為 typed props（刪 buildToolUseVm + vm prop）
- [x] 3.5 user message 的 bg-surface / attachments / MessageActions 在 NodeContent
- [x] 3.6 assistant message 的 Copyable / showCopy 在 NodeContent
- [x] 3.7 測試：2051 tests green
- [x] 3.8 後續可改為 lookup map（renderer registry）— 決定保持 switch，不做 registry

## 4. 刪除中間層

- [x] 4.1 刪除 `viewmodel/` 目錄（toViewModel + 所有 ViewModel types + 16 tests）
- [x] 4.2 `ChatMessage` 改為 thin wrapper（test backward compat）
- [x] 4.3 `MessageContent` 改為 re-export `renderBody` from NodeContent
- [x] 4.4 ChatMessage.test.tsx → NodeContent.test.tsx（已 rename + import 改 NodeContent）
- [x] 4.5 results 移到 ChannelStore（handler 寫，NodeContent 用 useChannelStore 讀）
- [x] 4.6 刪除 ToolResultsContext + buildMessageTreeWithResults
- [x] 4.7 測試：2050 tests green

## 6. 後續（已在 flat-message-rendering 完成或另開 change）

- [x] 6.1 `CollapsibleTimeline` 改接 `Message[]`（在 flat-message-rendering 完成）
- [ ] 6.2 `CollapsibleTimeline` 拆分為 `Timeline` + `ToolGroup` + `Collapsible`（另開 change）
