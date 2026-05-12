## Context

`renderers/content/` 現有四個 adapter 檔案，每個只是把 `Message` prop 轉給對應的 domain 元件。唯一 caller 是 `NodeContent.tsx`。

## Goals / Non-Goals

**Goals:**
- 消除 `renderers/content/` 這個無意義的 adapter 層
- 把每個元件放到它真正屬於的 domain

**Non-Goals:**
- 修改任何元件的邏輯或 props
- 改動測試行為

## Decisions

**TextContent → inline 進 NodeContent**
只有 5 行 render 邏輯，沒有命名的額外價值。

**ThinkingContent → inline 進 NodeContent**
就是個 null guard + prop spread，inline 更清楚。

**AssistantTurnContent → `conversation/AssistantTurnContent.tsx`**
它組裝 assistant turn 的 block 列表，是 conversation 層的邏輯。

**ToolUseContent + ToolUseBlockWithStore → `tool-use/ToolUseBlock.tsx`**
兩者都是 ToolUseBlock 的呼叫點，屬於 tool-use domain，一起 export。

## Risks / Trade-offs

- NodeContent 會稍微變長，但可讀性不受影響（renderContent 已有 switch-like 結構）
- AssistantTurnContent 的 import path 改變，需更新所有 consumer
