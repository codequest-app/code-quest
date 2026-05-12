## Context

`Expandable` 已完成改名重構。現在需要加入 `defaultOpen` 行為，讓 live 訊息預設展開、history 舊訊息預設收合。

經過調查確認：`block.id` 在整個 streaming 生命週期內不變（`stream:block_start` 時 `randomUUID()` 一次，後續 delta 只 update content），因此 React 不會 remount `Expandable`，`useState(open)` 的使用者操作狀態**自然保留**，不需要額外的鎖定機制。

## Goals / Non-Goals

**Goals:**
- `Expandable` 支援 `defaultOpen` prop
- Live（最後一則 / isLastTurn）→ 預設展開
- History 舊訊息 → 預設收合
- Streaming 中使用者手動展開/收合後，不因新 delta 而 reset

**Non-Goals:**
- 不改 `Expandable` 的 overflow 偵測邏輯
- 不對 tool_use / thinking block 做相同處理（各有自己的 CollapsibleBlock defaultOpen 機制）

## Decisions

### defaultOpen 由 isLastTurn 控制

`isLastTurn` 已由 `MessageList` 計算並傳入 `NodeContent`（找最後一個 `assistant_turn` 的 id），這個 prop 再傳到 `Expandable`。

```
MessageList → isLastTurn → NodeContent
  type==='text'       → <Expandable defaultOpen={isLastTurn ?? false}>
  type==='assistant_turn' → AssistantTurnContent isLastTurn
                            → text block → <Expandable defaultOpen={isLastTurn ?? false}>
```

### StreamlinedTextContent 也接收 defaultOpen

`StreamlinedTextContent`（fast mode）從 `NodeContent` 呼叫，需要同樣加入 `defaultOpen` prop。

### 手動操作鎖定不需要額外處理

`useState` 的 open 狀態在 remount 時才會重置。由於 `block.id` 穩定，React 只做 update 不做 remount，手動操作的狀態天然保留。

## Risks / Trade-offs

- `defaultOpen` 只在 mount 時生效（React `useState` 的 initialState 語意）。若同一個 block remount（例如 key 改變），open 狀態會重置。目前 `block.id` 穩定，此風險不存在。

## Migration Plan

1. `Expandable` 加 `defaultOpen` prop，傳入 `useState(defaultOpen)`
2. `NodeContent` text type 加 `defaultOpen={isLastTurn ?? false}`
3. `AssistantTurnContent` text block 加 `defaultOpen={isLastTurn ?? false}`，`isLastTurn` 已有
4. `StreamlinedTextContent` 加 `defaultOpen` prop 並傳給 `Expandable`，`NodeContent` 呼叫時傳入
5. 跑 tests
