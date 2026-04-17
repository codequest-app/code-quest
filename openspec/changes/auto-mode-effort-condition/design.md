## Context

CLI 廣播的 `app:models` 包含每個 model 的 `supportsAutoMode` flag。目前 server 把 `cachedModels`（CLI 的原始值）直接廣播，`supportsAutoMode` 只反映 model 能力，沒有考慮當前 effort level。

Auto mode 依賴 extended thinking，只有 `effortLevel === 'xhigh'` 時才有意義。需要 server 在廣播前計算有效值。

## Goals / Non-Goals

**Goals:**
- `app:models` 廣播的 `supportsAutoMode` 同時反映 model 能力 + 當前 effort level
- 改 model 或改 effort 時自動重廣播 `app:models`
- Client 邏輯不變（只讀 flag，不自己判斷）

**Non-Goals:**
- 改變 `cachedModels` 的儲存格式（維持原始 CLI 值）
- 新增 event type

## Decisions

### 計算時機
在廣播前即時計算，`cachedModels` 保持原始 CLI 值不變。

```
effectiveSupportsAutoMode = model.supportsAutoMode && effortLevel != null
```

### 抽出 broadcastModels helper
在 `settings.ts` handler 中加入 `broadcastModels(effortLevel)` helper，讀取 `cachedModels`、套用 effort 條件、廣播。

三個地方呼叫：
1. `applyInitResponseAndBroadcast`（已有，改為走 helper）
2. `handleSetModel` 結束後（需要知道當前 effortLevel）
3. `handleApply` 當 `effortLevel` 有變更時

### effortLevel 來源
`handleSetModel` 和 `handleApply` 都能從 `settingsStore.get(provider, 'effortLevel')` 讀到最新值。

## Risks / Trade-offs

- `handleSetModel` 多一次 `settingsStore.get` — 成本極低，可接受
- 若 `cachedModels` 為空（session 尚未 launch），`broadcastModels` 直接 no-op

## Testing

沿用現有測試：

- `settings.test.ts` — `set_model` 和 `apply_settings` 測試直接加 `app:models` event 的 expect，驗 `supportsAutoMode` 隨 effort 正確變化
- `config-from-session.test.tsx` — 現有 `supportsAutoMode updates when model switches` 測試已涵蓋 client 端行為，無需修改
