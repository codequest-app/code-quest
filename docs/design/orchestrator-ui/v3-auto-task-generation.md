# Orchestrator UI v3 — Auto Task Generation

## 問題

v2 (Chat-First) 解決了「idle 階段空白表單」的問題，但引入了新的斷裂點：

1. **討論結果不會自動轉成任務** — 使用者跟 Coordinator 討論完後，要手動在 TaskPlanner 重新打一遍任務
2. **Worker 缺少上下文** — `startWorker` 只送 `task.description` 一行文字給 Worker，Worker 不知道前因後果
3. **任務 description 太簡短** — 使用者傾向填短句（如「導入 Pino」），但 Worker 需要完整可執行的指令

## 設計決策

採用 **方案 D（混合模式）**：AI 自動生成 + 使用者可編輯 + 可重新生成。

### 業界參考

| 產品 | 做法 | 我們借鑑 |
|------|------|---------|
| Cursor 2.0 | Chat → Agent 自動拆步驟 | 自動拆任務的概念 |
| Claude Code | `/planning` mode → 結構化思考後執行 | 先規劃再執行 |
| CrewAI | Manager agent 分派 task 給 worker agents | 結構化 task description |

---

## 核心流程

```
使用者 ←→ Coordinator Chat（自由討論）
                ↓
        使用者點 "Plan Tasks" 按鈕
                ↓
        前端自動送 task generation prompt 給 Coordinator
                ↓
        Coordinator 回覆包含結構化 JSON 的訊息
                ↓
        前端 parse JSON → 預填 TaskPlanner（可編輯）
                ↓
        使用者確認/編輯 → Dispatch
                ↓
        Workers 各自執行（description 已是自包含指令）
```

---

## Phase 對照：v2 vs v3

```
操作              v2 (Chat-First)                v3 (Auto Task Generation)
─────             ─────────────                  ─────────────────────────
idle 對話          Coordinator Chat 全螢幕         不變
點 Plan Tasks     顯示空白 TaskPlanner             自動送 prompt → 預填 TaskPlanner
                                                  可點 "Regenerate" 重新生成
                                                  若 parse 失敗，fallback 為空白表單
TaskPlanner       手動填寫                         預填好，可編輯
Dispatch          不變                             不變
Workers           只收到 description               不變（description 已夠完整）
```

**只改 PlanningView 元件 + 新增 task generation prompt / parser，其他 Phase 不動。後端 0 改動。**

---

## 詳細設計

### 1. Task Generation Prompt

點 "Plan Tasks" 時，前端自動送出以下訊息給 Coordinator：

```
Based on our discussion, please break down the work into independent sub-tasks
that can be executed in parallel by separate AI workers.

Each task description must be self-contained — include enough context, file paths,
and specific instructions for a worker to execute without access to this conversation.

Reply with the following JSON format (inside a ```json code block):

```json
{
  "tasks": [
    { "description": "detailed task description...", "provider": "claude" }
  ]
}
```

Rules:
- Each task should be independently executable
- Use "claude" or "gemini" as provider
- Keep tasks focused — one clear objective per task
- Include relevant file paths and specific requirements in description
```

### 2. JSON Parsing

從 Coordinator 的最新 assistant 訊息中提取 JSON：

```typescript
interface GeneratedTasks {
  tasks: Array<{ description: string; provider: 'claude' | 'gemini' }>;
}

function parseTasksFromMessage(content: string): GeneratedTasks | null {
  // Strategy 1: 提取 ```json ... ``` code block
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch { /* fall through */ }
  }

  // Strategy 2: 提取 { "tasks": ... } raw JSON
  const jsonMatch = content.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { /* fall through */ }
  }

  return null;
}
```

### 3. PlanningView 狀態擴展

```typescript
// 現有
const [showPlanner, setShowPlanner] = useState(false);

// v3 擴展
const [plannerState, setPlannerState] = useState<
  'chat' | 'generating' | 'planning'
>('chat');
const [generatedTasks, setGeneratedTasks] = useState<SubTask[]>([]);
```

狀態轉移：

```
chat ──(點 Plan Tasks)──→ generating ──(parse 成功)──→ planning
                             │                            │
                        (parse 失敗)              (點 Regenerate)
                             │                            │
                             ▼                            ▼
                        planning                     generating
                       (空白表單 fallback)
```

### 4. UI 變更

#### 狀態 A：對話中（chat）— 不變

與 v2 相同，全螢幕 ChatPanel + "Plan Tasks" 按鈕。

#### 狀態 B：生成中（generating）

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  Coordinator Chat                                  │
│                                                    │
│  You: "我想重構 auth 模組..."                       │
│  Coordinator: "了解，建議拆成..."                    │
│                                                    │
│  ★ You: [自動送出的 task generation prompt]         │
│  ★ Coordinator: (串流中...)                         │
│                                                    │
├────────────────────────────────────────────────────┤
│  ⏳ Generating tasks...                             │
└────────────────────────────────────────────────────┘
```

- 全螢幕 ChatPanel（使用者可看到 Coordinator 正在生成任務）
- 底部顯示 loading 狀態，"Plan Tasks" 按鈕 disabled

#### 狀態 C：任務編輯（planning）

