## Why

ChannelMessagesContext 999 行，混合了 messages/streaming、notifications、system events、file tracking、plan comments、global state、15+ actions。
拆成多個小 context，每個職責明確、可獨立維護。

## What Changes

從 ChannelMessagesContext 拆出：
- `ChannelNotificationContext` — toast、auth_url、open_url、open_file、notification:show
- `ChannelSystemContext` — compact_boundary、hook、task、rate_limit、api_retry、experiment_gates、error:message
- `ChannelFilesContext` — file:updated、modifiedFiles、plan comments、raw:event

ChannelMessagesContext 只保留 messages + streaming + status + actions。

## Capabilities

### New Capabilities
- `channel-notification-context`: 通知相關 socket events 獨立 context
- `channel-system-context`: 系統事件獨立 context
- `channel-files-context`: 檔案追蹤 + plan comments 獨立 context

### Modified Capabilities

## Impact

- `apps/web/src/contexts/channel/ChannelMessagesContext.tsx` — 拆出 events + state
- `apps/web/src/contexts/channel/ChannelNotificationContext.tsx` — 新增
- `apps/web/src/contexts/channel/ChannelSystemContext.tsx` — 新增
- `apps/web/src/contexts/channel/ChannelFilesContext.tsx` — 新增
- `apps/web/src/contexts/channel/ChannelContext.tsx` — 加入新 Provider
- `apps/web/src/contexts/channel/index.ts` — export 新 context
- 消費端 component 可能需要改用新 context 的 hook
- 所有 72 個 test files / 615 tests 維持通過
