## Context

前兩個 change 已完成：
- `message-render-primitives` — 組合式 primitives（Highlight、Copyable、Labeled、Pre）
- `message-viewmodel` — ViewModel 層 + mergeToolResult 移除

現在 ViewModel 是多餘的中間層。Component props 就是 contract，不需要 ViewModel types。

## Goals / Non-Goals

**Goals:**
- 一個 `NodeContent` switch 取代 renderBody + ViewModelContent + toViewModel
- Content component 接受 typed props，不依賴 message/meta/store
- `buildMessageTree` 回傳 `{ roots, results }`
- parent 負責 task/result lookup，傳 prop 給 `NodeContent`
- children 遞迴在 `NodeContent` 裡
- 刪除 ViewModel 層、ChatMessage、ToolResultsContext
- TDD：expect 不變或等價

**Non-Goals:**
- 不改 `buildMessageTree` 的 tree/nestChild 邏輯
- 不改 `CollapsibleTimeline` 的 timeline dots/grouping
- 不改 handler / state 層
- 不改 primitives（Highlight、Copyable 等）

## Decisions

### NodeContent 結構

```tsx
function NodeContent({ node, task, result, isLastTurn, onDiffRespond }: NodeContentProps) {
  const { message } = node;
  const content = (() => {
    switch (message.type) {
      case 'tool_use':
        return renderToolUse(message, task, result);
      case 'text':
        return <TextContent content={message.content} role={message.role} ... />;
      case 'thinking':
        return <ThinkingContent content={message.content} ... />;
      // ...
    }
  })();

  return (
    <>
      {content}
      {node.children.length > 0 && (
        <ChildrenNodes nodes={node.children} tasks={tasks} results={results} />
      )}
    </>
  );
}
```

### Task / Result 傳遞

**最終目標：parent 傳 prop，NodeContent 不依賴 store**

```
MessageList
  ├─ const tasks = useChannelStore(s => s.tasks)
  ├─ const { roots, results } = buildMessageTree(messages)
  │
  └─ CollapsibleTimeline / VirtualGroupItem
      └─ <NodeContent
           node={node}
           task={tasks.get(toolId)}
           result={results.get(toolId)}
         />
```

- `tasks` 從 zustand store 讀（已有）
- `results` 從 `buildMessageTree` 回傳（已有）
- parent 做 lookup，避免 NodeContent 依賴 store
- tree 不掛 task/result，避免 re-render

**漸進策略：**
1. Step 2 先讓 NodeContent 內部讀 store（等價替換 ChatMessage，確保 test green）
2. Step 3 內化 switch 後，改為 prop 傳入，移除 store 依賴

### TDD 重構步驟

原則：每步 expect 不變，一步一步替換。

1. **建 NodeContent** — 先 wrap 現有 `renderBody`，只是換呼叫方式
2. **CollapsibleTimeline 切換** — `ChatMessage` → `NodeContent`
3. **MessageList 單獨 node 切換** — `ChatMessage` → `NodeContent`
4. **NodeContent 內化 switch** — 不再呼叫 `renderBody`，直接 switch
5. **刪 ViewModel 層** — `toViewModel`、ViewModel types、`ViewModelContent`
6. **刪 ChatMessage** — 邏輯已在 NodeContent 和各 Content 裡
7. **刪 ToolResultsContext** — results 改由 prop 傳遞
8. **整合 SubagentChildren** — children 遞迴在 NodeContent 裡

## Risks / Trade-offs

- **步驟多但每步小** — 每步都是等價替換，test green 就繼續
- **CollapsibleTimeline 改動** — 需要傳 tasks/results 進去，props 會多一些
- **SubagentChildren 的排版** — 縮排、model badge 邏輯需要保留，整合進 NodeContent 時注意
