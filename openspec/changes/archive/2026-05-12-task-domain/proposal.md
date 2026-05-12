# Task Domain — 獨立 State 管理

## What

將 task 生命週期（task_started / task_progress / task_notification）從 `block.meta` patch 模式抽離為獨立的 `state.tasks: Map<toolUseId, Task>` domain。

## Why

### DB 實證（session `513938c2-87b1-4ede-bbc4-eaa24eb49afe`）

| 指標 | 數值 |
|---|---|
| task_started (local_agent) | 58 |
| task_started (local_bash) | 109 |
| task_progress 總量 | 1341 |
| task_notification | 166 (162 completed, 3 failed, 1 stopped) |

**關鍵發現：**

1. **local_bash** 無 task_progress，生命週期極簡：started → notification(completed)
2. **local_agent** 平均每個 task 有 23 個 progress 事件（分布 4~136），內容是即時狀態文字（"Finding ...", "Reading ...", "Running grep ..."）
3. 幾乎所有 task 都有 notification：local_bash 100%, local_agent 98%

### 現有架構問題

目前 `task_progress` 透過 `patchToolUseMeta` 更新，每次都要：
1. 遍歷 `state.messages[]` 找到 assistant_turn（O(n)）
2. 找到 turn 內的 block（O(m)）
3. Clone 整個 messages array → 觸發所有 message 的 re-render

local_agent 的 progress 高頻更新（一個 session 1341 次）會造成不必要的 UI 重繪。

### 獨立 domain 的好處

- `task_progress` 只更新 `state.tasks` map entry，不觸發 messages re-render
- Task 狀態查詢 O(1)（`tasks.get(toolUseId)`）
- SpinnerVerb 可直接訂閱 task state 顯示 progress text
- 清楚的生命週期模型，不散落在 system.ts + streaming.ts + message-tree.ts

## Scope

- 新增 `state.tasks: Map<toolUseId, Task>` 到 ChannelState
- Task handler 獨立為 `handlers/task.ts`
- UI 元件從 task state 讀取 status / progress text
- 移除 `patchToolUseMeta` 中 task 相關的 patch 邏輯
- SpinnerVerb 改為讀 task progress description
- 解決 compound-message 13.4：replay 時 task 已 completed，SpinnerVerb 不顯示

## Out of scope

- 跨 session task 追蹤
- Task 子訊息列表（未來考慮）
- process-zombie-detection（獨立 change）
