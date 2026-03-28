### 7.10 Proactive Suggestions（輸入框建議提示）

**方向**：Extension → WebView（單向推送）

**觸發條件**：每次 `launchClaude()` 啟動新的 Claude session 時（`extension.js` 第 49803 行），Extension 會在背景非同步呼叫 `generateAndPushProactiveSuggestions()`。

**啟用條件**：需設定環境變數 `CLAUDE_PROACTIVE_SUGGESTIONS=true`，否則直接跳過（第 51100 行）。

#### 生成流程

```
① launchClaude(channelId) 被呼叫
    ↓
② generateAndPushProactiveSuggestions(channelId)（非同步，不阻塞）
    ↓
③ 收集 context：
   a. f46(cwd)：Git 狀態（branch、status、recent commits、diff）
   b. T46(cwd)：最近 5 個 session 的 summary
    ↓
④ Y46() 組合成 prompt，包含：
   - 當前 branch 與 uncommitted changes
   - 使用者最近的 commits（按 git user.email 過濾）
   - 當前 working tree diff
   - 最近對話主題（recent prompts）
    ↓
⑤ 呼叫 Claude Haiku（claude-haiku-4-5-20251001）生成建議
   - 使用 systemPrompt（S46）指導生成
   - maxThinkingTokens: 0（不使用思考）
   - persistSession: false（不保存 session）
    ↓
⑥ u46() 解析回傳的 JSON 陣列（最多 4 個建議）
    ↓
⑦ 透過 proactive_suggestions_update 訊息推送給 WebView
```

#### 訊息格式

Extension → WebView：

```json
{
  "type": "request",
  "channelId": "頻道ID",
  "requestId": "隨機ID",
  "request": {
    "type": "proactive_suggestions_update",
    "suggestions": [
      {
        "title": "簡短標題（5-10 字）",
        "description": "具體描述，引用實際程式碼",
        "prompt": "直接可用的 prompt 文字"
      }
    ]
  }
}
```

#### System Prompt 要點（S46）

生成建議的 AI 被指導：

- 根據 git diff 理解開發者正在做什麼，建議有意義的下一步工作
- 引用實際的函式名、檔案名、程式碼模式
- 避免瑣碎的 code review 式建議（如「加 error handling 到某一行」）
- 避免泛用建議（對任何 codebase 都適用的）
- 建議 0-4 個，寧少勿多
- 輸出純 JSON 陣列

#### WebView 端渲染

- 儲存在 `proactiveSuggestionsByChannel`（Map，以 channelId 為 key）
- 由 `dn0` 元件（CSS class: `container_oQHzFQ`）渲染為可點擊的建議卡片
- 顯示位置：**只在空白狀態顯示**（`messages.length === 0` 且 `isLoading === false`），即對話開始前的歡迎畫面
- 使用者點擊建議 → 將 `suggestion.prompt` 填入輸入框
- 點擊時記錄 `proactive_suggestion_clicked` 事件（含 `suggestionIndex` 和 `suggestionCount`）

#### 相關程式碼

```javascript
// extension.js 第 51099-51128 行
async generateAndPushProactiveSuggestions(v) {
  if (process.env.CLAUDE_PROACTIVE_SUGGESTIONS !== "true") return;
  // ...收集 git context + recent sessions
  // 呼叫 Claude Haiku 生成建議
  let N = await US({ cwd, logger, ... });
  if (N.suggestions.length > 0) {
    this.send({
      type: "request",
      channelId: v,
      requestId: e8(),
      request: {
        type: "proactive_suggestions_update",
        suggestions: N.suggestions,
      },
    });
  }
}

// webview/index.js — 建議元件
function dn0({ suggestions, onSelect, session }) {
  if (suggestions.length === 0) return null;
  // 渲染建議卡片，點擊時呼叫 onSelect(suggestion.prompt)
  session.logEvent("proactive_suggestion_clicked", {
    suggestionIndex, suggestionCount
  });
}
```

---

