# PTY vs Spawn 架構分析 — Claude CLI 整合方案研究

> 研究日期：2026-02-12
> 背景：Chat/Orchestrator 功能重構，評估 node-pty vs child_process.spawn 的適用性

---

## 一、node-pty vs child_process.spawn 根本差異

| 面向 | node-pty (PTY) | child_process.spawn (Pipe) |
|------|---------------|---------------------------|
| `isatty()` | `true` — 子程序以為接了真實終端 | `false` — 子程序知道在管道中 |
| stdout 緩衝 | **行緩衝**（每個 `\n` flush） | **塊緩衝**（4-8KB 才 flush） |
| stdout + stderr | **合併成單一 stream** | 分開的獨立 stream |
| ANSI escape codes | 輸出顏色、cursor 移動等 | 通常不輸出 |
| 原生模組 | 需編譯 C++ addon（平台相依） | Node.js 內建 |

### PTY 能做而 Spawn 做不到的

1. **欺騙程式進入互動模式** — Claude CLI 顯示完整 TUI
2. **支援 raw mode** — Ink (Claude CLI 的 TUI 框架) 需要 `stdin.setRawMode(true)`
3. **終端控制序列** — cursor 定位、清螢幕、alternate buffer
4. **強制行緩衝** — 不會有 JSON 卡在 buffer 裡的問題

### Spawn 能做而 PTY 做不到的

1. **分離 stdout / stderr** — 獨立處理錯誤和正常輸出
2. **乾淨的結構化輸出** — 不含 ANSI codes，JSON parsing 不被污染
3. **不需原生模組** — 無編譯依賴、跨平台零配置
4. **測試友善** — 容易 mock（注入 MockProcess vs mock node-pty）

---

## 二、Claude CLI 的兩種模式

| | 互動模式 (`claude`) | Print 模式 (`claude -p`) |
|---|---|---|
| UI | 完整 Ink TUI（React for CLI） | 無 UI，stream 到 stdout |
| 多輪對話 | 內建 REPL | 單次，需 `--continue` / `--resume` |
| `--output-format` | **不支援** | 支援 `stream-json` |
| Permission | TUI 互動對話框 | `--allowedTools` / `--permission-prompt-tool` |
| Terminal 需求 | **必須有 TTY** | 管道即可 |

**核心限制**：`--output-format stream-json` **只能搭配 `-p` flag 使用**。互動模式用 Ink 渲染 TUI，無法同時輸出 JSON。

---

## 三、PTY + Claude 互動模式的致命問題

即使用 node-pty 提供 TTY，Ink 的 text-input 元件有已知 bug（GitHub #15553）：

> **程式化的 `\r` / `\n` 被當成文字輸入的換行，不會觸發 submit。只有物理鍵盤的 Enter 才會觸發 `onSubmit`。**

已嘗試但都失敗的方式：
- PTY `write('\r')` — 無法提交訊息
- VS Code API `sendText(text, true)` — 不行
- macOS AppleScript 模擬按鍵 — 不行
- 各種 escape sequence 組合 — 都失敗

**結論：用 node-pty 控制 Claude 互動模式在技術上不可行。**

