## Context

目前 Message union 裡 assistant 的 thinking/text/tool_use 各是獨立 Message。API 一個 message 可能包含多個 content blocks，但我們拆開後失去 turn 邊界，導致 per-turn metadata（model, usage, stopReason）無法關聯，streaming reconciliation 依賴 3 個 boolean flags。

Extension 用 assembler 模式：一個 message 物件從頭累加到尾，不拆。

## Goals / Non-Goals

**Goals:**
- 一個 API message = 一個 AssistantTurn（含 blocks[], model, usage, stopReason）
- 每個 block 有獨立 id，parentToolUseId 在 block 層級
- Live streaming 和 replay 統一路徑（差別只是 blocks 逐步 vs 一次填入）
- 消除 isTextStreaming / isThinkingStreaming / wasStreamedViaDelta flags
- tool_result patch 到 turn.blocks[] 裡的對應 block
- Collapse 規則：各 block 各自 collapse，最後一個 turn 的 tool_use defaultOpen=true
- local_agent result → markdown，local_bash result → bash output
- UI 視覺結果等價（expect 不變），不新增 per-turn tag（留給下個 change）
- TDD：測試從 protocol 送到前端，Storybook 同步更新

**Non-Goals:**
- 不做 per-turn tag UI（model · ↑tokens ↓tokens · $cost）— 下個 change
- 不做底部 token bar — 下個 change
- 不改 server / summoner
- 不改 ToolUseBlock / ThinkingBlock / DiffViewer 等 block renderer 元件

## Decisions

### 1. AssistantTurn type

```ts
interface Block {
  id: string;
  type: 'thinking' | 'text' | 'tool_use';
  content: string;
  meta?: Record<string, unknown>;
  parentToolUseId?: string;
}

interface AssistantTurn {
  id: string;
  role: 'assistant';
  type: 'assistant_turn';
  timestamp: number;
  model?: string;
  messageId?: string;       // API message id
  blocks: Block[];
  usage?: { inputTokens: number; outputTokens: number; ... };
  stopReason?: string;
  isStreaming?: boolean;
}
```

加入 Message union type。現有的 `type: 'text' | 'thinking' | 'tool_use'` role=assistant messages 逐步遷移到 AssistantTurn。

### 2. Handler 流程

**Live streaming：**
```
message_start     → 建 AssistantTurn（model, usage, isStreaming=true）
block_start       → push empty Block 到 turn.blocks[]
                    tool_use: Block { type:'tool_use', id:blockId, content:name, meta:{toolId, input:{}} }
                    text/thinking: Block { type, id:blockId, content:'' }
chunk(text)       → append to turn.blocks[last text block].content
chunk(thinking)   → append to turn.blocks[last thinking block].content
chunk(input_json) → append to turn.blocks[streamingToolUseId].meta.partialInput
block_stop        → 標記 block 完成，清 streamingToolUseId
message_delta     → 更新 turn.usage.outputTokens, turn.stopReason
message_stop      → turn.isStreaming = false
message:assistant → patch turn：用 toolId 更新 blocks 的完整 input，清 partialInput
```

**Replay：**
```
message:assistant → 建完整 AssistantTurn（blocks 已有完整 content/input）
                    沒有 streaming 事件，直接一次建好
```

### 3. Streaming flags 簡化

移除 `isTextStreaming`、`isThinkingStreaming`、`wasStreamedViaDelta`。

改用：
- `turn.isStreaming: boolean` — turn 級別，message_start 設 true，message_stop 設 false
- `streamingToolUseId?: string` — 保留，用於 input_json chunk 定位

`message:assistant` handler 判斷邏輯：
- 找到 turn（by messageId 或最後一個 isStreaming=true 的 turn）→ patch blocks
- 沒找到 → 建新 turn（replay 路徑）

### 4. tool_result 關聯

```ts
// 掃 messages[] 裡所有 assistant_turn，搜尋 turn.blocks[] 找 toolId 匹配
function patchToolResult(state, toolUseId, result) {
  return { ...state, messages: state.messages.map(m => {
    if (m.type !== 'assistant_turn') return m;
    const blockIdx = m.blocks.findIndex(b => b.meta?.toolId === toolUseId);
    if (blockIdx === -1) return m;
    // patch block meta.result
  })};
}
```

### 5. Collapse 規則

- thinking block → 永遠 defaultOpen=false
- tool_use block → defaultOpen 取決於是否在最後一個 turn
- text block → 不 collapse

判斷「最後一個 turn」：在 MessageList render 時，找 messages[] 最後一個 `type === 'assistant_turn'` 的 index，傳 `isLastTurn` prop 給 renderer。

### 6. local_agent / local_bash result 渲染

在 ToolUseBlock 裡（或 task 相關元件），根據 `taskType` 決定 result 的渲染方式：
- `local_agent` → MarkdownContent
- `local_bash` → OutputContent（支援 ANSI）
- 其他 → 現有 ContentRenderer

### 7. 遷移策略

TDD 先寫測試（protocol → handler → 驗證 ChannelState），再改 handler，最後改 renderer。測試用 fake summoner 送完整 protocol 序列。

現有的 `type: 'text' | 'thinking' | 'tool_use'` role=assistant Messages 保留在 union type 裡做 backwards compat（舊的 test/story fixtures），但新的 handler 只產出 `assistant_turn`。

## Risks / Trade-offs

- **[Risk] 大量測試需要更新** — 現有測試直接檢查 `messages[0].type === 'text'`，要改成檢查 `messages[0].blocks[0].type === 'text'`。用 TDD 逐步遷移。
- **[Risk] DOM 結構改變** — 從每個 block 一個 ChatMessage 變成一個 turn 一個 ChatMessage。CSS/layout 需要驗證。
- **[Trade-off] Block 有獨立 id** — 增加資料量，但 fork/rewind 需要精確定位。
- **[Trade-off] 保留舊 Message types 做 compat** — 型別 union 變大，但避免一次性大爆炸遷移。
