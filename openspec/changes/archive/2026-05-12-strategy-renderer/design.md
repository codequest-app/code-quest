## Context

前幾個 change 已完成 flat data + NodeContent switch + per-toolId selectors。但 `renderContent` 仍是 27-case switch，Message 仍有 `meta: Record<string, unknown>`。shared package 已有 zod schema 定義每種 block 結構。

## Goals / Non-Goals

**Goals:**
- handler 存 zod validated payload，不轉換成自定義 Message
- 移除 `meta` — 直接讀 typed fields
- strategy pattern registry 取代 switch
- 每個 type 獨立 component file
- TDD：expect 不變或等價

**Non-Goals:**
- 不改 protocol format（CLI/summoner 輸出不變）
- 不改 tasks/results Map 機制
- 不改 parentToolUseId / childrenIndex 機制
- 不改 CollapsibleTimeline 排版邏輯

## Decisions

### Store 的 message type

```ts
// 共同 base（UI 層加的欄位）
interface MessageBase {
  id: string;
  role: string;
  timestamp: number;
  parentToolUseId?: string;
  cliUuid?: string;
  attachments?: MessageAttachment[];
}

// 每個 type 用 zod schema inferred type 擴展
type StoreMessage = MessageBase & ContentBlock;
// ContentBlock 是 shared 已有的 zod union:
// TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock | ...
```

handler 建 message 時：`{ ...base, ...validatedBlock }`。不需要 `meta`。

### Strategy Registry

```ts
// renderers/registry.ts
import type { ComponentType } from 'react';

interface ContentProps {
  message: StoreMessage;
  task?: Task;
  result?: ToolResult;
}

const registry = new Map<string, ComponentType<ContentProps>>();

export function registerRenderer(type: string, component: ComponentType<ContentProps>) {
  registry.set(type, component);
}

export function getRenderer(type: string): ComponentType<ContentProps> | undefined {
  return registry.get(type);
}
```

每個 Content component 自己註冊：

```ts
// renderers/TextContent.tsx
registerRenderer('text', TextContent);

// renderers/ToolUseContent.tsx
registerRenderer('tool_use', ToolUseContent);
```

NodeContent 變成：

```tsx
const Renderer = getRenderer(message.type) ?? FallbackContent;
return <Renderer message={message} task={task} result={result} />;
```

### Tool use sub-type registry

```ts
// renderers/tool-use/registry.ts
const toolRegistry = new Map<string, ComponentType<ToolContentProps>>();

registerToolRenderer('Bash', BashContent);
registerToolRenderer('Read', ReadContent);
registerToolRenderer('Edit', EditContent);
registerToolRenderer('Agent', AgentContent);
```

`ToolUseContent` 內部：

```tsx
const Renderer = getToolRenderer(message.toolName) ?? DefaultToolContent;
return <Renderer message={message} task={task} result={result} />;
```

### 遷移策略

1. 定義 `StoreMessage` type（MessageBase + ContentBlock）
2. 建 registry + FallbackContent
3. 逐一把 renderContent 的 case 抽成獨立 component + 註冊
4. handler 改存 StoreMessage（不用 meta）
5. 刪除 Message type / meta / renderContent switch
6. 驗證

## Risks / Trade-offs

- **zod schema 覆蓋度** — shared 的 schema 可能不覆蓋所有 client-side message types（如 `compact_boundary`、`interrupt`）。需要補 schema 或用 passthrough。
- **漸進遷移** — handler 和 renderer 可以分開改。先改 renderer（strategy），再改 handler（去 meta）。
- **registry 動態性** — Map-based registry 比 switch 稍慢（lookup cost），但差異忽略不計。