來源：
- [GitHub Issue #15553](https://github.com/anthropics/claude-code/issues/15553)
- [GitHub Issue #1072](https://github.com/anthropics/claude-code/issues/1072)

---

## 四、`-p` 模式功能支援總覽

### 4.1 完整支援的功能

| 功能 | 支援 | 用法 |
|------|:---:|------|
| 換 Model | YES | `--model opus/sonnet/haiku`，另有 `--fallback-model` |
| Plan Mode | YES | `--permission-mode plan`（唯讀分析） |
| MCP Servers | YES | `--mcp-config ./mcp.json` |
| Subagent / Task tool | YES | 需在 `--allowedTools` 包含 `Task` |
| CLAUDE.md | YES | 自動載入（global / project / local 三層） |
| Structured Output | YES | `--json-schema`（`-p` 專屬） |
| Spending Cap | YES | `--max-budget-usd`（`-p` 專屬） |
| Turn Limit | YES | `--max-turns`（`-p` 專屬） |

### 4.2 不支援的功能

| 功能 | 支援 | 替代方案 |
|------|:---:|------|
| Built-in Commands (`/clear`, `/compact`, `/model`...) | NO | 用 CLI flags 代替 |
| User-invoked Skills (`/commit`, `/review-pr`) | NO | 見下方 Skills 分析 |
| Keyboard shortcuts | NO | N/A |
| Vim mode / `!` bash mode / `@` file mentions | NO | N/A |

### 4.3 `-p` 模式完整可用旗標

| 旗標 | 說明 |
|------|------|
| `--model` | 指定模型 |
| `--fallback-model` | 過載時降級（`-p` 專屬） |
| `--max-turns` | 限制 agentic 輪數（`-p` 專屬） |
| `--max-budget-usd` | 花費上限（`-p` 專屬） |
| `--output-format stream-json` | JSON streaming 輸出 |
| `--system-prompt` | 替換整個 system prompt |
| `--append-system-prompt` | 追加 system prompt |
| `--allowedTools` / `--disallowedTools` | 控制工具權限 |
| `--mcp-config` | 載入 MCP server |
| `--permission-mode` | `default/acceptEdits/plan/bypassPermissions` |
| `--continue` / `--resume` | 延續對話 |
| `--agents` | 定義自訂 subagents（JSON） |
| `--json-schema` | 結構化輸出（`-p` 專屬） |
| `--include-partial-messages` | 逐 token streaming（`-p` 專屬） |
| `--no-session-persistence` | 不存對話紀錄（`-p` 專屬） |
| `--permission-prompt-tool` | MCP tool 處理 permission |
| `--dangerously-skip-permissions` | 跳過所有權限提示 |

---

## 五、Skills 在 `-p` 模式的運作機制

### 5.1 Skill tool 架構

Skills 透過一個叫 **`Skill`** 的 meta-tool 實現。啟動時 Claude 掃描 skills 目錄，把所有 skill 的名稱和描述嵌入 Skill tool 定義。Claude 根據對話上下文自行判斷是否呼叫。

```
啟動時：
  掃描 ~/.claude/skills/ 和 .claude/skills/
  ↓
  所有 skill 的 description 嵌入到 Skill tool 定義中
  ↓
  Claude 在對話中看到相關情境 → 自動呼叫 Skill tool
```

### 5.2 兩種觸發方式

| | 使用者觸發 (`/commit`) | Model 自動觸發 (Skill tool) |
|---|:---:|:---:|
| 互動模式 | 可用 | 可用 |
| **`-p` 模式** | **不可用** | **可用** |

### 5.3 Frontmatter 控制

```markdown
---
description: "Use when the user wants to commit changes"
disable-model-invocation: true   # 設了 → model 看不到也不會觸發
user-invocable: false            # 設了 → 使用者不能 /xxx，但 model 可以
---
```

| 設定 | 使用者 `/xxx` | Model 自動觸發 | `-p` 模式下 |
|------|:---:|:---:|:---:|
| 預設（都不設） | 可 | 可 | **Model 可自動觸發** |
| `disable-model-invocation: true` | 可 | 不可 | **完全不可用** |
| `user-invocable: false` | 不可 | 可 | **Model 可自動觸發** |

### 5.4 關鍵結論

- **預設的 skill 在 `-p` 模式下會自動觸發** — 只要沒設 `disable-model-invocation: true`
- 不需要特殊旗標，但若用了 `--allowedTools` 記得包含 `"Skill"`
- `disable-model-invocation: true` 的 skill 在 `-p` 模式下完全死掉

來源：
- [Official Skills Documentation](https://code.claude.com/docs/en/skills)
- [Agent SDK Skills](https://platform.claude.com/docs/en/agent-sdk/skills)
- [Inside Claude Code Skills](https://mikhail.io/2025/10/claude-code-skills/)

---

## 六、`--resume` 已知問題

| Issue | 說明 |
|-------|------|
| [#3138](https://github.com/anthropics/claude-code/issues/3138) | 遇到 usage limit 後，`--resume` 完全無法恢復 context |
| [#15837](https://github.com/anthropics/claude-code/issues/15837) | 正常使用下 resume 也可能遺失 context |
| [#15918](https://github.com/anthropics/claude-code/issues/15918) | `--resume SESSION_ID -p ""` 空 prompt 導致殭屍 process |
| [#18311](https://github.com/anthropics/claude-code/issues/18311) | 對話 `.jsonl` 檔案消失導致 resume 失敗 |

---

## 七、Subagent 在 `-p` 模式的行為

- Subagent **不是子程序**，是同一 process 內的獨立 agent loop，各自有隔離的 context window
- 支援並行（最多 ~7-10 個同時執行）
- Subagent **不能再 spawn subagent**（禁止巢狀）
- 已知 bug：subagent 在 `-p` 模式可能遇到 `dontAsk` 權限問題（[#11934](https://github.com/anthropics/claude-code/issues/11934)）
- Permission：前景 subagent 會上報 permission；背景 subagent 預先核准，未核准的 auto-deny

---

## 八、OpenClaw 的多 Agent 實作方式（參考）

OpenClaw 採用 **SDK/Library 內嵌** 方式，不使用 PTY 也不使用 spawn CLI：

- 直接 import `@mariozechner/pi-agent-core` library
- 呼叫 `createAgentSession()` 在同一 Node.js process 內建立 agent
- 和 LLM 通訊用 HTTP API（`anthropic-messages` / `openai-completions`）
- 不依賴任何 CLI binary

| 面向 | OpenClaw | 我們的方案 |
|------|---------|-----------|
| Agent 怎麼跑 | 同 process 內函式呼叫 | spawn CLI subprocess |
| 和 LLM 通訊 | 直接 HTTP API | 透過 CLI → CLI 打 API |
| 多 Provider | 統一 HTTP adapter | 不同 CLI binary |
| Tool 執行 | Agent runtime 直接執行 | CLI 內部處理 |

來源：
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Pi: The Minimal Agent Within OpenClaw](https://lucumr.pocoo.org/2026/1/31/pi/)

---

## 九、架構決策總結

### 選擇 `spawn + -p` 的理由

1. Claude CLI 互動模式的 Ink submit bug 導致 PTY 方案**技術上不可行**
2. `-p` 模式支援所有核心功能：model 切換、MCP、plan mode、subagent、skills（model-invoked）
3. `--output-format stream-json` 產生乾淨 JSON，不需 ANSI strip
4. 測試友善（MockProcess DI）

### 已知風險

1. `--resume` 有 context 遺失 bug — 多輪對話的可靠性存疑
2. `.claude/settings.json` 權限設定在 `-p` 模式被忽略 — 必須用 `--allowedTools`
3. Subagent 的 `dontAsk` 權限 bug
4. User-invoked skills 不可用（但 model-invoked 可自動觸發）

### PTY 的正確用途

僅用於現有的 terminal emulator 功能（讓使用者直接操作 shell），不用於程式化控制 Claude CLI。
