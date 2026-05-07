## Why

channelId 代表 server-side 資源（CLI process + session），應由 server 生成。目前 client 生成 UUID 再告訴 server「用這個 ID」是反過來的。這導致 `session:launch` 和 `session:join` 的區分靠 cwd 有沒有值（巧合而非語義），且 TabContext 混合了 tab UI state 和 session lifecycle 兩個職責。

## What Changes

- `ChannelProvider` 接受 `channelId?: string`：有值 = join，沒值 = launch
- Launch 時不傳 channelId → server 生成 → callback 回傳
- `TabContext.createNewTab` 只管 tab state，用 temp ID
- ChannelProvider launch callback 後通知 TabContext 更新 temp → real ID
- `app:init` response 加 cwd 欄位
- `sessionLaunchPayloadSchema.channelId` 改為 optional

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
（無 spec-level 行為變更）

## Impact

- `apps/web/src/contexts/channel/ChannelContext.tsx` — channelId optional
- `apps/web/src/contexts/channel/ChannelMessagesContext.tsx` — launch/join 邏輯
- `apps/web/src/contexts/TabContext.tsx` — temp ID + replace
- `apps/web/src/components/WorkspaceLayout.tsx` — 傳遞 props
- `apps/server/src/socket/handlers/app.ts` — app:init 回傳 cwd
- `packages/shared/src/schemas/session.ts` — channelId optional in launch schema
