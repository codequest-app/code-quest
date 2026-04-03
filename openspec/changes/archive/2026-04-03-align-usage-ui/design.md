## Context

cc-office 的 Usage UI（UsageBar + AccountUsageDialog）與 extension v2.1.45 在視覺行為上有 4 處差異。所有需要的資料（usage quota、auth method、subscription type）已透過現有 socket events（`system:rate_limit`、`session:init`、`state:update`）取得，不需打額外 API。

現有檔案：
- `packages/client/src/components/UsageBar.tsx` — inline toolbar usage bars
- `packages/client/src/components/AccountUsageDialog.tsx` — `/usage` dialog
- `packages/shared/src/schemas/notification.ts` — UsageQuota type

## Goals / Non-Goals

**Goals:**
- Usage bar 變色邏輯對齊 extension（80% 單門檻）
- Reset time 統一為相對格式（`in Xm/Xh/Xd`）
- AccountUsageDialog 加入 "Manage usage on claude.ai" 連結
- 非 claudeai auth 時顯示 unavailableReason 提示
- Usage bar 圓角從 `rounded-full` 改為 `rounded-sm`

**Non-Goals:**
- 不打 Anthropic API 取 usage data（繼續依賴 CLI push 的 rate_limit_event）
- 不移除 cc-office 額外的 Session / Context section（這是增值功能）
- 不移除 extra_usage / overage 顯示

## Decisions

### 1. Usage bar 變色：兩態制

Extension 只有 normal（progressbar 預設色）和 high（>=80%, orange）。cc-office 目前有 success/warning/danger 三色。

**決定**：改為兩態 — `bg-accent`（正常）和 `bg-danger`（>=80%）。移除 50% warning 門檻。

**理由**：與 extension 行為一致。三色分級在 6px 高的 bar 上辨識度不高。

### 2. Reset time：抽取共用 `formatResetTime`

AccountUsageDialog 已有 `formatResetTime` 回傳 `in Xm/Xh/Xd`。UsageBar 目前用 `toLocaleTimeString`。

**決定**：將 `formatResetTime` 抽到 shared util，UsageBar 和 AccountUsageDialog 共用。

**理由**：避免重複邏輯，且相對時間更直覺。

### 3. "Manage usage" 連結放在 Quota section 底部

**決定**：當 authMethod === 'claudeai' 時，在 Quota section 最底部顯示 button-style link。URL 根據 subscriptionType：
- `team` / `enterprise` → `https://claude.ai/admin-settings/usage`
- 其他 → `https://claude.ai/settings/usage`

點擊行為：`window.open(url, '_blank')`

### 4. unavailableReason 顯示

**決定**：在 Quota section，當 authMethod 不是 `claudeai` 時，顯示 italic 灰字提示 "Usage tracking is only available for Claude AI subscribers."。不需從 server 額外傳 unavailableReason 欄位 — client 端根據 authMethod 直接判斷。

## Risks / Trade-offs

- [Extension 行為可能在新版改變] → 這是 point-in-time 對齊，後續用 protocol-alignment skill 追蹤
- [移除 warning 色可能降低提前警告] → 80% 門檻已足夠，且與 extension 一致
