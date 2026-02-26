# CLI Adapter MVP Design

> Date: 2026-02-27
> Status: Approved

## Overview

cli-adapter 是 Code Quest 的最底層模組，負責與 Claude Code CLI 的 JSON streaming protocol 互動。零框架依賴，唯一 runtime dependency 是 Zod。

## Scope

- **只做 Claude**（Parser 介面保持可擴充）
- **只做 Interactive mode**（`--input-format stream-json --output-format stream-json`）
- **EventEmitter** 事件模型
- **Zod 驗證** CLI 輸出

## 檔案結構

```
packages/cli-adapter/src/
├── schemas.ts          # Zod schemas + inferred types
├── types.ts            # 介面定義
├── claude-parser.ts    # parseLine(): line → ChatStreamEvent[]
├── session.ts          # InteractiveSession extends EventEmitter
├── index.ts            # public API re-exports
└── __tests__/
    ├── __fixtures__/claude/   # JSONL fixtures（從 POC 搬）
    ├── claude-parser.test.ts
    └── session.test.ts
```

## 型別設計

### 介面分層

```typescript
// 基礎介面 — 所有模式共用
interface ChatSession extends EventEmitter<SessionEvents> {
  readonly id: string;
  readonly state: 'idle' | 'processing';
  sendMessage(message: string): void;
  abort(): void;   // SIGINT
  kill(): void;    // SIGTERM
}

// 控制協議介面 — Interactive mode 專用
interface ControllableSession extends ChatSession {
  readonly cliSessionId: string | null;
  initialize(options?: InitializeOptions): Promise<ControlResponse>;
  setModel(model: string): Promise<ControlResponse>;
  setPermissionMode(mode: string): Promise<ControlResponse>;
  interrupt(): Promise<ControlResponse>;
  respondToControlRequest(requestId: string, response: Record<string, unknown>): void;
}
```

擴充性：
- PrintSession → implements ChatSession（未來 `-p` 模式）
- InteractiveSession → implements ControllableSession（MVP）
- SdkSession → implements ChatSession（未來 SDK 模式）

### Event 型別

```typescript
type ChatStreamEvent =
  | { type: 'init'; sessionId: string }
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: string }
  | { type: 'result'; stats: ChatStats }
  | { type: 'error'; message: string }
  | { type: 'control_response'; requestId: string; success: boolean; response?: Record<string, unknown>; error?: string }
  | { type: 'control_request'; requestId: string; subtype: string; toolName?: string; input?: unknown; callbackId?: string; toolUseId?: string };

interface ChatStats {
  costUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

interface SessionEvents {
  event: (event: ChatStreamEvent) => void;
  error: (message: string) => void;
  exit: () => void;
}
```

### Process 抽象

```typescript
interface ProcessFactory {
  (command: string, args: string[], options: SpawnOptions): ChildProcess;
}
```

## Parser 設計

```
raw line → JSON.parse → 過濾忽略清單 → Zod safeParse → 分派轉換
```

忽略清單：`keep_alive`, `rate_limit_event`, `streamlined_text`, `streamlined_tool_use_summary`

CLI type → ChatStreamEvent 映射：

| CLI type | 產出 |
|----------|------|
| `system` (subtype: init) | `init` |
| `assistant` (content[]) | `text` / `thinking` / `tool_use` |
| `user` | 忽略（echo-back）|
| `result` | `result` |
| `control_response` | `control_response` |
| `control_request` | `control_request` |

改進：Parser 內部維護 `Map<toolUseId, toolName>`，`tool_result` 查 map 回填真正的工具名。

## Session 生命週期

```
         create()
            │
     ┌──────▼──────┐
     │    idle      │
     └──────┬───────┘
            │ sendMessage() / initialize()
            │ → ensureProcess() → spawn
     ┌──────▼──────┐
     │ processing   │◄── stdin JSON
     └──────┬───────┘
            │
   ┌────────┼────────┐
   │        │        │
 result   abort()  kill()
   │      SIGINT   SIGTERM
   ▼        │        │
  idle ◄────┘    closed
 (reuse)          → next sendMessage() respawns with --resume
```

### 控制協議

- `pendingRequests`: `Map<requestId, { resolve, reject, timer }>`
- request ID 格式：`${subtype}-${counter.padStart(3, '0')}`
- timeout 後自動 reject，resolve/reject 時 clearTimeout

### stdin 格式

```json
// 使用者訊息
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}

// 控制請求
{"type":"control_request","request_id":"...","request":{"subtype":"..."}}

// 控制回應
{"type":"control_response","response":{"subtype":"success","request_id":"...","response":{...}}}
```

## 測試策略

### Layer 1: Parser 單元測試（fixture 驅動）

```
__fixtures__/claude/*.jsonl → ClaudeParser.parseLine() → assert ChatStreamEvent[]
```

18 個 JSONL fixture 從 POC 搬過來，涵蓋所有 event type。

### Layer 2: Session 整合測試（MockProcess 驅動）

```typescript
class MockProcess extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  emitLine(json: object): void;
  emitClose(code?: number): void;
}
```

測試覆蓋：

| 類別 | 案例 |
|------|------|
| Parser | 每種 event type、忽略清單、malformed JSON、未知 type、多 content blocks |
| Spawn | lazy spawn、env 過濾、args 組裝 |
| 多輪 | 送訊息 → result → 再送 → stdin 格式正確 |
| Resume | process close → 下次帶 --resume |
| Control | initialize → response、timeout reject、respondToControlRequest |
| State | idle ↔ processing 轉換 |
| Error | process crash + stderr、非零 exit code |

## POC 痛點修復清單

| 問題 | MVP 修復 |
|------|---------|
| handler 只有 push 沒有 remove | EventEmitter on/off/once |
| tool_result name 是 ID 不是工具名 | Parser 維護 toolUseId→name map |
| ControlResponse 型別重複定義 | 統一在 cli-adapter 內 |
| gotResult boolean flag 易壞 | state machine: idle/processing |
| pendingRequests array scan O(n) | Map O(1) |
| timeout timer 未清理 | resolve/reject 時 clearTimeout |
| Gemini 暴露不支援的 control methods | 介面分層: ChatSession vs ControllableSession |
| sendMessage 只支援 text | MVP 先保持（未來需要時擴充）|

## Public API

```typescript
// index.ts re-exports
export { InteractiveSession } from './session.ts';
export { ClaudeParser } from './claude-parser.ts';
export type {
  ChatSession,
  ControllableSession,
  ChatStreamEvent,
  ChatStats,
  ControlResponse,
  ControlRequest,
  ProcessFactory,
  SessionEvents,
} from './types.ts';
```
