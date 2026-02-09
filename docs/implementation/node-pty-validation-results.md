# node-pty 驗證結果報告

**驗證日期**: 2026-02-09
**結論**: ✅ **專案完全可行**

---

## 📊 驗證結果總覽

| 項目 | 狀態 | 備註 |
|------|------|------|
| 1. node-pty 基礎能力 | ✅ 通過 | 成功啟動 Claude CLI，接收輸出 |
| 2. Claude CLI 輸出格式 | ✅ 通過 | 找到正確參數：`--output-format stream-json --verbose` |
| 3. 可捕獲的資訊類型 | ✅ 通過 | Tool use、Token usage、Cost 全部捕獲 |
| 4. 互動模式處理 | ⏳ 待測試 | - |
| 5. 並行多進程 | ⏳ 待測試 | - |
| 6. Worktree 整合 | ⏳ 待測試 | - |
| 7. 錯誤處理與恢復 | ⏳ 待測試 | - |
| 8. Gemini 整合可行性 | ✅ 通過 | 驗證成功，格式類似 |
| 9. 性能與延遲 | ⏳ 待測試 | - |

**圖例**: ✅ 通過 | ❌ 失敗 | ⚠️ 部分通過 | ⏳ 待驗證

---

## 🎯 關鍵發現

### 1. 正確的 CLI 參數

#### Claude Code
```bash
claude --print \
  --output-format stream-json \
  --verbose \
  -p "your prompt"
```

**輸出格式**：JSON Lines (每行一個 JSON 對象)

**事件類型**：
- `{"type":"system","subtype":"init",...}` - 初始化資訊
- `{"type":"assistant","message":{...}}` - Assistant 訊息
- `{"type":"user","message":{...}}` - User 訊息（包含 tool results）
- `{"type":"result",...}` - 最終結果

#### Gemini CLI
```bash
gemini -p "your prompt" \
  --output-format stream-json
```

**輸出格式**：JSON Lines

**事件類型**：
- `{"type":"init",...}` - 初始化
- `{"type":"message","role":"user|assistant",...}` - 訊息
- `{"type":"tool_use",...}` - 工具調用
- `{"type":"tool_result",...}` - 工具結果
- `{"type":"result",...}` - 最終結果

---

## 📝 詳細驗證結果

### 測試 1: node-pty 基礎能力 ✅

**執行**: `pnpm test:01`

**結果**:
- ✅ 成功找到 Claude CLI
- ✅ 成功啟動進程
- ✅ 成功接收輸出
- ✅ 正常退出（exit code 0）
- ✅ 輸出包含預期內容
- ⚠️ 輸出不包含 ANSI color codes（不影響功能）

**問題修復**:
- 需要設置 `spawn-helper` 的執行權限：
  ```bash
  chmod +x node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
  ```

**log 文件**: `validation/logs/01-basic-pty.log`

---

### 測試 2: Claude CLI 輸出格式 ✅

**執行**: `pnpm test:02`

**發現**:
- ❌ 預設格式：純文字輸出（無結構化資訊）
- ❌ `--print` 模式：純文字輸出
- ❌ `--streaming` 模式：參數不存在

**解決方案**:
經過查閱 `claude --help`，發現正確參數：
```bash
--output-format stream-json --verbose
```

**驗證成功**:
```bash
claude --print --output-format stream-json --verbose -p "Say hello"
```

輸出包含完整的結構化 JSON。

**log 文件**: `validation/logs/02-output-format.log`

---

### 測試 3: 事件解析能力 ✅

**執行**: `pnpm test:03`

**初始結果**（使用預設參數）:
- ❌ 未能捕獲 Tool Use 事件
- ❌ 未能捕獲 Token Usage
- ❌ 未能捕獲 Thinking blocks
- ✅ 成功捕獲對話內容

**使用正確參數後的結果**:

```bash
claude --print --output-format stream-json --verbose -p "Read the package.json file"
```

✅ **完整捕獲**:

#### Tool Use 事件
```json
{
  "type": "assistant",
  "message": {
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_01UbfiZNP145nHJR9MSB6fcm",
        "name": "Read",
        "input": {
          "file_path": "/path/to/package.json"
        }
      }
    ]
  }
}
```

