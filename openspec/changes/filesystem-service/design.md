## Context

目前 filesystem 操作散落在 server 的各個 handler 裡：
- `file.ts` — `globSync`、`readFileSync`、`readdirSync`（channel-scoped）
- `explorer.ts` — `readdirSync`、`lstatSync`（global，不綁 channel）
- `explorer-utils.ts` — `validateExplorerPath`

summoner package 目前只負責 CLI process 管理（ProcessRunner、ProviderAdapter）。
server 透過 Inversify DI 管理依賴（TYPES symbols + container bindings）。

## Goals / Non-Goals

**Goals:**
- 將所有 filesystem 操作集中到 summoner 層的 `FilesystemService`
- Server handler 只做 socket event 解析 + 呼叫 service + 回傳結果
- 保持所有 socket event API 和行為不變（純重構）
- 可測試：FilesystemService 可獨立測試，handler 測試可 mock service

**Non-Goals:**
- 不改變 socket event 名稱或 payload 格式
- 不做遠端 filesystem agent（那是未來的事）
- 不改動 client 端任何程式碼

## Decisions

### D1: FilesystemService 作為 plain class，不繼承 ProcessRunner

FilesystemService 不需要 spawn process，不需要 stdin/stdout，它直接用 Node.js fs API。跟 ProcessRunner 平行存在於 summoner 層，不共用基類。

```
summoner/
├── runner.ts          ← ProcessRunner（CLI process 管理）
├── filesystem.ts      ← FilesystemService（filesystem 操作）NEW
├── types.ts           ← 共用 types
└── index.ts           ← export 兩者
```

### D2: FilesystemService API

```typescript
export class FilesystemService {
  constructor(private readonly explorerRoots: readonly string[]) {}

  /** 列出子目錄（explorer:browse 用） */
  browseDirectories(path?: string): DirectoryEntry[]

  /** 列出檔案（file:list 用），支援 empty pattern / directory listing / fuzzy search */
  listFiles(cwd: string, pattern: string): FileResult[]

  /** 讀取檔案內容（file:read 用），含 path traversal 防護 */
  readFile(cwd: string, filePath: string): { content: string } | { error: string }
}
```

explorerRoots 透過 constructor 注入，不在 FilesystemService 裡讀 env。Server 建構時從 config 傳入。

### D3: DI 整合

```typescript
// server/src/types.ts
export const TYPES = {
  ...existing,
  FilesystemService: Symbol.for('FilesystemService'),
};

// container binding
container.bind(TYPES.FilesystemService)
  .toDynamicValue(() => new FilesystemService(config.explorerRoots))
  .inSingletonScope();
```

Handler 透過 constructor injection 或 register 參數取得 service：
```typescript
// explorer.ts
export function create(emitter: ChannelEmitter, fs: FilesystemService): void { ... }

// file.ts  
export function create(channelManager: ChannelManager, emitter: ChannelEmitter, fs: FilesystemService): void { ... }
```

### D4: 搬遷策略 — 先抽 interface 再搬實作

**Step 1: Server 端 — 抽 interface + 包現有 code**
1. 定義 `FilesystemService` interface（browseDirectories、listFiles、readFile）
2. 在 server 內建立 `LocalFilesystemService` 實作，把現有 handler 裡的 fs 操作搬進去
3. Handler 改成接收 `FilesystemService` 參數，呼叫 service 而非直接 fs API
4. 每一步跑測試確認行為不變

**Step 2: 搬到 summoner 層**
5. 將 `FilesystemService` interface 搬到 summoner package export
6. 將 `LocalFilesystemService` 實作搬到 summoner package
7. Server 改成 import from summoner
8. 測試全過（實作沒變，只是搬家）

**這個順序的好處：** Step 1 是純重構（行為不變），Step 2 是純搬家（行為不變），每一步都有測試保護。

### D5: listFiles 保留 terminal 列表邏輯在 handler

現有 `file.ts` 的 `listTerminals()` 呼叫 `channelManager.getAllChannelIds()` 來列出 active terminals。這跟 filesystem 無關，保留在 handler 裡。FilesystemService 只負責 filesystem 部分，handler 負責合併 filesystem results + terminal results。

## Risks / Trade-offs

### [Risk] summoner package 新增 fs 依賴
summoner 目前不直接用 `node:fs`（只透過 ProcessProvider spawn process）。新增 FilesystemService 會引入 `node:fs` 和 `glob` 依賴。
→ **Accepted:** summoner 定位是「所有本地操作」，fs 操作是合理的職責。

### [Trade-off] 額外的抽象層
多一層 service 意味著更多的間接呼叫。
→ **Accepted:** 換來的是職責清晰和可測試性。且 service 方法就是直接的 function call，沒有序列化開銷。
