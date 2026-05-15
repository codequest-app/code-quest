## Context

現有架構：`DirtyBroadcaster` 注入一個共用的 `WatchService`，用 matcher 把 fs events 分流成三個 dirty signal（fs / git / openspec）。前端收到 signal 後自己 re-fetch，造成兩段式 round-trip。快取移除後 `listFiles` 每次都重新 glob，大型 repo 代價高。Remote mode 下 server 的 `LocalWatchService` watch 的是 server 本機路徑，但實際檔案在 summoner 那台機器，dirty broadcast 完全失效。

**現有流程：**
```
chokidar (summoner)
  → WatchService
  → DirtyBroadcaster (matcher 分流)
  → EVENTS.*.dirty signal (空的)
  → 前端 re-fetch
```

## Goals / Non-Goals

**Goals:**
- Broadcaster push 完整值給前端，前端不再需要 re-fetch
- 快取統一由 CachedDataSource 裝飾層處理，各 DataSource 自己決定要不要用
- Local / remote mode 差異只在注入的 WatchService，DataSource 和 Broadcaster 完全不知道
- 同一個 cwd 的三個 DataSource 共用同一個 WatchService instance（底層只開一個 watcher）

**Non-Goals:**
- 改變 WatchService 介面（LocalWatchService / RemoteWatchService 的實作不在本 change 範圍）
- 處理斷線補發（reconnectable-rpc 層已處理重連，重連後 Broadcaster 會自動 push 一次最新值）
- 改變 git / openspec 的讀取實作（read() 內部邏輯不變）

## Decisions

### 介面設計

```ts
interface DataSource<T> {
  read(): Promise<T>
  onChange(cb: () => void): Unsubscribe
}
```

`onChange` 只發 signal，不帶值。Broadcaster 收到 signal 後自己呼叫 `read()`，統一由 Broadcaster 決定什麼時候讀。

### Broadcaster 管理多個 cwd，各自對應一個 DataSource

一個 Broadcaster 實例管理多個 cwd，每個 cwd 懶建立自己的 DataSource：

```ts
class Broadcaster<T> {
  private entries = new Map<string, {
    source: DataSource<T>
    lastValue: T | null
    subs: Map<string, (v: T) => void>
  }>()

  subscribe(cwd: string, subscriberId: string, cb: (value: T) => void): Unsubscribe {
    let entry = this.entries.get(cwd)
    if (!entry) {
      const source = this.createSource(cwd)
      entry = { source, lastValue: null, subs: new Map() }
      this.entries.set(cwd, entry)
      source.onChange(async () => {
        const v = await source.read()
        entry!.lastValue = v
        for (const sub of entry!.subs.values()) sub(v)
      })
    }
    entry.subs.set(subscriberId, cb)

    // 新 subscriber：有快取直接用，否則 read()
    if (entry.lastValue !== null) {
      cb(entry.lastValue)
    } else {
      void entry.source.read().then(v => {
        entry!.lastValue = v
        cb(v)
      })
    }

    return () => {
      entry!.subs.delete(subscriberId)
      if (entry!.subs.size === 0) {
        this.entries.delete(cwd)
      }
    }
  }
}
```

### 兩層快取各自的職責

| 層 | 快取什麼 | 解決什麼問題 |
|---|---|---|
| `Broadcaster.lastValue` | 最後 push 的值（per cwd） | 新 subscriber 連線立即有值，不觸發 read() |
| `CachedDataSource` | glob / git 結果（per cwd） | 同 cwd 短時間多次 onChange 只做一次 read() |

- `FilesDataSource` → 包一層 `CachedDataSource`（glob 慢，多個 onChange 可能連發）
- `GitDataSource` → 直接用（git status < 100ms，不需要）
- `OpenspecDataSource` → 直接用（list 很快，不需要）

### DataSource 各自 subscribe WatchService，各自過濾

同一個 cwd 的三個 DataSource 各自 subscribe WatchService，底層 `LocalWatchService` 對同一個 cwd 只開一個 chokidar watcher，fan-out 給多個 subscriber：

```
watchService.subscribe(cwd, cb_files)    ← FilesDataSource
watchService.subscribe(cwd, cb_git)      ← GitDataSource
watchService.subscribe(cwd, cb_openspec) ← OpenspecDataSource

LocalWatchService 內部：
  entries: Map<cwd, { watcher: FSWatcher, subs: Set<cb> }>
  → 同一個 cwd 的三個 cb 都加進同一個 subs set
  → chokidar 只開一個 watcher
```

每個 DataSource 在自己的 subscribe callback 裡做 matcher 過濾：

```ts
class FilesDataSource implements DataSource<FileResult[]> {
  constructor(private cwd: string, private watchService: WatchService) {
    watchService.subscribe(cwd, (ev) => {
      if (matchesFs(ev.path)) this.notifyChange()
    })
  }
}
```

### Local / Remote 差異只在注入的 WatchService

```ts
// local mode
const watchService = new LocalWatchService()

// remote mode
const watchService = new RemoteWatchService(remoteRpc)
// RemoteWatchService 在 @code-quest/watch package，內部對同 cwd 只發一次 RPC subscribe
// 底層靠 summoner 的 LocalWatchService (chokidar) push 事件回來

// 兩者注入方式相同，DataSource / Broadcaster 完全不知道
const filesBroadcaster = new Broadcaster((cwd) =>
  new CachedDataSource(new FilesDataSource(cwd, watchService))
)
const gitBroadcaster = new Broadcaster((cwd) => new GitDataSource(cwd, watchService))
const openspecBroadcaster = new Broadcaster((cwd) => new OpenspecDataSource(cwd, watchService))
```

`RemoteWatchService` 內部 refcounting：同一個 cwd 的多個 DataSource subscribe 只發一次 `watch.subscribe` RPC 給 summoner；最後一個 unsubscribe 才發 `watch.unsubscribe`。

### Socket event 漸進式更新

不立即 rename event，在現有 payload 上加 optional snapshot：

```ts
// 現在
EVENTS.fs.dirty  → { cwd, paths: string[] }
EVENTS.git.dirty → { cwd }

// 新增（保持相容）
EVENTS.fs.dirty  → { cwd, paths: string[], snapshot?: FileResult[] }
EVENTS.git.dirty → { cwd, snapshot?: GitStatus }
```

前端確認切換完畢後再 rename 成 `snapshot`。

### 移除的東西

- `DirtyBroadcaster` → 以 `Broadcaster<T>` 取代
- `dirty-matchers.ts` 的 `matchesFs` / `matchesGit` / `matchesOpenspec` → 移入各 DataSource constructor
- `dirty-subscriber.ts` 的 `subscribeDirtyForSocket` → Broadcaster 直接 subscribe

## Risks / Trade-offs

- **FilesDataSource 快取失效時機**：onChange 只要 matchesFs 就失效快取，即使是不影響 listFiles 結果的變更（例如 binary 檔案）也會觸發重新 glob。可接受，因為 CachedDataSource 的失效是 lazy（等下次 read() 才重算，不是立刻重算）
- **多個 cwd 的 Broadcaster lifecycle**：Broadcaster 需要知道什麼時候 release DataSource 的 onChange subscription，這個 lifecycle 要跟 socket disconnect / channel 切換綁定，跟現在 `subsBySocket` 的管理方式類似
- **首次 subscribe 的 read() 延遲**：第一個 subscriber 連線時會 await read()，若 glob 很慢會有感知延遲。可以讓 Broadcaster 在建立時就預先 warm 快取（eager load），但這屬於優化，不在本 change 範圍
