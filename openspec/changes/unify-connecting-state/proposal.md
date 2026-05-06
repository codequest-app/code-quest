# Unify Connecting State

## Problem

New session (`launchOnMount=true`) 和 resume (`launchOnMount=false`) 各有獨立的 connecting 機制：

- **New session**: `ChannelProvider.state.status` = `connecting` → `session:launch` ACK → `connected`。`connecting` 時 early return SpinnerVerb，children 不渲染（整個 provider tree 都不 mount）。
- **Resume**: `ChannelProvider` 直接 `connected`，由 `ChannelMessagesContext.isConnecting` 控制 UI（MessageList 顯示 SpinnerVerb、ChatView 隱藏 input area）。

兩套機制導致 UI 行為不一致（resume 時 input area 可能外露），且消費端需要讀兩個不同的 state。

## Solution

統一為 `ChannelProvider.state.status` 一條路：

```
launchOnMount=true  → connecting → session:launch ACK → connected
launchOnMount=false → connecting → session:join ACK   → connected
```

### 核心改動：永遠 render provider tree，只替換 children

ChannelProvider **不再 early return**。永遠 render 完整 provider tree（Meta/Router/Messages/Control/Config/Visibility/Compose），`connecting` 時把 `children` 替換為 SpinnerVerb：

```
ChannelProvider
  ├── ChannelMetaProvider           ← 永遠 mount
  ├── ChannelSocketRouterProvider   ← 永遠 mount
  ├── ChannelMessagesProvider       ← 永遠 mount（收 history / events）
  ├── ChannelControlProvider        ← 永遠 mount
  ├── ChannelConfigProvider         ← 永遠 mount（收 slashCommands）
  ├── MessageVisibilityProvider     ← 永遠 mount
  ├── ChannelComposeProvider        ← 永遠 mount
  └── {content}                     ← connecting → SpinnerVerb / connected → children
```

這解決了之前的核心死結：
- Provider tree 永遠 mount → socket listeners 永遠注冊
- renderWithChannel 的 render → init 順序不需要改
- slashCommands 等 events 在 init 時有 listener 可以接收

### ChannelProvider 的 join

`launchOnMount=false` 時，ChannelProvider 在 useEffect 裡發 `session:join`，join ACK → `connected`。
`launchOnMount=true` 時，維持現有 `session:launch` → ACK → `connected`。

ChannelMessagesProvider 的 join 邏輯移除（joinSession/onJoinSuccess/recordJoinError/join useEffect）。

## Impact

- `ChannelMessagesContext.isConnecting` 僅保留供 scroll behavior 使用
- MessageList / ChatView 不再自行判斷 connecting UI
- ChannelProvider 統一控制 SpinnerVerb 顯示
- renderWithChannel 不需要調整 init 順序
