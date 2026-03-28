### 7.8 Plan Mode 流程（ExitPlanMode 與 Plan Comment 機制）

**方向**：CLI ↔ Extension ↔ WebView（雙向互動）

**觸發條件**：CLI 的 AI 模型呼叫 `ExitPlanMode` 工具，表示計畫已撰寫完畢，請使用者審核。

#### Plan file 儲存位置

```
~/.claude/plans/<slug>.md
```

- `<slug>` 為隨機生成的三詞組合（如 `squishy-painting-reddy`）
- 由 `planSlugCache`（Map）管理，避免同一 session 重複生成
- 若設定了 `CLAUDE_CONFIG_DIR` 環境變數，則為 `$CLAUDE_CONFIG_DIR/plans/<slug>.md`

路徑判斷邏輯（`extension.js` 第 19255–19261 行）：

```javascript
function h7() {
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  return Hz.join(Qb.homedir(), ".claude");
}
function Dz(v) {
  let z = Hz.join(h7(), "plans");
  return v.startsWith(z + Hz.sep);
}
```

#### 完整流程

```
① CLI 的 AI 呼叫 ExitPlanMode 工具
    ↓
② CLI 發送 can_use_tool 請求（toolName = "ExitPlanMode"）
    ↓
③ Extension 收到後，呼叫 open_markdown_preview
   → 在 VS Code 中開啟 plan file 的預覽面板
    ↓
④ 使用者閱讀 plan，可選擇：
   a. 在預覽面板中選取文字 → 加上 comment（plan_comment 機制）
   b. 直接 approve / reject
    ↓
⑤ Permission dialog 出現：
   - 無 comment 時顯示「Accept this plan?」
   - 有 comment 時顯示「Continue planning」+ comment 數量
    ↓
⑥ 使用者回應 → 送回 CLI
```

#### Plan Comment 機制（VS Code Extension 獨有）

使用者可在 plan 預覽面板中選取文字並加上批註，這些 comment 透過 WebView 訊息系統傳遞：

##### Comment 資料結構

```json
{
  "type": "comment",
  "id": "comment-唯一ID",
  "selectedText": "被選取的文字",
  "sectionHeading": "所在章節標題",
  "comment": "使用者的批註內容"
}
```

##### Comment 儲存與管理

| 操作 | 訊息類型 | 方向 |
|------|---------|------|
| 新增 comment | `plan_comment` | Extension → WebView（通知） |
| 查詢 comments | `get_plan_comments` → `get_plan_comments_response` | WebView → Extension → WebView |
| 刪除 comment | `remove_plan_comment` → `remove_plan_comment_response` | WebView → Extension → WebView |
| 關閉預覽 | `close_plan_preview` → `close_plan_preview_response` | WebView → Extension → WebView |

Comments 儲存在 Extension 的 `planCommentsByChannel` Map 中（以 channelId 為 key），不持久化。

##### 使用者回應時的回傳值

| 使用者動作 | 回傳值 |
|-----------|--------|
| Approve（無 comment） | `accept(inputs)` |
| Approve（有 comment） | `accept({ ...inputs, userFeedback: "序列化的 comments", userComments: [...] })` |
| Reject | `reject("User chose to stay in plan mode and continue planning")` |

##### userFeedback 序列化格式

當有 comments 時，所有批註被序列化為字串，格式如下：

```
[Re: "選取的文字1"] comment1 內容
[Re: "選取的文字2"] comment2 內容
```

此字串作為 `userFeedback` 欄位回傳給 CLI，CLI 會將其注入後續 prompt context，讓 AI 根據使用者的批註修正計畫。

##### 相關程式碼（webview/index.js）

```javascript
// ExitPlanMode 工具名稱
var nN = "ExitPlanMode";

// Approve 時帶上 comments
let r = J.getPlanComments($.channelId);
if (r.length > 0) {
  let O5 = r.map((a1) => `[Re: "${a1.selectedText}"] ${a1.comment}`).join("\n");
  $.accept({ ...z1, userFeedback: O5, userComments: c }, v);
  return;
}
$.accept(z1, v);

// Reject 時的訊息
var Jn = "User chose to stay in plan mode and continue planning";
```

---

