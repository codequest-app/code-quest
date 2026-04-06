## Context

目前 channelId 由 client `crypto.randomUUID()` 生成，session:launch 帶給 server。Server 接受 client 提供的 ID 或自己生成（`parsed.channelId ?? crypto.randomUUID()`）。

## Goals / Non-Goals

**Goals:**
- Server 是 channelId 的 source of truth
- ChannelProvider 根據 channelId 有無決定 launch/join
- TabContext 不碰 socket lifecycle
- syncFromServer 回傳 cwd

**Non-Goals:**
- 不改 session:join 的行為
- 不改 server Channel class

## Decisions

### 1. ChannelProvider lifecycle

```
channelId=undefined → launch mode:
  mount → emit session:launch { cwd }
  callback → { channelId } from server
  set internal channelId → start receiving events
  notify parent (onChannelReady callback)

channelId="xxx" → join mode:
  mount → emit session:join { channelId }
  callback → state + events
```

### 2. TabContext temp ID

createNewTab 用 `__pending_${uuid}` 作為 temp key，ChannelProvider launch 成功後呼叫 `replaceTabId(tempId, realId)` 替換。React key 從 temp 變 real 會 unmount/remount，但 remount 時 channelId 已有值 → 走 join path → 正確。

### 3. app:init 加 cwd

Server `handleInit` 回傳 sessions 時加 `cwd: ch.cwd`。Client `syncFromServer` 存到 TabMeta.cwd。

### 4. session:launch schema

`sessionLaunchPayloadSchema.channelId` 已是 optional（`z.string().optional()`），不需改。

## Risks / Trade-offs

- Launch 多一次 round trip（等 server 回傳 channelId）→ UX 可能感覺慢
- Temp → real ID 替換觸發 unmount/remount → 但 remount 走 join，事件不會 miss（server 有 replay）
