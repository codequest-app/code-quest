## Why

`MessageList.tsx` 中 `getItemKey`（virtualizer 量測快取 key）與 `VirtualGroupItem` 的 React `key` prop 對 timeline group 使用不同公式：

- `getItemKey`：`group.nodes.map(n => n.message.id).join(',')` — 所有 nodes 的 ID joined
- React `key`：`group.nodes[0]?.message.id` — 只用第一個 node 的 ID

Streaming delta 過程中，timeline group 持續加入新 node（tool use block、assistant content）。加入時：

- React key 不變（第一個 node ID 穩定）→ 不 remount ✓
- `getItemKey` 改變（joined 字串加了新 ID）→ virtualizer 丟棄舊量測，回用估算值（80px）
- `totalSize` 暫時縮水 → SpinnerVerb 出現在內容中間而非底部

## What Changes

`getItemKey` 改為與 React key 相同公式（timeline: 第一個 node 的 ID），保持量測快取在 group 成長時不失效。

## Impact

- `apps/web/src/components/chat/conversation/MessageList.tsx`
- `apps/web/src/components/chat/conversation/__tests__/MessageList.test.tsx`（新增測試）
