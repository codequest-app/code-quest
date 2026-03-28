### 7.26 VSCode 通知機制（show_notification）

**方向**：Extension → VSCode Native Notification → 使用者互動 → WebView

**用途**：透過 VSCode 原生通知 API 向使用者顯示訊息，支援不同嚴重程度與互動按鈕。

---

#### 7.26.1 請求格式

**位置**：第 68153–68176 行

```json
{
  "type": "request",
  "request": {
    "type": "show_notification",
    "message": "通知訊息內容",
    "severity": "error | warning | info",
    "buttons": ["按鈕文字1", "按鈕文字2"],
    "onlyIfNotVisible": true | false
  }
}
```

---

#### 7.26.2 處理流程

```
WebView ──(show_notification)──→ Extension
  ↓
檢查 onlyIfNotVisible：
  ├── true 且面板可見 → 直接回傳（不顯示通知）
  └── false 或面板不可見 → 繼續
  ↓
根據 severity 呼叫 VSCode API：
  ├── "error"   → window.showErrorMessage(message, ...buttons)
  ├── "warning" → window.showWarningMessage(message, ...buttons)
  └── "info"    → window.showInformationMessage(message, ...buttons)
      （預設）
  ↓
等待使用者互動：
  ├── 點擊按鈕 → buttonValue = "按鈕文字"
  │              → 自動顯示 Claude 面板（makeVisible）
  └── 關閉通知 → buttonValue = undefined
  ↓
回傳：
{
  type: "show_notification_response",
  buttonValue: "按鈕文字" | undefined
}
```

---

#### 7.26.3 參數說明

| 參數 | 類型 | 說明 |
|------|------|------|
| `message` | string | 通知訊息內容 |
| `severity` | string | `"error"` / `"warning"` / `"info"`（預設） |
| `buttons` | string[] | 可選，通知上的按鈕文字陣列 |
| `onlyIfNotVisible` | boolean | `true` 時，若 Claude 面板已可見則不顯示通知 |

---

#### 7.26.4 行為特點

- **onlyIfNotVisible**：用於避免重複通知。例如 AI 完成回應時，若使用者已在看 Claude 面板，就不需要額外通知
- **按鈕回調**：使用者點擊按鈕後，Extension 會自動將 Claude 面板帶到前景（`makeVisible()`）
- **非同步等待**：Extension 會等待使用者操作通知後才回傳結果，這使 WebView 能根據使用者的選擇做出反應
