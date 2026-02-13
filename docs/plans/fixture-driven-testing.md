# Fixture 驅動測試方案 + 工程品質基礎建設

## 問題

目前的測試全部基於**猜測的 mock 資料**，與真實 CLI 輸出格式嚴重不符：

1. **Claude parser** — mock 用簡化 JSON，真實輸出有 `usage`, `model`, `stop_reason`, `context_management` 等欄位
2. **Gemini parser** — mock 猜的格式（`action`, `action_result`, `tool_input`）跟真實格式完全不同（`tool_use`, `tool_result`, `parameters`）
3. **MockProcess** — 丟掉 spawn `options`（env, cwd），導致 `CLAUDECODE` env 繼承 bug 測不到
4. **缺少 Integration Test** — 沒有用真實 `spawn` + shell script 的整合測試

## 目標

1. 用**真實 CLI 輸出**做成 fixtures，驅動 parser 測試（fixture-driven TDD）
2. 用 fixtures 生成 **fake CLI shell scripts**，供 UI integration test 和手動測試使用
3. 引入 **zod** 做 runtime schema validation（CLI 輸出 + WebSocket 事件）
4. 引入 **DI** 改善可測試性（constructor injection + factory pattern）
5. 引入 **biome** (lint + format) + **lefthook** (git hooks) 防止回歸

---

## 真實 CLI 輸出格式

### Claude CLI

```jsonl
// init
{"type":"system","subtype":"init","session_id":"ce0ca308-...","cwd":"...","tools":[...],"model":"claude-opus-4-6"}

// assistant text
{"type":"assistant","message":{"model":"claude-opus-4-6","id":"msg_01...","content":[{"type":"text","text":"Hello!"}],"usage":{...}}}

// assistant tool_use
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"toolu_01S4W...","name":"Read","input":{"file_path":"package.json"}}],...}}

// user tool_result
{"type":"user","message":{"content":[{"tool_use_id":"toolu_01S4W...","type":"tool_result","content":"..."}]}}

// result
{"type":"result","subtype":"success","is_error":false,"duration_ms":3751,"total_cost_usd":0.184,"usage":{...},"modelUsage":{...}}
```

### Gemini CLI

```jsonl
// init
{"type":"init","timestamp":"...","session_id":"dff02b29-...","model":"auto-gemini-2.5"}

// user message（Gemini 會 echo）
{"type":"message","timestamp":"...","role":"user","content":"..."}

// tool_use（不是 "action"！）
{"type":"tool_use","timestamp":"...","tool_name":"read_file","tool_id":"read_file-...-533c7505fb7fc","parameters":{"file_path":"package.json"}}

// tool_result（不是 "action_result"！）
{"type":"tool_result","timestamp":"...","tool_id":"read_file-...-533c7505fb7fc","status":"success","output":""}

// assistant text（有 delta:true）
{"type":"message","timestamp":"...","role":"assistant","content":"Hello!","delta":true}

// result
{"type":"result","timestamp":"...","status":"success","stats":{"total_tokens":17673,"input_tokens":17382,"output_tokens":68,"cached":12481,"input":4901,"duration_ms":4554,"tool_calls":0}}
```

### 關鍵差異（真實 vs 現有 mock）

| 項目 | 現有 mock | 真實格式 |
|------|----------|---------|
| Gemini tool_use | `{"type":"action","tool_name":...,"tool_input":...}` | `{"type":"tool_use","tool_name":...,"tool_id":...,"parameters":...}` |
| Gemini tool_result | `{"type":"action_result","tool_name":...,"output":...}` | `{"type":"tool_result","tool_id":...,"status":...,"output":...}` |
| Gemini result stats | `stats.total_cost_usd` | `stats.duration_ms`, `stats.cached`, `stats.input`, `stats.tool_calls`（無 cost） |
| Claude tool_use id | 有時省略 | 必有 `toolu_xxx` 格式 |
| Claude result | 只有基本 stats | 有 `subtype`, `is_error`, `num_turns`, `modelUsage`, `permission_denials` |
| Claude user event | 不處理 | `{"type":"user","message":{"content":[{"type":"tool_result",...}]}}` |

---

## 執行步驟

| 步驟 | 內容 | 為什麼先做 |
|------|------|-----------|
| 1 | 安裝 zod, biome, lefthook | 基礎工具，後續步驟依賴 |
| 2 | 建立 fixture 檔案（從 /tmp 複製 + 整理） | 所有 parser 測試的基礎 |
| 3 | 建立 zod schemas | parser 修正的依據 |
| 4 | 修正 Gemini parser（重寫 + fixture test） | bug 最多的地方 |
| 5 | 修正 Claude parser（補全 + fixture test） | 補上缺失的 `user` type 等 |
| 6 | 改進 MockProcess（記錄 options + env test） | 防止 spawn options 相關回歸 |
| 7 | 建立 fake CLI scripts + integration test | 完整測試鏈 |
| 8 | DI 改善（ServerImpl, ChatSessionOptions） | 可測試性 |
| 9 | Biome migration + Lefthook setup | 防回歸 git hooks |
| 10 | 移除舊 mock scripts，更新 package.json scripts | 清理 |

---

## 涉及的檔案

### 新增
- `packages/server/src/chat/__fixtures__/claude/*.jsonl`
- `packages/server/src/chat/__fixtures__/gemini/*.jsonl`
- `packages/server/src/chat/schemas/claude.ts`
- `packages/server/src/chat/schemas/gemini.ts`
- `packages/server/src/chat/schemas/events.ts`
- `packages/server/src/chat/__tests__/claude-parser.fixture.test.ts`
- `packages/server/src/chat/__tests__/gemini-parser.fixture.test.ts`
- `packages/server/src/chat/__tests__/session.integration.test.ts`
- `e2e/fixtures/fake-claude.sh`
- `e2e/fixtures/fake-gemini.sh`
- `/biome.json`
- `/lefthook.yml`

### 修改
- `packages/server/src/chat/parsers/gemini-parser.ts` — 重寫以匹配真實格式
- `packages/server/src/chat/parsers/claude-parser.ts` — 補全 user type + result 解析
- `packages/server/src/chat/types.ts` — ChatSessionOptions 加 env
- `packages/server/src/chat/session.ts` — 使用 options.env
- `packages/server/src/test/mock-process.ts` — 記錄 spawn options
- `packages/server/src/chat/__tests__/session.test.ts` — 加 env 測試
- `packages/server/src/server.ts` — 接受注入 managers
- `packages/server/package.json` — 加 zod dependency
- `package.json` — 加 biome, lefthook devDependencies + scripts

### 刪除
- `packages/server/.eslintrc.cjs`
- `packages/client/.eslintrc.cjs`
- ESLint 相關 devDependencies
- `e2e/fixtures/mock-claude.sh`（被 fake-claude.sh 取代）
- `e2e/fixtures/mock-claude-stream.sh`（同上）
- `e2e/fixtures/mock-claude-echo.sh`（同上）
- `e2e/fixtures/mock-gemini.sh`（同上）

---

## 驗證方式

```bash
# 1. Fixture-driven parser tests
pnpm --filter server exec vitest run --reporter verbose

# 2. Integration test（用 fake CLI）
MOCK_CLI=shell pnpm --filter server exec vitest run session.integration

# 3. Type check
pnpm --filter server exec tsc --noEmit
pnpm --filter client exec tsc --noEmit

# 4. Lint + format
pnpm biome check .

# 5. 手動 E2E
MOCK_CLI=shell pnpm dev
```
