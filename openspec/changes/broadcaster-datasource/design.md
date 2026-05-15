## Context

現有架構：`DirtyBroadcaster` 注入一個共用的 `WatchService`，用 matcher 把 fs events 分流成三個 dirty signal（fs / git / openspec）。前端收到 signal 後自己 re-fetch，造成兩段式 round-trip。Remote mode 下 server 的 `LocalWatchService` watch 的是 server 本機路徑，但實際檔案在 summoner 那台機器，dirty broadcast 完全失效。

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
- 快取統一由 CachedDataSource 裝飾層處理
- DataSource + Broadcaster 在 summoner，watch / read 永遠在檔案所在的機器
- Local / remote mode 差異只在 server 如何拿到 Broadcaster reference（in-process vs RPC subscription）
- RemoteWatchService 不需要實作

**Non-Goals:**
- 改變 WatchService 介面
- 改變 git / openspec 的讀取實作（read() 內部邏輯不變）
- 處理斷線補發（reconnectable-rpc 層已處理重連，重連後 Broadcaster 會自動 push 一次最新值）

## Decisions

### Package 位置：packages/broadcaster

DataSource + Broadcaster 抽成獨立 package `@code-quest/broadcaster`，summoner 和 server 都 import：

```
packages/broadcaster/
  src/
    types.ts          ← DataSource<T> interface, Unsubscribe
    cached.ts         ← CachedDataSource<T>
    broadcaster.ts    ← Broadcaster<T>
    datasources/
      files.ts        ← FilesDataSource
      git.ts          ← GitDataSource
      openspec.ts     ← OpenspecDataSource
    index.ts
```

### 介面設計

```ts
interface DataSource<T> {
  read(): Promise<T>
  onChange(cb: () => void): Unsubscribe
}
```

`onChange` 只發 signal，不帶值。Broadcaster 收到 signal 後自己呼叫 `read()`。

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

兩層過濾各有職責，不重疊：

| 層 | 排除什麼 | 理由 |
|---|---|---|
| `LocalWatchService` IGNORES | `node_modules`, `.git/objects`, `.git/logs`, `dist`, `build`, `.log`… | 永遠是噪音，任何 DataSource 都不關心 |
| DataSource matcher | 依各自的 domain 過濾 | `.git/HEAD` 讓 WatchService 通過，由 DataSource 自己決定要不要理會 |

`LocalWatchService` 的 IGNORES 不需要修改，現有粒度已正確。

```ts
class FilesDataSource implements DataSource<FileResult[]> {
  constructor(cwd: string, watchService: WatchService, ...) {
    watchService.subscribe(cwd, (ev) => {
      if (matchesFs(ev.path)) this.notifyChange()
    })
  }
}
```

### Broadcaster 在 summoner，server 是純消費者

summoner 建立並持有三個 Broadcaster 實例（local / remote 都跑這段）：

```ts
const watchService = new LocalWatchService(logger)
const filesBroadcaster = new Broadcaster((cwd) =>
  new CachedDataSource(new FilesDataSource(cwd, watchService, filesystemService))
)
const gitBroadcaster = new Broadcaster((cwd) => new GitDataSource(cwd, watchService, gitService))
const openspecBroadcaster = new Broadcaster((cwd) => new OpenspecDataSource(cwd, watchService, openspecService))
```

**Local mode**：server process embed summoner，直接持有 Broadcaster in-process reference：

```
frontend socket.watch(cwd)
  → server 呼叫 filesBroadcaster.subscribe(cwd, socketId, cb)
  → cb(files) → socket.emit(EVENTS.fs.dirty, { cwd, snapshot: files })
```

**Remote mode**：summoner 是獨立 process，WebSocket 連到 server。  
server 告訴 summoner 要 watch 哪個 cwd（request），summoner 有更新時 push snapshot 給 server：

```
frontend socket.watch(cwd)
  → server 記錄「socketId 關注 cwd」
  → server → summoner: request watch.start({ cwd })

summoner Broadcaster 有更新 (files/git/openspec)
  → summoner → server: push watch.snapshot({ cwd, type, data })
  → server 查訂閱 cwd 的所有 socket
  → socket.emit(EVENTS.fs.dirty, { cwd, snapshot: data })

frontend socket.unwatch(cwd) / disconnect
  → server 移除訂閱
  → 若該 cwd 無任何訂閱者 → server → summoner: request watch.stop({ cwd })
```

重連後 server 重新發 `watch.start`，summoner Broadcaster 立即 push `lastValue`。

### Git DataSource 的 onChange 邏輯

git status 的變化透過 `.git/` 目錄內的特定檔案反映：

```
.git/HEAD        ← 切換 branch
.git/index       ← stage / unstage
.git/packed-refs ← fetch / push 後 refs 打包
.git/refs/*      ← commit、push、tag
```

GitDataSource 只在這些路徑變動時才 notifyChange，排除 `.git/objects` 和 `.git/logs`（變動頻繁但 UI 不關心）：

```ts
const GIT_META_RE = /^\.git\/(HEAD|index|packed-refs|refs\/.*)$/

class GitDataSource implements DataSource<GitStatus> {
  constructor(cwd: string, watchService: WatchService, gitService: GitService) {
    watchService.subscribe(cwd, (ev) => {
      if (GIT_META_RE.test(ev.path)) this.notifyChange()
    })
  }
}
```

### 移除的東西

- `RemoteWatchService`（`packages/watch/src/remote.ts` 骨架）→ 不需要實作，刪除
- `DirtyBroadcaster` → 以 `Broadcaster<T>` 取代
- `dirty-matchers.ts` → matcher 邏輯移入各 DataSource constructor
- `dirty-subscriber.ts` → server 改為透過 Broadcaster 訂閱（local 直接呼叫，remote 透過 watch.start RPC）

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

## Risks / Trade-offs

- **FilesDataSource 快取失效時機**：onChange 只要 matchesFs 就失效快取，即使不影響 listFiles 結果的變更也會觸發重新 glob。可接受，CachedDataSource 的失效是 lazy
- **Remote mode 新增 watch.start / watch.stop / watch.snapshot 協議**：summoner 需要新增這三個 RPC handler，是新的協議。斷線補發由 reconnectable-rpc 層處理，重連後 server 重新發 watch.start
- **Local mode in-process 呼叫**：server 直接持有 Broadcaster instance（透過 summoner embed），耦合度比現在略高，但這是刻意設計（local mode 就是同一個 process）
- **首次 subscribe 的 read() 延遲**：第一個 subscriber 連線時若 glob 很慢會有感知延遲。屬於優化，不在本 change 範圍
