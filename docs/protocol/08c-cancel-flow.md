### 7.6 請求取消流程（`control_cancel_request` 觸發機制）

**方向**：Claude CLI → stdout → Extension（被動接收）

**觸發條件**：CLI 先前發送了一個 `control_request`（如 `can_use_tool`、`hook_callback`），但在 Extension 回應之前，CLI 決定取消該請求（例如使用者中斷操作、超時等）。

> **備註**：`control_cancel_request` 可取消任何進行中的 `control_request`。在純 CLI stream-json 模式下，因為不會發出 `can_use_tool`，此機制主要用於取消 `hook_callback` 或 `mcp_message` 等請求。

**完整觸發鏈**：

```
① CLI 送出 control_request { request_id: "abc123", ... }
    ↓
② Extension 收到，建立 AbortController 存入 cancelControllers Map（第 30988-30989 行）：
    cancelControllers.set("abc123", new AbortController())
    ↓
③ Extension 開始處理（例如正在等使用者回應權限對話框）
    ↓
④ CLI 決定取消，透過 stdout 送出：
    { type: "control_cancel_request", request_id: "abc123" }
    ↓
⑤ Extension readMessages()（第 30958 行）判斷 type === "control_cancel_request"
    ↓
⑥ handleControlCancelRequest()（第 31027 行）：
    - 從 cancelControllers Map 取出 AbortController
    - 呼叫 abort() 中止進行中的操作
    - 從 Map 刪除該 controller
```

**相關程式碼**：

```javascript
// 第 31027-31029 行
handleControlCancelRequest(v) {
  let z = this.cancelControllers.get(v.request_id);
  if (z) z.abort(), this.cancelControllers.delete(v.request_id);
}
```

**abort 的效果**：
- 正在等待的 `processControlRequest()` 會收到 abort signal
- 透過 `sendRequest()` 送出的 WebView 請求（如權限對話框）帶有 signal 參數（第 49920-49931 行），abort 時會自動發送 `cancel_request` 給 WebView 並 reject Promise

```javascript
// 第 49921-49931 行：sendRequest 中的 abort 處理
let x = () => {
  this.outstandingRequests.delete(V),
    this.send({ type: "cancel_request", targetRequestId: V }),
    K(Error(U.reason || "aborted"));
};
if (U.aborted) { x(); return; }
U.addEventListener("abort", x, { once: !0 });
```

---

