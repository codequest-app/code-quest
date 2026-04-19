---
name: protocol-alignment
description: >
  Compare cc-office protocol implementation against the real Claude Code VS Code Extension.
  Use when checking protocol coverage, analyzing alignment gaps, re-comparing after extension updates,
  or building a coverage matrix.
---

# Protocol Alignment — cc-office vs Claude Code Extension

This skill **only does protocol comparison**. Finding gaps is the job here.
Implementation is a separate concern — open a change with `/opsx:new` after comparison.

## Extension Reference

```
/Users/user/Desktop/anthropic.claude-code-2.1.45-darwin-arm64/
└── src/core/main.js  ← 主要參考（~70k 行，webcrack + prettier）
```

Read `references/extension-surface.md` for the extracted protocol surface.
When the extension updates, re-extract and diff against that file.

## Protocol 只在 3 個檔案

```
packages/summoner/src/protocol/
├── claude-schemas.ts      ← CLI 送什麼給我們（event type Zod schemas + type registry）
├── claude.ts              ← 我們送什麼給 CLI（LaunchOptions + buildArgs + parseLine + format methods）
└── claude-adapter.ts      ← ProtocolEvent → SocketEvent 純轉換（event type 路由 + control_request dispatch）
```

比對 extension 時**只看這 3 個檔案**。其他都是應用層，不是 protocol。

`claude-adapter.ts` 也定義 `clientConfig: ProviderClientConfig`（brand、permissionModes、authMethods、mcpScopes、usageTiers、modelDisplayMap）。
Client 透過 `get_provider_config` socket event 取得，存在 `ChannelConfigContext`。

## 怎麼比對

### 1. 提取 extension protocol surface

Read `references/extension-surface.md`。如果 extension 更新了，重新提取：

```bash
grep -n 'subtype.*"' src/core/main.js     # all subtypes
grep -n '\.type ===' src/core/main.js      # event type routing
```

搜尋這些區域（用函數名，不用行號）：
- **readMessages**: event type 路由
- **processControlRequest**: 收到的 control_request subtype
- **this.request(**: 發送的 control_request subtype
- CLI arg building: spawn 時的 argv

### 2. 對照 cc-office 3 個檔案

| 比對項目 | 查哪個檔案 | 搜尋 pattern |
|---|---|---|
| event type 有沒有 schema | `claude-schemas.ts` | `z.literal('typename')` |
| event type 有沒有轉換成 ClientEvent | `claude-adapter.ts` | `event.type === 'typename'` |
| control_request subtype（收到的） | `claude-adapter.ts` | `case 'subtypename'` in `convertControlRequest` |
| control_request subtype（發送的） | 不需查（`formatControlRequest` 是 generic 的，任何 subtype 都能發） |
| CLI spawn arg | `claude.ts` | `LaunchOptions` + `buildArgs()` |

### 3. 更新 coverage matrix

結果寫入 `references/coverage-matrix.md`。

狀態標記：
- ✅ Implemented
- ⚠️ Partial
- ❌ Missing
- ➖ N/A

## Reference Files

| 檔案 | 內容 | 什麼時候更新 |
|------|------|-------------|
| `references/extension-surface.md` | Extension 的完整 subtype/event 清單 | Extension 版本更新時 |
| `references/coverage-matrix.md` | 逐項比對狀態（✅⚠️❌） | 比對完成或實作完成後 |
| `references/real-json-samples.md` | 從 DB 提取的真實 JSON（每種 type/subtype 一個） | 發現新 event type 時，或 DB 有新資料時 |

### real-json-samples.md 的用途

- **比對時**：確認我們的 schema 是否涵蓋真實 JSON 的所有欄位
- **實作時**：對照真實 JSON 寫 Zod schema 和 adapter handler
- **測試時**：直接複製真實 JSON 作為 test fixture（比合成 JSON 更可靠）

### 怎麼更新 real-json-samples.md

從 DB 提取：
```sql
SELECT raw FROM raw_entries
WHERE json_extract(raw, '$.type') = 'system'
  AND json_extract(raw, '$.subtype') = 'NEW_SUBTYPE'
LIMIT 1;
```

實作完新功能後，如果 DB 中出現了新的 event type，把它加到 `real-json-samples.md`。

## When Refactoring

如果 protocol 檔案被重新命名或搬移，更新：
1. 上面的 3 個檔案路徑
2. `references/extension-surface.md`（如果 extension 版本更新）
3. `references/coverage-matrix.md`
4. `references/real-json-samples.md`（如果有新的真實 JSON）
