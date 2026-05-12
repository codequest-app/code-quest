## Context

前幾個 change 已完成：
- `message-render-primitives` — 組合式 render primitives
- `message-viewmodel` — ViewModel 層（已刪除，改為直接 typed props）
- `node-content-refactor` — NodeContent switch + results/tasks 在 store

現在 `buildMessageTree` 仍然每次 messages 變化重建整棵 tree。資料應該是 flat 的，tree 是 component 的事。

## Goals / Non-Goals

**Goals:**
- 資料層 flat — messages array + tasks Map + results Map，不建 tree
- State 更新精準 — tool_result/task_progress 只觸發對應 component re-render
- 一次遍歷 — generator pipeline 取代 buildMessageTree + groupForTimeline
- Component 層處理 nesting — `parentToolUseId` 找 children
- TDD：expect 不變或等價

**Non-Goals:**
- 不改 handler / store 層
- 不改 socket event 格式
- 不改 CollapsibleTimeline 的 timeline dots 邏輯（另開 change）
- 不做 incremental append 優化（效能瓶頸不在遍歷）

## Decisions

### 資料結構

```
Store:
  state.messages: Message[]              ← flat array
  state.tasks: Map<toolId, Task>         ← handler 更新
  state.results: Map<toolId, ToolResult> ← handler 更新

不再有：
  MessageNode { message, children }      ← 刪除
  buildMessageTree()                     ← 刪除
```

### Generator Pipeline

```ts
function* renderableGroups(messages: Message[]): Generator<RenderGroup> {
  let timelineGroup: Message[] = [];
  
  for (const msg of messages) {
    if (msg.type === 'tool_result') continue;
    if (msg.parentToolUseId) continue;
    
    const isTimeline = msg.role === 'assistant' && TIMELINE_TYPES.has(msg.type);
    if (isTimeline) {
      timelineGroup.push(msg);
    } else {
      if (timelineGroup.length) {
        yield { kind: 'timeline', messages: timelineGroup };
        timelineGroup = [];
      }
      yield { kind: 'single', message: msg };
    }
  }
  if (timelineGroup.length) {
    yield { kind: 'timeline', messages: timelineGroup };
  }
}
```

一次遍歷，skip tool_result 和 children（parentToolUseId），yield timeline groups 或 single messages。Materialize 成 array 給 virtualizer。

### Children Index

```ts
const childrenIndex = useMemo(() => {
  const index = new Map<string, Message[]>();
  for (const msg of messages) {
    if (msg.parentToolUseId) {
      const arr = index.get(msg.parentToolUseId) ?? [];
      arr.push(msg);
      index.set(msg.parentToolUseId, arr);
    }
  }
  return index;
}, [messages]);
```

Parent component（NodeContent）用 `childrenIndex.get(toolId)` 找 children，自己 render SubagentChildren。

### NodeContent 改接 Message

```tsx
function NodeContent({ message, childrenIndex, ... }) {
  const toolId = message.type === 'tool_use' ? message.meta.toolId : undefined;
  const task = useChannelStore(s => toolId ? s.tasks.get(toolId) : undefined);
  const result = useChannelStore(s => toolId ? s.results.get(toolId) : undefined);
  const children = toolId ? childrenIndex.get(toolId) : undefined;
  
  return (
    <>
      {renderByType(message, task, result)}
      {children && <SubagentLayout>
        {children.map(child => <NodeContent message={child} childrenIndex={childrenIndex} />)}
      </SubagentLayout>}
    </>
  );
}
```

### React.memo 精準 re-render

```tsx
export const NodeContent = memo(function NodeContent({ message, ... }) {
  // message reference 不變 → 不 re-render
  // task/result 從 store 讀 → 只有 store 變才 re-render
});
```

### 遷移策略

1. 建 `renderableGroups` generator + `childrenIndex`
2. `NodeContent` 改接 `Message` 而非 `MessageNode`
3. `CollapsibleTimeline` 改接 `Message[]`
4. 刪除 `buildMessageTree`、`MessageNode`、`nestChild`
5. 加 `React.memo` 確保精準 re-render
6. 刪除 `groupForTimeline`（被 generator 取代）

## Risks / Trade-offs

- **childrenIndex 重建** — messages 變化時 childrenIndex 也重建。但只是 Map 建構，比 tree 便宜。
- **Generator materialize** — virtualizer 需要 array，generator 要 `[...gen]`。但一次遍歷比兩次（buildTree + group）好。
- **filterTree 改為 flat filter** — 現有的 `filterTree` 在 tree 上遞迴。改為 flat `messages.filter()`，更簡單。
