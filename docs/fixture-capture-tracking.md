# Fixture 捕獲追蹤

根據 `docs/protocol.md` 列出所有需要捕獲的事件，追蹤真實資料收集進度。

> 規則：所有 fixture **必須從真實 CLI 捕獲**，絕不可手動編寫。
> 判斷依據：對話類事件的真實 CLI 輸出包含 `uuid` 欄位；`control_response` 本身不含 uuid 但為同一 session 真實捕獲。

---

## 一、stdout 訊息類型（§2.3）

兩種模式都可能產生的事件。

| stdout type | 說明 | print (`-p`) | interactive (no `-p`) | fixture 檔案 | 備註 |
|---|---|---|---|---|---|
| `system` (subtype=init) | 會話初始化 | [x] | [x] | `simple-text.jsonl`, `control-initialize.jsonl` | |
| `assistant` (text) | 純文字回應 | [x] | [x] | `simple-text.jsonl`, `control-initialize.jsonl` | |
| `assistant` (thinking) | 思考內容 | [ ] | [x] | `control-interrupt.jsonl` (line 1) | interrupt 中斷後可見 |
| `assistant` (tool_use) | 工具呼叫 | [x] | [ ] | `tool-use-read.jsonl` | |
| `assistant` (tool_result) | 工具結果 | [ ] | [ ] | | 嵌在 user type 的 content 內 |
| `user` | 使用者訊息（auto tool_result） | [x] | [x] | `tool-use-read.jsonl`, `control-interrupt.jsonl` | parser 忽略 |
| `result` | 最終結果（含 stats） | [x] | [x] | `simple-text.jsonl`, `control-initialize.jsonl` | |
| `rate_limit_event` | 速率限制事件 | [x] | [x] | `simple-text.jsonl`, `control-initialize.jsonl` | parser 忽略 |
| `error` | 頂層錯誤訊息 | [ ] | [ ] | | 可能僅網路/API 故障時產生 |
| `keep_alive` | 保活訊號 | [ ] | [ ] | | 長時間操作被動產生 |
| `streamlined_text` | 精簡文字 | [ ] | [ ] | | 特定 output style 才產生 |
| `streamlined_tool_use_summary` | 工具使用摘要 | [ ] | [ ] | | 特定 output style 才產生 |
| `tool_use` (top-level) | 獨立工具呼叫 type | [ ] | [ ] | | §2.3 列出但未確認格式 |

> **注意**：`-p` 模式需搭配 `--output-format stream-json --verbose` 才有輸出。

---

## 二、Control Protocol — stdin control_request（§1.2）

只在 interactive mode 使用。每個 subtype 需捕獲對應的 stdout `control_response`。

| subtype | 說明 | 已捕獲 | fixture 檔案 | 備註 |
|---|---|---|---|---|
| `initialize` | 初始化會話 | [x] | `control-initialize.jsonl` | 含 models/commands/account/pid |
| `interrupt` | 中斷當前操作 | [x] | `control-interrupt.jsonl` | 含 thinking + 中斷後 result |
| `set_permission_mode` | 設定權限模式 | [x] | `control-set-permission-mode.jsonl` | response 含 `{mode}` |
| `set_model` | 切換 AI 模型 | [x] | `control-set-model.jsonl` | response 無 payload |
| `set_max_thinking_tokens` | 設定最大思考 token 數 | [x] | `control-set-max-thinking-tokens.jsonl` | |
| `rewind_files` | 回退檔案狀態 | [x] | `control-rewind-files.jsonl` | error: "File rewinding is not enabled." |
| `stop_task` | 停止任務 | [x] | `control-stop-task.jsonl` | error: "No task found with ID: ..." |
| `mcp_reconnect` | 重連 MCP 伺服器 | [x] | `control-mcp-reconnect.jsonl` | error: "Server not found: undefined" |
| `mcp_toggle` | 啟用/停用 MCP 伺服器 | [x] | `control-mcp-toggle.jsonl` | error: "Server not found: undefined" |
| `mcp_status` | 查詢 MCP 伺服器狀態 | [x] | `control-mcp-status.jsonl` | |
| `mcp_set_servers` | 設定 MCP 伺服器 | [x] | `control-mcp-set-servers.jsonl` | success, added/removed/errors |
| `can_use_tool` | 工具權限請求 | [x] | `control-request-can-use-tool.jsonl` | CLI→Extension，需 `--permission-prompt-tool stdio` |
| `hook_callback` | 鉤子回調 | [x] | `control-request-hook-callback.jsonl` | CLI→Extension，需 initialize 時傳入 hooks |
| `mcp_message` | MCP 訊息轉發 | [x] | `control-mcp-message.jsonl` | success (空 payload) |

---

## 三、Control Protocol — stdout 回應（§2.2, §2.4）

