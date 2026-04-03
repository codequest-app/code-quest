## Why

cc-office 的 Account & Usage dialog 和 UsageBar 與 extension (v2.1.45) 在幾個關鍵行為上不一致：reset time 格式、usage bar 變色邏輯、缺少 "Manage usage" 連結和 unavailableReason 處理。對齊可降低使用者在兩端之間切換時的認知落差。

## What Changes

- **UsageBar 變色邏輯**：移除 50% warning 門檻，改為 extension 的 80% 單門檻（normal → high 兩態）
- **Reset time 格式統一**：UsageBar 的 reset time 從絕對時間（`14:30`）改為相對時間（`in 3h`），複用 AccountUsageDialog 已有的 `formatResetTime`
- **新增 "Manage usage on claude.ai" 連結**：AccountUsageDialog 的 Quota section 底部，根據 plan type 導向不同 URL
- **新增 unavailableReason 顯示**：當 auth method 非 claudeai 時，Quota section 顯示提示訊息替代 usage bars
- **Usage bar 圓角微調**：從 `rounded-full` 改為 `rounded-sm`（3px）對齊 extension

## Capabilities

### New Capabilities

（無新增 capability）

### Modified Capabilities

- `client`: Usage UI 行為變更（變色邏輯、reset time 格式、新增連結和 unavailable 狀態）

## Impact

- `packages/client/src/components/UsageBar.tsx` — 變色邏輯、reset time、圓角
- `packages/client/src/components/AccountUsageDialog.tsx` — manage 連結、unavailableReason
- `packages/shared/src/schemas/notification.ts` 或 `settings.ts` — 可能需擴充 UsageQuota type 加 unavailableReason
- 相關 Storybook stories 和測試需更新
