## 0. CLI 啟動參數

**位置**：第 27110–27175 行

Extension 透過 `spawn` 啟動 Claude CLI 執行檔，以 stdin/stdout pipe 做雙向通訊。

### 0.1 預設參數（必帶）

```
claude --output-format stream-json --input-format stream-json --verbose
```

| 參數 | 值 | 說明 |
|------|---|------|
| `--output-format` | `stream-json` | stdout 以逐行 JSON 格式輸出 |
| `--input-format` | `stream-json` | stdin 以逐行 JSON 格式輸入 |
| `--verbose` | — | 輸出詳細資訊 |

### 0.2 條件參數

根據 `spawnClaude()` 傳入的選項，動態追加以下參數：

| 參數 | 條件 | 範例 |
|------|------|------|
| `--max-thinking-tokens <n>` | 有設定思考 token 數 | `--max-thinking-tokens 10000` |
| `--effort <level>` | 有設定 effort | `--effort high` |
| `--max-turns <n>` | 有設定最大輪次 | `--max-turns 5` |
| `--max-budget-usd <n>` | 有設定預算上限 | `--max-budget-usd 1.0` |
| `--model <name>` | 有指定模型 | `--model claude-sonnet-4-6` |
| `--agent <name>` | 有指定 agent | `--agent my-agent` |
| `--betas <list>` | 有啟用 beta 功能 | `--betas beta1,beta2` |
| `--json-schema <json>` | 有指定 JSON schema | `--json-schema '{...}'` |
| `--debug-file <path>` | 有指定 debug 檔案 | `--debug-file /tmp/debug.log` |
| `--debug` | 啟用 debug（無 debug-file 時） | — |
| `--debug-to-stderr` | 環境變數 `DEBUG_CLAUDE_AGENT_SDK` 存在 | — |
| `--permission-prompt-tool stdio` | 有提供 `canUseTool` callback | — |
| `--permission-prompt-tool <name>` | 有指定 `permissionPromptToolName` | — |
| `--continue` | 繼續上次對話 | — |
| `--resume <id>` | 恢復指定會話 | `--resume session_abc123` |
| `--allowedTools <list>` | 有白名單工具 | `--allowedTools Read,Glob` |
| `--disallowedTools <list>` | 有黑名單工具 | `--disallowedTools Bash` |
| `--tools <list>` | 有指定工具集（空陣列傳 `""`，否則逗號分隔或 `default`） | `--tools default` |
| `--mcp-config <json>` | 有 MCP 伺服器設定 | `--mcp-config '{"mcpServers":{...}}'` |
| `--setting-sources <list>` | 有指定設定來源 | `--setting-sources user,project,local` |
| `--strict-mcp-config` | 啟用嚴格 MCP 設定 | — |
| `--permission-mode <mode>` | 有指定權限模式 | `--permission-mode default` |
| `--allow-dangerously-skip-permissions` | 允許跳過權限檢查 | — |
| `--fallback-model <name>` | 有指定備用模型（不可與主模型相同） | `--fallback-model claude-haiku-4-5` |
| `--include-partial-messages` | 啟用部分訊息（非 Remote 環境時） | — |
| `--add-dir <path>` | 每個額外工作目錄（可多次） | `--add-dir /other/project` |
| `--plugin-dir <path>` | 每個本地插件目錄（可多次） | `--plugin-dir /plugins/my-plugin` |
| `--fork-session` | 分叉會話 | — |
| `--resume-session-at <id>` | 從指定點恢復會話 | — |
| `--session-id <id>` | 指定 session ID | `--session-id sess_123` |
| `--no-session-persistence` | 停用 session 持久化 | — |

### 0.3 Extension 額外注入的參數

`spawnClaude()`（第 68226–68232 行）透過 `extraArgs` 注入：

```javascript
extraArgs: {
  "debug": null,              // → --debug
  "debug-to-stderr": null,    // → --debug-to-stderr
  "enable-auth-status": null, // → --enable-auth-status
  "no-chrome": null,          // → --no-chrome
}
```

（`null` 值表示旗標型參數，無需帶值）

### 0.4 環境變數

| 環境變數 | 說明 |
|---------|------|
| `CLAUDE_CODE_ENTRYPOINT` | 設為 `"sdk-ts"`（第 27175 行） |
| `DEBUG` | 若有 `DEBUG_CLAUDE_AGENT_SDK` 則設為 `"1"`，否則刪除 |
| `NODE_OPTIONS` | 啟動前刪除（第 27176 行） |
| Python 相關（`PATH`, `VIRTUAL_ENV`, `CONDA_PREFIX`, `CONDA_DEFAULT_ENV`） | 若啟用 `usePythonEnvironment`，從 VSCode Python 環境繼承 |

### 0.5 執行檔選擇

**位置**：第 27043–27044、68256 行

```javascript
// 預設執行命令
getDefaultExecutable() {
  return $W() ? "bun" : "node";  // 偵測環境選擇 bun 或 node
}
```

Extension 會透過 `getClaudeBinary()`（第 68256 行）取得：
- `pathToClaudeCodeExecutable`：Claude CLI 執行檔路徑
- `executableArgs`：額外執行引數
- `env`：環境變數

最終 spawn 命令形式：

```
<node|bun> [executableArgs] <claude-code-executable> [所有參數]
// 或者如果是原生二進位檔（副檔名非 .js/.mjs/.tsx/.ts/.jsx）：
<claude-code-executable> [所有參數]
```

### 0.6 VSCode Extension 實際完整啟動指令