| stdout type | 說明 | 已捕獲 | fixture 檔案 | 備註 |
|---|---|---|---|---|
| `control_response` (success) | 成功回應 | [x] | init/model/perm/think/mcp-st 各一 | |
| `control_response` (error) | 錯誤回應 | [x] | `control-response-error.jsonl` | "Unsupported control request subtype" |
| `control_request` (from CLI) | CLI 主動發起的控制請求 | [x] | `control-request-can-use-tool.jsonl`, `control-request-hook-callback.jsonl` | 需 `--permission-prompt-tool stdio` + hooks |
| `control_cancel_request` | CLI 取消請求 | [ ] | | |

---

## 四、現有 fixture 清單

### Claude (`packages/cli-adapter/src/__fixtures__/claude/`)

全部為 2026-02-20 從真實 Claude CLI 2.1.49 interactive mode 捕獲。

| 檔案 | 行數 | 事件類型 | uuid |
|---|---|---|---|
| `simple-text.jsonl` | 4 | system + assistant(text) + rate_limit + result | 4 |
| `tool-use-read.jsonl` | 6 | system + assistant(tool_use) + user + rate_limit + assistant(text) + result | 6 |
| `control-initialize.jsonl` | 5 | control_response(init) + system + assistant(text) + rate_limit + result | 4 |
| `control-set-model.jsonl` | 1 | control_response(success) | 0 |
| `control-set-permission-mode.jsonl` | 1 | control_response(success, {mode}) | 0 |
| `control-set-max-thinking-tokens.jsonl` | 1 | control_response(success) | 0 |
| `control-mcp-status.jsonl` | 1 | control_response(success) | 0 |
| `control-response-error.jsonl` | 1 | control_response(error) | 0 |
| `control-interrupt.jsonl` | 5 | system + assistant(thinking) + control_response(int) + user + result | 4 |
| `control-rewind-files.jsonl` | 1 | control_response(error) | 0 |
| `control-stop-task.jsonl` | 1 | control_response(error) | 0 |
| `control-mcp-reconnect.jsonl` | 1 | control_response(error) | 0 |
| `control-mcp-toggle.jsonl` | 1 | control_response(error) | 0 |
| `control-mcp-set-servers.jsonl` | 1 | control_response(success) | 0 |
| `control-mcp-message.jsonl` | 1 | control_response(success) | 0 |
| `control-request-hook-callback.jsonl` | 1 | control_request(hook_callback) CLI→Extension | 0 |
| `control-request-can-use-tool.jsonl` | 1 | control_request(can_use_tool) CLI→Extension | 0 |

### Gemini (`packages/cli-adapter/src/__fixtures__/gemini/`)

| 檔案 | 狀態 |
|---|---|
| `simple-text.jsonl` | [ ] 需重新收集（已刪除） |
| `tool-use-read.jsonl` | [ ] 需重新收集（已刪除） |

### E2E (`e2e/fixtures/fixtures/`)

| 檔案 | 來源 | 狀態 |
|---|---|---|
| `claude-simple-text.jsonl` | 同 cli-adapter simple-text | [x] 已更新 |
| `claude-tool-use.jsonl` | 同 cli-adapter tool-use-read | [x] 已更新 |
| `gemini-simple-text.jsonl` | | [ ] 需重新收集 |
| `gemini-tool-use.jsonl` | | [ ] 需重新收集 |

---

## 五、待收集項目（按優先級）

### P1：缺少的 stdout 事件
- [ ] `assistant` (thinking) — 獨立 fixture（目前只在 interrupt 中出現）
- [ ] `permission` — 權限請求事件
- [ ] `error` — 頂層錯誤
- [ ] `tool_use` — 確認是否存在獨立 top-level type

### P2：缺少的 control subtype
- [x] `rewind_files` — error: "File rewinding is not enabled."
- [x] `stop_task` — error: "No task found with ID: ..."
- [x] `mcp_reconnect` — error: "Server not found: undefined"
- [x] `mcp_toggle` — error: "Server not found: undefined"
- [x] `mcp_set_servers` — success (empty servers)
- [x] `hook_callback` — CLI→Extension control_request (需 initialize 時傳入 hooks)
- [x] `mcp_message` — success (empty payload)
- [x] `can_use_tool` — CLI→Extension control_request (需 `--permission-prompt-tool stdio`)

### P3：Gemini
- [ ] `gemini/simple-text.jsonl`
- [ ] `gemini/tool-use-read.jsonl`

### P4：被動產生的事件
- [ ] `keep_alive` — 長時間操作
- [ ] `streamlined_text` / `streamlined_tool_use_summary` — 特定 output style
- [ ] `control_cancel_request` — CLI 主動取消

---

## 六、收集環境

```
CLI: Claude Code 2.1.49
OS: macOS (darwin-arm64)
收集日期: 2026-02-20
方法:
  print mode: env -u CLAUDECODE claude -p "..." --output-format stream-json --verbose
  interactive mode: named pipe + --input-format stream-json --output-format stream-json --verbose
注意:
  - 在 Claude Code session 內收集時需 env -u CLAUDECODE 或 unset CLAUDECODE
  - interactive mode 必須加 --input-format stream-json，否則 stdin JSON 會被當作一般使用者文字
```
