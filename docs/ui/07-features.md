# 07 — 各項功能說明

## @-Mention 功能

Extension 提供兩種 @-mention 機制，將編輯器中的檔案/選取範圍參考插入 Claude 對話：

| 指令 | 觸發方式 | 行為 |
|------|----------|------|
| `claude-vscode.insertAtMention` | `Alt+K`（原生 UI 模式） | 取得當前檔案路徑與選取行號，產生 `@file#line` 格式並發送至 Webview |
| `claude-code.insertAtMentioned` | `Cmd+Alt+K`（Terminal 模式） | 同上，透過 JSON-RPC `at_mentioned` 方法發送至 CLI 程序 |

- 無選取時：發送 `@相對路徑`
- 有選取時：發送 `@相對路徑#起始行-結束行`

---

## Active Editor Context 追蹤

Extension 持續監聽 `onDidChangeActiveTextEditor` 與 `onDidChangeTextDocument` 事件，將當前編輯器的以下資訊即時傳遞給 Claude：

- `filePath` — 檔案路徑
- `startLine` / `endLine` — 選取範圍行號
- `startColumn` / `endColumn` — 選取範圍欄位
- `selectedText` — 選取的文字內容（僅在非 git-ignored 檔案時提供）

---

## Thinking Level（思考層級）控制

使用者可從 Webview 切換 Claude 的思考模式：

| 層級 | CLI 參數 | 說明 |
|------|----------|------|
| `default_on` | （不傳參數） | 預設啟用思考 |
| `disabled` | `--thinking disabled` | 停用思考 |
| `adaptive` | `--thinking adaptive` | 自適應思考 |

- 儲存於 `globalState.thinkingLevel`（非 VS Code 設定，而是 Extension 內部狀態）
- 透過 `set_thinking_level` message type 從 Webview 觸發
- 透過 `set_max_thinking_tokens` control request 傳遞給 CLI

---

## Effort 參數

`--effort` 參數在 CLI 啟動時傳遞，但 **VS Code 設定中無對應的 UI 設定項**。此參數僅在 Agent SDK 模式下透過 `options.effort` 傳入，一般 Extension 使用者無法從 UI 直接切換。

---

## URI Handler

Extension 註冊了 URI Handler，支援透過 `vscode://` URI 觸發操作：

- **`/install-plugin`**：接受 `?plugin=名稱&marketplace=來源` 參數，自動開啟 Claude 對話並彈出 Plugin 安裝對話框

---

## Notebook 支援

Extension 具備基本的 Jupyter Notebook 互動能力：
- 可建立 Python `NotebookCellData` 並插入 Notebook
- 執行前透過 `showQuickPick` 讓使用者確認是否執行程式碼

---

## Experiment Gates（實驗旗標）

Extension 透過 MCP 協議接收 CLI 推送的實驗旗標（`experiment_gates` notification），格式為 `{ gates: Record<string, boolean> }`。用於動態啟用/停用實驗性功能，並可透過 `apply_flag_settings` control request 將設定回傳給 CLI。

---

## Remote Control（遠端控制）

Extension 支援啟用/停用遠端控制模式，透過 `remote_control` control request（含 `enabled: boolean`）傳遞給 CLI。用於允許外部系統控制 Claude 對話。

---

## Proactive Suggestions（主動建議）

Extension 可向 Webview 推送輸入建議（`proactive_suggestions_update` request），在對話輸入框中顯示 AI 主動建議的提示文字。

---

## File Updated 通知

當 Claude 修改檔案後，CLI 透過 `file_updated` notification 將變更資訊推送給 Webview：
- `filePath` — 變更的檔案路徑
- `oldContent` — 修改前的內容（可為 null）
- `newContent` — 修改後的內容（可為 null）

Webview 可據此更新 diff 預覽或顯示檔案變更紀錄。

---

## File Save 與 autoSave 整合

Extension 偵測 VS Code 的 `files.autoSave` 設定：
- **autoSave 關閉時**：等待使用者手動存檔後才繼續流程（透過 `onDidSaveTextDocument` 監聽）
- **autoSave 開啟時**：需要使用者透過 UI 明確接受（explicit accept），因為檔案會自動存檔

---

## Telemetry / Analytics

Extension 透過 `log_event` message type（走 MCP 協議 `notification`）將使用者事件記錄傳送給 CLI，由 CLI 處理實際的上報邏輯。Webview 端透過 `log_event` request 觸發。

---

## Native Binary 載入

Extension 在啟動時依平台載入 Claude CLI 原生可執行檔：

1. 優先查找 `resources/native-binaries/{platform}-{arch}/claude`（例如 `darwin-arm64`）
2. Windows ARM64 fallback 到 `win32-x64`（x64 模擬）
3. 最後 fallback 到 `resources/native-binary/claude`
4. 偵測 musl libc（Alpine Linux）使用 `{arch}-musl` 變體
5. 啟動前檢查 Node.js 版本 ≥ 18.0.0
6. Windows 額外檢查 `git-bash` 是否安裝
