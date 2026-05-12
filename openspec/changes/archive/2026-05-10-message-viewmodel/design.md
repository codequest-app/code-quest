## Context

現在 `renderBody()` 是一個大 switch，直接把 `message.meta` 丟給 component。Component（如 `ToolUseBlock`）再自己從 meta + `useChannelStore(tasks)` 組裝顯示資料。資料組裝散在 handler → tree → component 三處。

`message-render-primitives` change 已完成，render 層的 component 已拆為組合式 primitives（Highlight、Copyable、Labeled、Pre）。現在可以在 primitives 上層加 ViewModel 轉換。

## Goals / Non-Goals

**Goals:**
- 集中資料組裝：`toViewModel(node, ctx)` 一個函式產出所有 render 需要的資料
- Component 純呈現：不從 store 讀資料，不解構 meta
- 漸進遷移：一個 message type 一個 type 切過去，新舊並存
- 最終移除 `mergeToolResult`：tool_result 保留為獨立 message
- TDD：既有 expect 不變或等價

**Non-Goals:**
- 不改 handler / state 層的資料流
- 不改 socket event 格式
- 不改 buildMessageTree 的 tree 結構和 nestChild 邏輯

## Decisions

### ViewModel 型別

```ts
interface ViewModelContext {
  tasks: Map<string, Task>;
}

// tool_use 相關
type ToolUseViewModel =
  | { kind: 'bash'; toolId: string; command: string; description?: string;
      result?: string; isError?: boolean; task?: Task }
  | { kind: 'read'; toolId: string; filePath: string;
      content?: string; lang: string; task?: Task }
  | { kind: 'edit'; toolId: string; filePath: string;
      oldStr?: string; newStr?: string; task?: Task }
  | { kind: 'agent'; toolId: string; description: string;
      subagentType?: string; task?: Task; result?: string }
  | { kind: 'tool-use'; toolId: string; toolName: string;
      input: Record<string, unknown>; result?: string;
      isError?: boolean; taskType?: string; task?: Task }

// 其他 message type
type MessageViewModel =
  | { kind: 'text'; content: string; role: string;
      citations?: Citation[]; renderAs?: string }
  | { kind: 'thinking'; content: string; budgetTokens?: number;
      durationMs?: number; isStreaming?: boolean }
  | { kind: 'result'; stats: ChatStats }
  | { kind: 'error'; detail: string }
  | { kind: 'hook-started'; hookName?: string; hookEvent?: string }
  | { kind: 'hook-response'; hookName?: string; output?: string }
  // ... 其他 1:1 對應

type ViewModel = ToolUseViewModel | MessageViewModel
```

### 轉換函式

```ts
function toViewModel(node: MessageNode, ctx: ViewModelContext): ViewModel {
  const { message } = node;
  switch (message.type) {
    case 'tool_use':
      return toToolUseViewModel(message, ctx);
    case 'assistant_turn':
      return toAssistantTurnViewModel(message, ctx);
    // ... 每個 type 一個 case
  }
}

function toToolUseViewModel(message: Message, ctx: ViewModelContext): ToolUseViewModel {
  const { toolId, input, result } = message.meta;
  const task = ctx.tasks.get(toolId);
  const toolName = message.content;

  switch (toolName) {
    case 'Bash':
      return { kind: 'bash', toolId, command: String(input.command ?? ''),
               description: input.description, result: result?.content,
               isError: result?.is_error, task };
    case 'Read':
      return { kind: 'read', toolId, filePath: String(input.file_path ?? ''),
               content: result?.content, lang: langFromPath(...), task };
    // ...
  }
}
```

### Children 處理

```ts
// children 遞迴用同一個 ctx
interface ViewModelNode {
  vm: ViewModel;
  children: ViewModelNode[];
}

function toViewModelNode(node: MessageNode, ctx: ViewModelContext): ViewModelNode {
  return {
    vm: toViewModel(node, ctx),
    children: node.children.map(child => toViewModelNode(child, ctx)),
  };
}
```

### 遷移策略

1. 建 ViewModel 型別 + `toViewModel` 函式
2. 先遷移 `tool_use`（最複雜）：`ToolUseBlock` 改為接受 ViewModel
3. 逐一遷移其他 type（text、thinking、result、error ...）
4. `renderBody` 改為 `toViewModel` → `ViewModelRenderer`
5. 最後移除 `mergeToolResult`，tool_result 改為 ViewModel 轉換時 lookup

### mergeToolResult 移除時機

Phase 1（本 change）：ViewModel 從已 merge 的 `meta.result` 讀資料，`mergeToolResult` 保留
Phase 2（本 change 後段）：
- `buildMessageTree` 不再呼叫 `mergeToolResult`
- tool_result 保留為獨立 MessageNode
- `toViewModel` 用 `toolId` 從 flat list lookup result
- 需要改 `buildMessageTree` 的 toolUseNodes Map 同時存 result

## Risks / Trade-offs

- **漸進遷移期** — `renderBody` 裡新舊並存，部分走 ViewModel 部分直接 render。用 feature flag 或 type check 分流。
- **ViewModel 型別數量多** — MessageType 有 25+ 種。但大部分很簡單（1:1 mapping），只有 tool_use 需要拆分。
- **mergeToolResult 移除** — 最大風險。放在最後一步，有完整測試保護。