```
┌────────────────────────────┬───────────────────────┐
│                            │                       │
│  Coordinator Chat          │  Task Planner         │
│                            │  (預填好的任務)        │
│  ...                       │                       │
│  Coordinator: ```json      │  1. [重構 AuthSe...] C│
│  {"tasks": [...]}          │  2. [JWT 驗證...]   G │
│  ```                       │  3. [測試套件...]   C │
│                            │  [+ Add Task]         │
│                            │                       │
│                            │  [⚔ Dispatch 3!]     │
├────────────────────────────┤                       │
│ [← Back to Chat]           │                       │
│ [↻ Regenerate]             │                       │
└────────────────────────────┴───────────────────────┘
```

- 與 v2 相同的左右分割，但 TaskPlanner 已預填
- 新增 "Regenerate" 按鈕 — 重新送 prompt 再產生一次
- "Back to Chat" 回到全螢幕 Chat（清除生成的任務）

---

## TaskPlanner 介面調整

TaskPlanner 需要新增接受預設值的能力：

```typescript
interface TaskPlannerProps {
  onDispatch: (tasks: SubTask[]) => void;
  initialTasks?: SubTask[];  // ← 新增：預填任務
}
```

收到 `initialTasks` 時，`useForm` 的 `defaultValues` 使用 `initialTasks`。

---

## 偵測 Coordinator 回應完成的機制

點 "Plan Tasks" 後需要知道 Coordinator 何時回完訊息：

1. 送出 task generation prompt：`onSend(coordinatorId, TASK_GENERATION_PROMPT)`
2. ChatPanel 顯示串流中（正常對話 UI）
3. 監聽 `chatStore` 的 `isProcessing` 狀態：
   - `isProcessing: true` → 仍在串流
   - `isProcessing: false` → 回應完成，取最後一則 assistant message 進行 parse

```typescript
// PlanningView 內部
useEffect(() => {
  if (plannerState !== 'generating') return;
  const session = useChatStore.getState().getChatSession(coordinatorId);
  if (session && !session.isProcessing) {
    const lastAssistantMsg = findLastAssistantMessage(session.messages);
    const parsed = parseTasksFromMessage(lastAssistantMsg?.content ?? '');
    if (parsed?.tasks.length) {
      setGeneratedTasks(parsed.tasks);
    }
    setPlannerState('planning');
  }
}, [plannerState, coordinatorId]);
// 需要 subscribe to chatStore changes
```

更精確的做法是用 `useChatStore` 的 selector 訂閱 `isProcessing`：

```typescript
const isProcessing = useChatStore(
  (state) => state.getChatSession(coordinatorId)?.isProcessing ?? false,
);

useEffect(() => {
  if (plannerState === 'generating' && !isProcessing) {
    // Coordinator 已完成回應，parse tasks
    const session = useChatStore.getState().getChatSession(coordinatorId);
    const lastMsg = findLastAssistantMessage(session?.messages ?? []);
    const parsed = parseTasksFromMessage(lastMsg?.content ?? '');
    if (parsed?.tasks.length) {
      setGeneratedTasks(parsed.tasks);
    }
    setPlannerState('planning');
  }
}, [plannerState, isProcessing, coordinatorId]);
```

---

## 修改檔案總覽

| 檔案 | 動作 | 說明 |
|------|------|------|
| `PlanningView.tsx` | **修改** | 新增 generating 狀態、自動送 prompt、parse 回應 |
| `PlanningView.test.tsx` | **修改** | 新增自動生成流程測試 |
| `TaskPlanner.tsx` | **修改** | 新增 `initialTasks` prop |
| `TaskPlanner.test.tsx` | **新增** | 測試 initialTasks 預填 |
| `parseTasksFromMessage.ts` | **新增** | JSON parser 純函式 |
| `parseTasksFromMessage.test.ts` | **新增** | parser 測試 |
| `taskGenerationPrompt.ts` | **新增** | prompt 常量 |

**不動**：OrchestratorPage、PhaseHeader、WorkerGrid、SynthesisView、ErrorView、後端所有檔案。

---

## 驗證計畫

```bash
# 1. 型別檢查
pnpm --filter client exec tsc --noEmit

# 2. 單元測試
pnpm --filter client exec vitest run

# 3. Lint
pnpm biome check packages/client/

# 4. 手動測試
# - 建立 Orchestrator → 跟 Coordinator 對話
# - 點 Plan Tasks → 應看到 Coordinator 串流生成任務
# - 串流完成後 → TaskPlanner 自動預填
# - 可編輯任務 → Dispatch → Workers 收到完整指令
# - 點 Regenerate → 重新生成任務
# - Parse 失敗時 → fallback 為空白表單
```

---

## 風險與 Mitigation

| 風險 | 影響 | 對策 |
|------|------|------|
| AI 不照 JSON 格式回應 | parse 失敗 | Fallback 為空白 TaskPlanner + 顯示提示 |
| JSON 格式正確但 tasks 品質差 | Worker 執行效果差 | 使用者可編輯 + Regenerate |
| Coordinator 回應很慢 | 使用者等待 | 顯示串流過程，使用者可看到進度 |
| prompt 語言問題（中/英） | AI 可能用中文回 description | prompt 不限制語言，讓 AI 自然回應 |
