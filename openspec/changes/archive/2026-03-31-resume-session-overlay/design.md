## Context

目前 SessionHistory 在 WorkspaceLayout 作為 sidebar 呈現，選 session 走 `session:join`。Extension 的做法是在 chat 區域內顯示 overlay，選了走 `session:launch` + `resume`，CLI replay 歷史。

## Goals / Non-Goals

**Goals:**
- `/resume` 在 ChatPanel 內顯示 session list overlay（對齊 extension UX）
- Session list 按 cwd 過濾、帶搜尋框
- 選 session 後走 `session:launch { resume: sessionId }` 讓 CLI replay
- 簡化 SessionRow 為 title + 相對日期，hover 顯示 rename/delete

**Non-Goals:**
- Remote sessions / teleport（保留但不在此 change 處理）
- Session export/import
- 多 tab 架構變更

## Decisions

### 1. Overlay 放在 ChatPanel 內，不是 sidebar
Extension 的 session list 是全畫面 overlay，不是 sidebar。放在 ChatPanel 內，由 ChannelProvider 提供 cwd context。

### 2. Resume 走 `session:launch` + `resume` 而非 `session:join`
Extension 的 resume 是 spawn 新 CLI process with `--resume <sessionId>`，CLI 會 replay 歷史事件到 stdout。`session:join` 是 join 一個還活著的 channel，語義不同。

選了 session 後：
1. Client emit `session:launch { channelId: newId, resume: selectedSessionId }`
2. Server spawn CLI with `--resume`
3. CLI replay 歷史事件 → client 從 stream 重建對話
4. Overlay 關閉

### 3. Server 端 `session:list` 加 cwd 過濾
`session:list` payload 新增 optional `cwd` 參數，server 端 query 加 WHERE cwd = ? 條件。Client 從 ChannelConfigContext 取得當前 cwd。

### 4. 相對日期格式
使用簡短格式：`1m`, `5m`, `1h`, `3h`, `1d`, `7d`, `30d` — 對齊 extension 的 `7d`, `8d` 等格式。

### 5. 搜尋為 client-side filter
Session list 已全量載入（分頁 50 筆），搜尋直接在 client 端 filter title，不需 server 端搜尋。

## Risks / Trade-offs

- [移除 sidebar] → WorkspaceLayout 簡化，但失去同時看對話和歷史的能力。Extension 也是這樣，可接受。
- [cwd 過濾] → 如果 cwd 不同但想看所有 session，需要另外處理。暫時不管，先對齊 extension。
