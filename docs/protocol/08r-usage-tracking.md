### 7.21 Usage / Cost 追蹤

**方向**：WebView → Extension → API → WebView

**用途**：取得並推送使用者的 API 用量資訊。

---

#### 7.21.1 請求流程

**位置**：第 47706–47710、48179–48200 行

```
WebView ──(request_usage_update)──→ Extension
  ↓
fetchUsageData()：
  GET https://api.anthropic.com/api/oauth/usage
  Headers: Authorization: Bearer <token>
  ↓
sendUsageUpdate(utilization, error)：
  Extension ──→ WebView（主動推送）：
  {
    type: "request",
    channelId: "",
    requestId: "xxx",
    request: {
      type: "usage_update",
      utilization: {
        five_hour:       { utilization: 0.5, resets_at: "..." },
        seven_day:       { utilization: 0.3, resets_at: "..." },
        seven_day_sonnet:{ utilization: 0.4, resets_at: "..." },
        extra_usage: {
          is_enabled: true,
          monthly_limit: 1000,
          used_credits: 500,
          utilization: 0.5
        }
      },
      error: null
    }
  }
```

---

#### 7.21.2 廣播機制

**位置**：第 69343–69344 行

當任一 communicator 請求 usage update 時，結果會廣播至所有 communicator：

```javascript
let { utilization, error } = await comm.fetchUsageData();
for (let c of this.allComms) c.sendUsageUpdate(utilization, error);
```

---

#### 7.21.3 回應格式

WebView 也會收到同步回應確認：

```json
{ "type": "request_usage_update_response" }
```

實際用量資料透過 `usage_update` 推送（非同步回應的一部分）。
