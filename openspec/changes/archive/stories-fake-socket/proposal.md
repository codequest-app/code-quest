## Why

ChannelProvider 的 `initialState` prop 只被 Storybook stories 使用，用來 mock 初始狀態。這讓 ChannelProvider 維護一個只為 stories 存在的 prop。Stories 應該改用 fake socket（和 tests 一樣），透過真實 pipeline 設定狀態。

## What Changes

- Stories 改用 `createFakeClaude()` + fake socket 設初始狀態
- 移除 ChannelProvider 的 `initialState` prop
- 移除 ChannelConfigProvider 的 `initialConfig` prop
- 移除 `ChannelInitialState` type（如果無其他 consumer）

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
（無）

## Impact

- `apps/web/src/components/*.stories.tsx` — 所有用 initialState 的 stories
- `apps/web/src/contexts/channel/ChannelContext.tsx`
- `apps/web/src/contexts/channel/ChannelConfigContext.tsx`
- `apps/web/src/types/chat.ts`
