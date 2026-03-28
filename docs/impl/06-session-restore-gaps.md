# Session Restore — Implementation Gaps

本文件記錄三種還原場景（Resume / Teleport / Fork）中，我們的實作與 VSCode Extension 協議的差異。

---

## 架構差異

VSCode Extension 直接讀寫本地 `~/.claude/sessions/*.jsonl` 檔案。
我們是 C/S 架構，Server 透過 DB (`raw_entries` / `messages` 表) 儲存事件，Client 透過 Socket.IO 取得歷史。

此差異是設計選擇，不是缺陷。以下列出因此產生的功能差距。

---

## 已對齊 ✅

| 功能 | 說明 |
|------|------|
| `get_session_request` 回傳 events | 合併了 metadata + 歷史事件，取代 `custom:history` |
| 歷史過濾 | 排除 `stream_event`、`control_request/response`、transient system subtypes |
| Resume 流程 | Client: `get_session_request` → 渲染歷史 → `custom:join` / `launch_claude --resume` |
| Fork 回傳 events | `fork_conversation` callback 包含 parent session 歷史 |
| Teleport 回傳 events | `teleport_session` callback 包含 parent session 歷史 |
| CLI `--resume` | 透過 `resumeSessionId` 傳給 CLI，CLI 自己恢復上下文 |

---

## 無法對齊（需要 API 存取）

### 1. `list_remote_sessions` — 需要 Anthropic API

**協議行為：** Extension 呼叫 `GET /v1/sessions` (Anthropic API) 列出遠端 session。

**我們的狀態：** 目前從 DB 查詢 `sessions` 表，篩選有 `parentId` 的記錄。這只能列出本地已知的 session，無法列出其他機器上的 session。

**替代方案：** CLI 本身可能支援遠端 session 的 `--resume`（CLI 內部會呼叫 API）。如果未來需要列出遠端 session，需要：
- 取得 Anthropic API key（從 CLI auth 或環境變數）
- 實作 `GET /v1/sessions` 呼叫
- 或者提供 CLI 命令包裝（如 `claude sessions list --json`）

### 2. Teleport 下載流程 — CLI 原生支援

**協議行為：** Extension 呼叫 `GET /v1/session_ingress` 下載遠端對話，寫入本地 JSONL，加上 `teleported-from` 標記。

**我們的狀態：** 直接把 `remoteSessionId` 傳給 CLI `--resume`。CLI 自己會處理遠端 session 的恢復。

**結論：** 不需要額外實作。CLI 的 `--resume` 原生支援遠端 session ID。

---

## 不適用於我們的架構

### 3. sidechain / parentUuid 過濾

**協議行為：** Extension 讀 JSONL 時過濾 `isSidechain: true` 的行，用 `parentUuid` 建立訊息樹。

**我們的狀態：** 我們解析的是 CLI stdout stream，不是 JSONL 檔案。Stream 輸出使用 `parent_tool_use_id` 標記 subagent 巢狀，Client 已正確處理。`isSidechain` 和 `parentUuid` 是 JSONL 格式的欄位，不出現在 stream 輸出中。

**結論：** 不適用。我們的 `parent_tool_use_id` 機制已提供等效功能。

### 4. sessionDiffs（檔案變更記錄）

**協議行為：** Extension 呼叫 `getSessionDiffs()` 計算 session 中的檔案變更。

**我們的狀態：** Server 記錄 `file_updated` 事件（含 oldContent/newContent），儲存在 per-tab `modifiedFiles` 中。但 `get_session_request` 沒有回傳 sessionDiffs。

**可改進：** 如果需要，可以從 `file_updated` 事件匯總產生 sessionDiffs。目前 Client 已透過 `modifiedFiles` 追蹤檔案變更。

### 5. Fork JSONL 操作（UUID 重映射、檔案快照複製）

**協議行為：** Extension 複製 JSONL、替換 UUID、截斷到 leafMessageId、複製 file-history snapshots。

**我們的狀態：** 完全委託 CLI 處理。透過 `--resume parentSessionId` + `resumeSessionAt` 控制請求，CLI 自行管理 session 分叉。

**結論：** 不需要額外實作。CLI 原生支援。

---

## 相關檔案

- `packages/server/src/socket/chat-handler.ts` — `getSessionHistory()`, handlers
- `packages/client/src/hooks/use-chat.ts` — `buildMessagesFromHistory()`
- `packages/client/src/components/WorkspaceLayout.tsx` — `resumeSession()`
- `docs/protocol/08i-session-teleportation.md` — Teleport 協議
- `docs/protocol/08p-session-forking.md` — Fork 協議
- `docs/protocol/08x-session-management.md` — Session 管理協議