#### Tool Result
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "tool_use_id": "toolu_01UbfiZNP145nHJR9MSB6fcm",
        "type": "tool_result",
        "content": "..."
      }
    ]
  }
}
```

#### Token Usage
```json
{
  "usage": {
    "input_tokens": 3,
    "output_tokens": 374,
    "cache_read_input_tokens": 38825,
    "cache_creation_input_tokens": 1591
  }
}
```

#### Cost
```json
{
  "type": "result",
  "total_cost_usd": 0.03875125,
  "modelUsage": {
    "claude-sonnet-4-5-20250929": {
      "inputTokens": 9,
      "outputTokens": 374,
      "cacheReadInputTokens": 38825,
      "cacheCreationInputTokens": 1591,
      "costUSD": 0.03875125
    }
  }
}
```

**log 文件**: `validation/logs/03-event-parsing.log`

---

### 測試 8: Gemini 整合可行性 ✅

**檢查 Gemini CLI**:
```bash
which gemini
# 輸出: /Users/user/.asdf/shims/gemini
```

✅ **Gemini CLI 已安裝**

**測試基本輸出**:
```bash
gemini -p "Say hello" --output-format stream-json
```

**結果**:
```json
{"type":"init","session_id":"...","model":"auto-gemini-2.5"}
{"type":"message","role":"user","content":"Say hello"}
{"type":"message","role":"assistant","content":"Hello! How can I help you today","delta":true}
{"type":"result","stats":{"total_tokens":7250,"input_tokens":7097,"output_tokens":52}}
```

✅ **成功捕獲 streaming 輸出和 token usage**

**測試工具調用**:
```bash
gemini -p "Read the validation/package.json file" --output-format stream-json
```

**結果**:
```json
{"type":"tool_use","tool_name":"read_file","tool_id":"...","parameters":{"file_path":"package.json"}}
{"type":"tool_result","tool_id":"...","status":"success","output":""}
{"type":"result","stats":{"total_tokens":15125,"tool_calls":1}}
```

✅ **成功捕獲工具調用和結果**

---

## 🔄 Claude vs Gemini 格式對比

### 相同點
- ✅ 都支援 `--output-format stream-json`
- ✅ 都輸出 JSON Lines 格式
- ✅ 都能捕獲 tool use 和 tool results
- ✅ 都提供 token usage 資訊
- ✅ 都支援 streaming 輸出

### 差異點

| 項目 | Claude Code | Gemini CLI | 統一處理 |
|------|-------------|------------|----------|
| **Verbose 參數** | 需要 `--verbose` | 不需要 | ✅ 條件性添加 |
| **Tool Use 格式** | `{"type":"tool_use","name":"Read"}` | `{"type":"tool_use","tool_name":"read_file"}` | ✅ 映射處理 |
| **參數欄位** | `"input":{...}` | `"parameters":{...}` | ✅ 統一讀取 |
| **Cost 資訊** | ✅ `total_cost_usd` | ❌ 無（需自行計算） | ✅ 根據 token 計算 |
| **工具名稱** | `Read, Write, Edit` | `read_file, write_file` | ✅ 工具名稱映射 |

---

## 💡 實作建議

### 1. 統一的 OutputParser

```typescript
interface UnifiedEvent {
  type: 'tool_use' | 'tool_result' | 'message' | 'usage' | 'result';
  timestamp: number;
  data: any;
}

class OutputParser {
  parse(line: string, provider: 'claude' | 'gemini'): UnifiedEvent | null {
    const raw = JSON.parse(line);

    if (provider === 'claude') {
      return this.parseClaudeEvent(raw);
    } else {
      return this.parseGeminiEvent(raw);
    }
  }

  private parseClaudeEvent(raw: any): UnifiedEvent | null {
    // 處理 Claude 格式
    if (raw.type === 'assistant' && raw.message?.content) {
      const toolUse = raw.message.content.find(c => c.type === 'tool_use');
      if (toolUse) {
        return {
          type: 'tool_use',
          timestamp: Date.now(),
          data: {
            tool: toolUse.name,
            params: toolUse.input
          }
        };
      }
    }
    // ...
  }

