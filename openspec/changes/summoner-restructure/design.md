## Context

summoner package 目前 8 個 source files，Claude-specific code 佔 83%（48KB）。generic code（process-runner, provider-adapter）直接 import claude-schemas 的 `ProtocolEvent`。claude-adapter.ts 單檔 25KB 處理所有 event transforms。

## Goals / Non-Goals

**Goals:**
- 依功能拆資料夾，generic / claude-specific / transport 分離
- ProviderAdapter 泛型化，generic code 零 claude import
- claude-adapter 拆成 adapter + 6 transforms，每檔 <200 行
- 移除手動維護的 ProtocolEvent union type
- 所有 test expect 不變或等價
- public API（index.ts barrel export）保持相容

**Non-Goals:**
- 不加入 Gemini 實作（只預留結構）
- 不改變任何 runtime 行為
- 不重構 test helpers（fake-claude, fake-process-provider, fake-socket）

## Decisions

### 1. 資料夾結構

```
summoner/src/
├── index.ts                     (barrel)
├── types.ts                     (generic types + ProviderAdapter<E,L>)
├── runner.ts                    (ProcessRunner)
├── transports/
│   └── child-process.ts         (ChildProcessProvider)
├── claude/
│   ├── index.ts                 (barrel)
│   ├── schemas.ts               (zod schemas，不變)
│   ├── protocol.ts              (+ LaunchOptions, ParseResult)
│   ├── adapter.ts               (ClaudeAdapter + dispatch + helpers)
│   └── transforms/
│       ├── system.ts            (16 system subtypes)
│       ├── assistant.ts         (text, thinking, tool_use blocks)
│       ├── user.ts              (text, tool_result blocks)
│       ├── result.ts            (result + stats)
│       ├── control.ts           (15+ control request subtypes)
│       └── stream.ts            (content_block_delta, message_start/stop)
└── test/                        (不變)
```

### 2. ProviderAdapter 泛型化

```ts
// types.ts
interface ProviderAdapter<E = unknown, L = Record<string, unknown>> {
  buildArgs(options?: L): string[];
  parseLine(line: string): ParseResult<E>;
  transform(event: E): AdapterOutput;
  formatMessage(text: string): string;
  formatControlRequest(subtype: string, input?: unknown, requestId?: string): string;
  formatControlResponse(requestId: string, response: unknown): string;
  extractRespondedRequestIds(rawEntries: RawEntry[]): Set<string>;
}

// claude/adapter.ts
class ClaudeAdapter implements ProviderAdapter<ProtocolEvent, LaunchOptions> { ... }
```

### 3. 移除 ProtocolEvent

- 每個 event type 已有 zod schema（systemInitSchema, assistantSchema 等）
- parseLine() 已用 getSchemaForType() + safeParse() 驗證
- 各 transform 用 `z.infer<typeof specificSchema>` 或 `Record<string, unknown>` 取代 `Extract<ProtocolEvent, ...>`
- `ProtocolEvent` union type 從 claude-schemas.ts 刪除
- index.ts 不再 export `ProtocolEvent`

### 4. provider-adapter.ts 拆分

| 原位置 | 新位置 | 內容 |
|--------|--------|------|
| ParseResult | claude/protocol.ts | Claude-specific（含 event: E） |
| LaunchOptions | claude/protocol.ts | 41 個 Claude CLI flags |
| ProviderAdapter | types.ts | 泛型 interface |
| AdapterOutput | types.ts | generic output type |
| ServerAction | types.ts | generic union type |
| SocketEvent re-export | types.ts | 從 shared re-export |

### 5. Transform 函式簽名

```ts
// 每個 transform export 一個函式
export function transformSystem(event: Record<string, unknown>): SocketEvent | SocketEvent[] | null;
```

adapter.ts 根據 `event.type` dispatch 到對應 transform。

### 6. 重構步驟（先 production code 再 test）

每步改完跑全部 test 確認 expect 不變：

1. types.ts 合併 provider-adapter.ts 的 generic types + ProviderAdapter 泛型化
2. LaunchOptions / ParseResult 搬到 claude/protocol.ts
3. 移除 ProtocolEvent union type
4. process-runner.ts → runner.ts（更新 import，泛型化）
5. child-process-provider.ts → transports/child-process.ts
6. claude-adapter.ts 拆 transforms（每個 transform 一個 commit）
7. claude-schemas.ts → claude/schemas.ts
8. claude-protocol.ts → claude/protocol.ts
9. 更新 index.ts barrel export
10. 搬移對應 test 檔案
11. 新增 summoner-structure skill
12. 清理舊檔案

## Risks / Trade-offs

- **import path 大量變動** — 但 barrel export 不變，外部消費者（server, client）不受影響
- **transforms 拆太細** — 6 個小檔 vs 1 個大檔。選擇小檔是因為 25KB 單檔的可維護性差
- **ProviderAdapter 泛型化** — 增加 type complexity，但只在 provider 實作時需要指定泛型參數
