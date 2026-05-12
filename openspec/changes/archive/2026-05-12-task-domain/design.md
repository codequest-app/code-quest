# Task Domain — Design

## Data Model

```ts
interface Task {
  toolUseId: string;
  taskType: 'local_bash' | 'local_agent' | 'subagent';
  status: 'running' | 'completed' | 'failed' | 'stopped';
  description: string;
  progressText?: string;    // task_progress.description（高頻更新，僅 local_agent）
  lastToolName?: string;    // task_progress.lastToolName（僅 local_agent）
  summary?: string;         // task_notification.summary
  usage?: { inputTokens: number; outputTokens: number };
}
```

### local_bash vs local_agent 行為差異

| | local_bash | local_agent |
|---|---|---|
| task_progress | 無（0 次） | 高頻（平均 23 次，最多 136 次） |
| 生命週期 | started → notification | started → progress × N → notification |
| progressText | 永遠 undefined | "Finding ...", "Reading ...", "Running grep ..." |
| lastToolName | 永遠 undefined | "Glob", "Read", "Bash" 等 |
| notification | 100% 有 | 98% 有（極少數中斷） |

## State 結構

```ts
interface ChannelState {
  // 既有...
  messages: Message[];
  // 新增
  tasks: Map<string, Task>;  // key = toolUseId
}
```

## Handler 設計

新增 `handlers/task.ts`：

```ts
function onTaskStarted(state, p): ChannelState {
  if (!p.toolUseId) return state;
  const task: Task = {
    toolUseId: p.toolUseId,
    taskType: p.taskType ?? 'local_bash',
    status: 'running',
    description: p.description,
  };
  const tasks = new Map(state.tasks);
  tasks.set(p.toolUseId, task);
  return { ...state, tasks };
}

function onTaskProgress(state, p): ChannelState {
  // 僅 local_agent 會觸發此事件
  if (!p.toolUseId) return state;
  const existing = state.tasks.get(p.toolUseId);
  if (!existing) return state;
  const tasks = new Map(state.tasks);
  tasks.set(p.toolUseId, {
    ...existing,
    progressText: p.description,
    lastToolName: p.lastToolName,
  });
  return { ...state, tasks };
}

function onTaskNotification(state, p): ChannelState {
  if (!p.toolUseId || !p.status) return state;
  const existing = state.tasks.get(p.toolUseId);
  if (!existing) return state;
  const tasks = new Map(state.tasks);
  tasks.set(p.toolUseId, {
    ...existing,
    status: p.status === 'failed' ? 'failed' : p.status === 'stopped' ? 'stopped' : 'completed',
    summary: p.summary,
    ...(p.usage ? { usage: { inputTokens: p.usage.input_tokens ?? 0, outputTokens: p.usage.output_tokens ?? 0 } } : {}),
  });
  return { ...state, tasks };
}
```

## 整合策略（過渡期雙寫）

`system.ts` 的 task handlers 同時呼叫 `taskHandlerOn`（寫 Map）+ 現有 `patchToolUseMeta`（寫 block.meta）。
UI 目前仍從 `block.meta` 讀取。待 context propagation timing 問題解決後，再切換 UI 到 tasks Map。

## UI 讀取方式（未來）

ToolUseBlock 透過 `useTask(toolId)` 從 tasks Map 讀：

```tsx
function ToolUseBlock({ meta }) {
  const task = useTask(meta.toolId);
  // task?.status → TaskBadge
  // task?.progressText → TaskStatusBadge detail（僅 local_agent 有值）
}
```

## 效能考量

- task_progress 每次只 clone Map（O(1) set），不觸發 messages array re-render
- local_bash 不會收到 task_progress，不會有頻繁更新
- local_agent 平均 23 次 progress 更新只影響 Map，不重繪其他 messages
