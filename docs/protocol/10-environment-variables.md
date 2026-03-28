## 9. 環境變數參考

Extension 和 CLI 在啟動時會讀取以下環境變數。

---

### 9.1 功能開關

| 變數 | 預設 | 說明 |
|------|------|------|
| `CLAUDE_PROACTIVE_SUGGESTIONS` | `false` | 設為 `true` 啟用對話開始時的智能建議（呼叫 Claude Haiku 分析 git context 生成提示） |
| `CLAUDE_SPEECH_TO_TEXT` | `false` | 設為 `true` 啟用語音轉文字功能（麥克風輸入） |
| `AT_MENTION_TERMINAL` | `false` | 設為 `true` 啟用 @mention 時插入終端機內容 |
| `ENABLE_INSTALL_PLUGIN` | 未設定 | 設為任意值啟用外掛安裝功能（Plugin Marketplace） |
| `USE_BUILTIN_RIPGREP` | 未設定 | 設為任意值強制使用 extension 內建的 ripgrep，忽略系統版本 |

---

### 9.2 AI 後端選擇

| 變數 | 說明 |
|------|------|
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock 作為 AI 後端 |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Cloud Vertex AI 作為 AI 後端 |
| `CLAUDE_CODE_USE_FOUNDRY` | 使用其他 Foundry 後端 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | 禁止非必要的網路流量（如遙測、更新檢查） |

---

### 9.3 OAuth 與認證

| 變數 | 說明 |
|------|------|
| `CLAUDE_CODE_CUSTOM_OAUTH_URL` | 自訂 OAuth 授權 URL（私有部署或企業環境） |
| `CLAUDE_CODE_OAUTH_CLIENT_ID` | 自訂 OAuth Client ID |

---

### 9.4 路徑與目錄

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `CLAUDE_CONFIG_DIR` | `~/.claude` | Claude 設定檔目錄，覆蓋預設路徑 |
| `CLAUDE_CODE_DEBUG_LOGS_DIR` | 未設定 | 指定 debug log 輸出目錄 |
| `CLAUDE_CODE_DIAGNOSTICS_FILE` | 未設定 | 指定診斷資訊輸出檔案路徑 |

---

### 9.5 除錯與效能

| 變數 | 說明 |
|------|------|
| `DEBUG_CLAUDE_AGENT_SDK` | 啟用 Claude Agent SDK 的 debug 輸出 |
| `DEBUG_SDK` | 啟用 SDK 層級的 debug 輸出（同 `--debug` 參數） |
| `DEBUG` | 標準 Node.js debug namespace 篩選 |
| `CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS` | 慢操作警告閾值（毫秒），超過此值會記錄警告 |
| `CLAUDE_CODE_DEBUG_LOG_LEVEL` | 設定 debug log 級別（解析為小寫） |
| `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP` | 停用 precompact skip 邏輯 |
| `NODE_DEBUG` | Node.js 標準 debug namespace 篩選 |
| `DISABLE_ERROR_REPORTING` | 設為任意值停用錯誤回報（遙測） |

---

### 9.6 終端機外觀

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `CLAUDE_CODE_TERMINAL_TITLE` | `"Claude Code"` | 設定 Claude 終端機視窗的標題 |

---

### 9.7 內部與 WebSocket 調校

以下為較低階的變數，通常不需要手動設定：

| 變數 | 說明 |
|------|------|
| `CLAUDE_AGENT_SDK_VERSION` | Extension 啟動時自動設定（如 `0.2.71`），標記 SDK 版本，供 CLI 識別 |
| `WS_NO_BUFFER_UTIL` | 停用 WebSocket `bufferutil` native 加速模組 |
| `WS_NO_UTF_8_VALIDATE` | 停用 WebSocket `utf-8-validate` native 加速模組 |
| `OSTYPE` | 系統類型偵測（繼承自 shell 環境） |

---