根據 `spawnClaude()`（第 68179–68254 行）傳入的具體值，以及 `initialize()`（第 27076–27180 行）的參數組裝邏輯，Extension 啟動 CLI 的完整指令如下：

#### 判斷邏輯（第 27178–27180 行）

```javascript
let F6 = Wr(j);  // 判斷是否為原生二進位檔（非 .js/.mjs/.tsx/.ts/.jsx）
let q6 = F6 ? j : N;              // 原生：直接執行 j；JS：用 node/bun（N）
let Z6 = F6 ? [...K, ...m] : [...K, j, ...m];  // 原生：[executableArgs, ...args]；JS：[executableArgs, cli.js, ...args]
```

#### 原生二進位檔模式（darwin-arm64 環境）

```bash
/path/to/extension/resources/native-binary/claude \
  # ── 必帶參數（第 27110-27115 行）──
  --output-format stream-json \
  --verbose \
  --input-format stream-json \
  # ── 條件參數（依 spawnClaude 傳入值）──
  --max-thinking-tokens <j>                    # j = getMaxThinkingTokensForModel(model)，有值時帶
  --model <V|"default">                        # V = 使用者選的模型，null 時傳 "default"
  --permission-prompt-tool stdio               # 因為 canUseTool callback 存在（第 47036 行）
  --setting-sources user,project,local         # 固定值（第 68226 行）
  --permission-mode <K>                        # K = permissionMode，如 "default"
  --include-partial-messages                   # 非 Remote 環境時帶（第 68207 行）
  --mcp-config '{"mcpServers":{...}}'          # B = MCP 伺服器設定，有值時帶
  # ── extraArgs（第 68227-68232 行，透過 Rr() 合併後展開）──
  --debug \
  --debug-to-stderr \
  --enable-auth-status \
  --no-chrome \
  # ── 其他條件參數（視情況追加）──
  --resume <sessionId>                         # 恢復會話時帶（z 參數）
  --allow-dangerously-skip-permissions         # x = getAllowDangerouslySkipPermissions() 為 true 時帶
  --add-dir <path>                             # 每個額外工作目錄（J = workspaceFolders 去掉第一個）
```

#### JS fallback 模式（無原生二進位檔時）

```bash
node \
  <executableArgs> \
  /path/to/extension/resources/claude-code/cli.js \
  --output-format stream-json \
  --verbose \
  --input-format stream-json \
  ... # 同上的條件參數
```

#### 完整參數值來源對照

| 參數 | 值來源 | spawnClaude 中的變數 |
|------|--------|---------------------|
| `--model` | 使用者選擇的模型，`null` 時為 `"default"` | `V`（第 68191 行） |
| `--max-thinking-tokens` | `getMaxThinkingTokensForModel(model)` | `j`（第 68206 行） |
| `--permission-prompt-tool` | 固定 `"stdio"`（因 canUseTool callback 存在） | 隱含（第 27129–27134 行） |
| `--permission-mode` | 使用者設定的權限模式 | `K`（第 68188 行） |
| `--setting-sources` | 固定 `["user", "project", "local"]` | 第 68226 行 |
| `--include-partial-messages` | `!vscode.env.remoteName`（非 Remote 時 true） | 第 68207 行 |
| `--mcp-config` | MCP 伺服器設定 JSON | `B`（第 68233 行） |
| `--resume` | 恢復的 session ID | `z`（第 68186 行） |
| `--allow-dangerously-skip-permissions` | `settings.getAllowDangerouslySkipPermissions()` | `x`（第 68190 行） |
| `--add-dir` | workspace folders（去掉第一個） | `J`（第 68182–68183 行） |
| `--debug` | extraArgs 固定帶 | 第 68228 行 |
| `--debug-to-stderr` | extraArgs 固定帶 | 第 68229 行 |
| `--enable-auth-status` | extraArgs 固定帶 | 第 68230 行 |
| `--no-chrome` | extraArgs 固定帶 | 第 68231 行 |
| `cwd` | 第一個 workspaceFolder 或 this.cwd | `N`（第 68185 行） |

#### extraArgs 合併邏輯（`Rr()` 函式，第 27015–27026 行）

```javascript
function Rr(v, z) {          // v = extraArgs, z = sandbox
  let U = { ...v };
  if (z) {                   // 如果有 sandbox 設定
    let V = { sandbox: z };
    if (U.settings)
      try { V = { ...JSON.parse(U.settings), sandbox: z }; } catch {}
    U.settings = JSON.stringify(V);
  }
  return U;
}
```

展開後（第 27171–27174 行）：
- `null` 值 → 旗標參數：`--debug`、`--debug-to-stderr`、`--enable-auth-status`、`--no-chrome`
- 字串值 → 鍵值參數：`--key value`

#### 環境變數設定（第 27175–27177 行）

```javascript
if (!B.CLAUDE_CODE_ENTRYPOINT) B.CLAUDE_CODE_ENTRYPOINT = "sdk-ts";
delete B.NODE_OPTIONS;
if (B.DEBUG_CLAUDE_AGENT_SDK) B.DEBUG = "1";
else delete B.DEBUG;
```

| 環境變數 | 設定值 |
|---------|--------|
| `CLAUDE_CODE_ENTRYPOINT` | `"sdk-ts"` |
| `NODE_OPTIONS` | 刪除 |
| `DEBUG` | 有 `DEBUG_CLAUDE_AGENT_SDK` 時設 `"1"`，否則刪除 |
| `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING` | `"true"`（第 38824 行，因 enableFileCheckpointing = true） |

---

