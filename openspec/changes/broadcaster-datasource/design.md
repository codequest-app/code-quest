## Context

已完成的部分（維持不動）：
- `packages/broadcaster/` package 已建立，`DataSource<T>`、`CachedDataSource<T>` 已實作
- `FilesDataSource`、`GitDataSource`、`OpenspecDataSource` 已實作
- Server local / remote 的訂閱流程已通
- 前端 dirty event + snapshot 已串接

本次重構的目標是把三個獨立 `Broadcaster<T>` 合併為一個多型別 `Broadcaster`，解決 remote mode 的 `watch.start` 覆蓋問題。

## Goals / Non-Goals

**Goals:**
- 一個 `Broadcaster` 持有多種 DataSource（files + git + openspec）
- 一次 `subscribe(cwd, subscriberId, cb)` 訂閱全部 type，底層 WatchService 只開一個 watcher per cwd
- remote mode `watch.start` 1:1 對應一個 subscribe，不再有 ref count 問題
- local mode server 只持有一個 `Broadcaster` binding

**Non-Goals:**
- 改變 `DataSource<T>` 介面
- 改變 `CachedDataSource<T>` 實作
- 改變各 DataSource 的過濾邏輯
- 改變前端 dirty event 的 payload 結構

## Decisions

### 新的 Broadcaster API

```ts
type SnapshotCallback = (type: string, data: unknown) => void;

class Broadcaster {
  add(type: string, createSource: (cwd: string) => DataSource<unknown>): this
  subscribe(cwd: string, subscriberId: string, cb: SnapshotCallback): Unsubscribe
}
```

內部結構：

```ts
// per cwd
interface CwdEntry {
  sources: Map<string, { source: DataSource<unknown>; lastValue: unknown | null }>;
  subs: Map<string, SnapshotCallback>;
  unwatches: (() => void)[];
}
```

`add()` 登記一個 type 和它的 createSource factory，在 subscribe 時才懶建立 DataSource。

### subscribe 行為

```
subscribe(cwd, subscriberId, cb)
  → 若 cwd 尚未建立 entry：
      → 對每個已登記的 type，建立 DataSource
      → 每個 DataSource.onChange → read() → 通知所有 subs 的 cb(type, data)
  → 將 cb 加入 subs
  → 對每個 type，若有 lastValue 則立即呼叫 cb(type, lastValue)
    否則發起 read() 並在完成後呼叫 cb(type, data)
  → 回傳 unsubscribe function
    → subs.delete(subscriberId)
    → 若 subs.size === 0：dispose 所有 DataSource，刪除 entry
```

### 建立方式（summoner）

```ts
const broadcaster = new Broadcaster()
  .add('files', (cwd) => new CachedDataSource(new FilesDataSource(cwd, '', watchService, fs)))
  .add('git', (cwd) => new GitDataSource(cwd, watchService, git))
  .add('openspec', (cwd) => new OpenspecDataSource(cwd, watchService, openspec));
```

一個 `WatchService` instance，三個 DataSource 各自 subscribe 同一個 watcher，底層只開一個 chokidar watcher per cwd。

### Agent 簡化

```ts
// 之前
constructor(processProvider, filesystem, git, watchService?, openspec?)

// 之後
constructor(processProvider, filesystem, git, broadcaster: Broadcaster)
```

`registerWatchHandlers` 接收一個 `Broadcaster`，`watch.start` 直接呼叫 `broadcaster.subscribe()`。

### RemoteBroadcaster 更新

```ts
class RemoteBroadcaster {
  subscribe(cwd: string, subscriberId: string, cb: SnapshotCallback): Unsubscribe {
    // 第一個 subscriber → rpc.request(watch.start, { cwd })
    // snapshot 到來 → cb(type, data)
    // 最後一個 unsubscribe → rpc.request(watch.stop, { cwd })
  }
}
```

介面和 `Broadcaster` 完全對齊（duck typing），server 不需要區分 local / remote。

### Server container

```ts
// 之前：三個分開的 binding
TYPES.FilesBroadcaster
TYPES.GitBroadcaster
TYPES.OpenspecBroadcaster

// 之後：一個
TYPES.Broadcaster
```

Local mode 綁 `Broadcaster` 實例，remote mode 綁 `RemoteBroadcaster` 實例。

### watch.start / watch.stop 協議不變

remote mode 的 RPC 協議本身不改（仍是 `watch.start { cwd }` / `watch.stop { cwd }` / `watch.snapshot { cwd, type, data }`），只是現在 Agent 的 `watch.start` handler 對應一個 `broadcaster.subscribe()`，不會有覆蓋問題。
