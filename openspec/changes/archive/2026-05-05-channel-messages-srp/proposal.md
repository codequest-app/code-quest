## Why

`ChannelMessagesContext` 的 Provider 本體 290 行、7 個 useEffect，多個函式混合職責：

- `buildMessagesActions`：feature 註冊（registry.register × 8）與 actions 物件組裝混在一起
- `joinSession`：transport（socket emit）+ response parse/validate + error dispatch 全在一函式
- `session:history` handler：dedup guard（replayIdRef）+ 批次過濾 + 全量 state reduce 混合
- Title 截取邏輯夾在 Provider effects 中，與訊息渲染無關

## What Changes

- `buildMessagesActions` 拆成：`registerFeatures(registry, deps)` + actions 組裝
- `joinSession` 的 parse/validate 抽為 pure function，joinSession 只做 orchestration
- `session:history` handler 的 dedup 抽成 `shouldApplyBatch(ref, replayId)`，reduce 抽成 `applyHistoryBatch(state, events, handlers)`
- Title 邏輯移出 Provider，考慮 `useTitleFromFirstMessage` hook 或上層負責

## Impact

- `packages/client/src/contexts/channel/ChannelMessagesContext.tsx`
- `packages/client/src/contexts/channel/handlers/message.ts`（`applyUserContent` 拆職責）
- `packages/client/src/contexts/__tests__/ChannelContext.test.tsx`（expect 不變）
