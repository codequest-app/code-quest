# Orphaned Components 記錄

**Branch:** `feature/chat-streaming-enhancements`
**Date:** 2026-03-05

重構時發現以下 component 從未被 `ChatPanel` import，屬於 orphaned component，已於 TDD cleanup 中刪除。日後若有需要可從 git history 還原。

---

## SettingsPanel

**功能說明：** 讓使用者用 JSON textarea 編輯應用設定，有 JSON parse 驗證。

**刪除的檔案：**
- `packages/client/src/components/SettingsPanel.tsx`
- `packages/client/src/components/__tests__/SettingsPanel.test.tsx`

---

## TelemetryPanel

**功能說明：** 顯示 telemetry events 列表，有 Refresh / Close 按鈕。

**刪除的檔案：**
- `packages/client/src/components/TelemetryPanel.tsx`
- `packages/client/src/components/__tests__/TelemetryPanel.test.tsx`

---

## PluginPanel

**功能說明：** Plugin 管理面板，可安裝/解安裝/啟用停用 plugin，管理 marketplace。

**刪除的檔案：**
- `packages/client/src/components/PluginPanel.tsx`
- `packages/client/src/components/__tests__/PluginPanel.test.tsx`
- `packages/client/src/components/PluginPanel.stories.tsx`
