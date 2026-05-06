## Architecture

### useElapsedTime hook

```ts
// packages/client/src/hooks/useElapsedTime.ts
function useElapsedTime(startTime: number | null): string | null
```

- `startTime` 為 null 時回傳 null（不顯示）
- 每 100ms 用 `setInterval` 更新 state
- 格式：`(elapsed / 1000).toFixed(2) + 's'` → `"3.24s"`
- component unmount 時 clearInterval

### SpinnerVerb

```
[✢] Thinking...  3.24s
```

- 新增 `startTime?: number` prop
- `useElapsedTime(startTime)` 的結果以 DOM ref 直接寫入，不觸發 React re-render（與現有 icon/verb 動畫一致）
- elapsed span 放在 verb span 右側，`text-text-muted/50` 顏色區隔

### ThinkingBlock

進行中：`Thinking... 3.24s`
完成後：`Thought for 3.24s`

- `isStreaming=true` + `startTime` → live elapsed via `useElapsedTime`
- `isStreaming=false` + `durationMs` → 靜態 `(durationMs / 1000).toFixed(2) + 's'`
- `thinkingLabel` 函式調整：streaming 時加上 elapsed 參數

### ResultContent → AssistantMessageFooter

**現在**：result message 用 `CenterDivider` 獨立渲染在對話中間

**改後**：stats 顯示在最後一則 assistant message 的 footer 區塊

```
┌──────────────────────────────────┐
│  assistant message content       │
│                                  │
│  ─────────────────────────────   │
│  $14.3695  14.12s  ↑4  ↓345     │
└──────────────────────────────────┘
```

實作方式：
- `MessageList` 在渲染 messages 時，若某則 message 的下一則是 `type === 'result'`，將 `result.meta` 作為 `resultStats` prop 傳給 `ChatMessage`
- `AssistantMessage` 接受 `resultStats?: ResultMeta` prop，渲染時在內容下方加 footer
- `result` message 本身在 `renderBody` 中回傳 null（不再獨立顯示）
- `CenterDivider` 保留給其他用途（`compact_boundary` 等）

### 時間格式統一

| 情境 | 格式 |
|------|------|
| SpinnerVerb live | `3.24s` |
| ThinkingBlock streaming | `Thinking... 3.24s` |
| ThinkingBlock 完成 | `Thought for 3.24s` |
| AssistantMessage footer | `14.12s` |

`toFixed(2)` 統一用於所有地方。

## 測試策略

- `useElapsedTime`：unit test，mock `setInterval`，驗證格式與 null 處理
- `SpinnerVerb`：現有測試不變，新增 elapsed 顯示測試
- `ThinkingBlock`：現有測試不變，新增 streaming elapsed / 完成後格式測試
- `AssistantMessage` / `MessageList`：新增 result stats 附著 assistant message 的整合測試
- TDD 順序：hook → ThinkingBlock → SpinnerVerb → MessageList/AssistantMessage