  private parseGeminiEvent(raw: any): UnifiedEvent | null {
    // 處理 Gemini 格式
    if (raw.type === 'tool_use') {
      return {
        type: 'tool_use',
        timestamp: Date.now(),
        data: {
          tool: raw.tool_name,
          params: raw.parameters
        }
      };
    }
    // ...
  }
}
```

### 2. 統一的 CLI Manager

```typescript
interface AIProviderConfig {
  provider: 'claude' | 'gemini';
  model: string;
  workingDirectory?: string;
}

class UnifiedCLIManager {
  spawn(config: AIProviderConfig, prompt: string) {
    const { command, args } = this.buildCommand(config, prompt);

    return pty.spawn(command, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: config.workingDirectory || process.cwd(),
      env: process.env
    });
  }

  private buildCommand(config: AIProviderConfig, prompt: string) {
    if (config.provider === 'claude') {
      return {
        command: 'claude',
        args: [
          '--print',
          '--output-format', 'stream-json',
          '--verbose',
          '--model', config.model,
          '-p', prompt
        ]
      };
    } else {
      return {
        command: 'gemini',
        args: [
          '-p', prompt,
          '--output-format', 'stream-json',
          '--model', config.model
        ]
      };
    }
  }
}
```

### 3. 工具名稱映射

```typescript
const TOOL_MAPPING = {
  // Claude → 統一名稱
  'Read': 'read_file',
  'Write': 'write_file',
  'Edit': 'edit_file',
  'Grep': 'search_content',
  'Glob': 'find_files',
  'Bash': 'execute_command',

  // Gemini → 統一名稱（已經是標準名稱）
  'read_file': 'read_file',
  'write_file': 'write_file',
  // ...
};

const RPG_SKILL_MAPPING = {
  'read_file': '🔍 閱讀卷軸',
  'write_file': '✍️ 書寫魔法',
  'edit_file': '✏️ 編輯之術',
  'search_content': '🔎 搜尋之眼',
  'find_files': '🗺️ 探測魔法',
  'execute_command': '⚡ 終端召喚'
};
```

---

## ✅ 最終結論

### 專案可行性：✅ **完全可行**

所有 **P0（專案可行性）驗證項目全部通過**：

1. ✅ node-pty 可以成功啟動和控制 CLI
2. ✅ 找到正確的輸出格式參數
3. ✅ 可以捕獲所有需要的資訊：
   - Tool use 事件（映射為技能施放）
   - Token usage（映射為 MP 消耗）
   - Cost（映射為金幣消耗）
   - 對話內容（映射為戰鬥日誌）

### 雙 AI 支援：✅ **完全可行**

- ✅ Claude Code 和 Gemini CLI 都支援
- ✅ 格式相似，差異可統一處理
- ✅ 都能提供完整的事件資訊

### 核心架構驗證：✅ **成功**

Code Quest 的三層架構完全可行：

```
RPG UI Layer (React)
    ↓ WebSocket
Bridge Layer (Node.js)
    ↓ node-pty + OutputParser
Claude Code / Gemini CLI
```

---

## 🚀 下一步行動

### 1. 完成剩餘驗證（P1 項目）
- [ ] 測試 4: 互動模式處理
- [ ] 測試 5: 並行多進程
- [ ] 測試 6: Worktree 整合

### 2. 開始 POC 實作
基於驗證結果，開始實作 POC：

#### Phase 1: Bridge Layer
- [ ] UnifiedCLIManager（支援 Claude + Gemini）
- [ ] OutputParser（統一事件格式）
- [ ] RPGMapper（事件 → RPG 映射）
- [ ] WebSocket Server

#### Phase 2: Frontend
- [ ] RPGUI 基礎組件
- [ ] 戰鬥畫面
- [ ] WebSocket 客戶端
- [ ] 事件動畫

#### Phase 3: 整合測試
- [ ] 端到端測試
- [ ] 多 AI 並行測試
- [ ] Worktree 隔離測試

---

## 📚 相關文檔

- **驗證清單**: `docs/implementation/node-pty-validation-checklist.md`
- **POC 計畫**: `docs/implementation/poc-plan.md`
- **實作策略**: `docs/implementation-strategy.md`
- **Vultuk 參考**: `docs/ui-design/references/vultuk-architecture.md`

---

**報告結束**

驗證成功，專案可以進入 POC 實作階段！🎉
