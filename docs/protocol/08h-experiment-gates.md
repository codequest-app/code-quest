### 7.11 Experiment Gates（功能旗標機制）

**方向**：CLI → Extension（MCP 通知）→ WebView（衍生狀態）

**用途**：Claude CLI 透過 MCP 通知推送功能旗標（experiment gates），Extension 據此控制特定功能的啟用或停用。

---

#### 7.11.1 接收機制

CLI 透過 MCP notification 推送 experiment gates：

**位置**：第 46534–46537 行

```json
{
  "method": "experiment_gates",
  "params": {
    "gates": {
      "gate_name": true,
      "another_gate": false
    }
  }
}
```

**Schema**：`params.gates` 為 `Record<string, boolean>`，key 為 gate 名稱，value 為啟用狀態。

Extension 在 `launchClaude()` 時透過 MCP notification handler（第 49807–49808 行），收到通知後呼叫 `onExperimentGatesUpdated(gates)`。

---

#### 7.11.2 儲存與持久化

**位置**：第 70878–70880 行

```javascript
onExperimentGatesUpdated(gates) {
  this.experimentGates = gates;                              // 記憶體快取
  this.context.globalState.update("experimentGates", gates); // VSCode globalState 持久化
  this.checkAndUpdateReviewUpsellBanner();                   // 觸發副作用
}
```

- **記憶體**：`this.experimentGates`（class 屬性，第 49732 行）
- **持久化**：VSCode `globalState` key `"experimentGates"`
- **初始化**：constructor 從 `globalState` 讀取，預設為空物件 `{}`

---

#### 7.11.3 已知 Gate 列表

| Gate 名稱 | 用途 | 影響範圍 | 位置 |
|-----------|------|---------|------|
| `tengu_vscode_onboarding` | 啟用 Onboarding 引導流程 | `init_response.state.isOnboardingEnabled`、`update_state.state.isOnboardingEnabled` | 第 50247、51025 行 |
| `tengu_vscode_review_upsell` | 顯示 Review 推廣橫幅 | `checkAndUpdateReviewUpsellBanner()` 的前置條件 | 第 71151 行 |
| `tengu_quiet_fern` | 啟用瀏覽器整合（Chrome MCP） | `isBrowserIntegrationSupported()` 的必要條件 | 第 71518 行 |

---

#### 7.11.4 傳遞至 WebView

Gate 值**不直接**傳遞給 WebView，而是轉換為衍生狀態欄位：

```
CLI ─(MCP notification)─→ Extension ─(衍生狀態)─→ WebView
     experiment_gates          isOnboardingEnabled
                               showReviewUpsellBanner
                               browserIntegrationSupported
```

這些衍生狀態透過 `init_response`（初始化）和 `update_state`（狀態推送）傳遞至 WebView。

---

#### 7.11.5 完整流程

```
CLI 啟動完成
  ↓
CLI 發送 MCP notification: { method: "experiment_gates", params: { gates: {...} } }
  ↓
Extension MCP handler 接收
  ↓
onExperimentGatesUpdated(gates)
  ├── 更新 this.experimentGates（記憶體）
  ├── 持久化至 globalState
  └── 觸發 checkAndUpdateReviewUpsellBanner()
        ├── 檢查 tengu_vscode_review_upsell gate
        └── 若啟用 → 進一步檢查條件 → 設定 showReviewUpsellBanner → pushStateUpdate()
  ↓
後續 init_response / update_state 包含衍生狀態
  ↓
WebView 根據 isOnboardingEnabled 等欄位決定 UI 行為
```

> **設計特點**：Gate 的 key-value 格式支援動態擴展，新增 gate 不需更動協議格式，只需在 Extension 端新增對應邏輯。
