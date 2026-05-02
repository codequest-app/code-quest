## Context

目前 test infra 結構：
- `summoner/test/` — `FakeProcessProvider`、`FakeProcessHandle`、`createFakeSocket`、`segments`
- `server/test/` — `FakeClaude`（new container + new provider + new socket + register handlers）、`createTestContainer`
- `client/test/` — `FakeClaude extends ServerFakeClaude`（加 `act()` wrapper）

summoner production code 結構：
- `summoner/claude/` — Claude adapter + transforms
- `summoner/filesystem/` — `FilesystemService` interface + `LocalFilesystemService`
- `summoner/runner.ts` — ProcessRunner

Test infra 應該對齊 production 的 domain 結構。

## Goals / Non-Goals

**Goals:**
- FakeSummoner 作為 summoner 層的 test double，提供 `.filesystem` 和 `.claude()` factory
- FakeFilesystemService 為 in-memory 實作，不碰真實 disk
- `summoner.claude()` 回傳完整的 FakeClaude（socket + CLI control），socket 不外露
- multi-window test 透過多次呼叫 `summoner.claude()` 實現
- FilesystemService 在 server 端可注入（讓 test 替換）
- 現有測試不需修改（向後相容）

**Non-Goals:**
- 不實作 `summoner.gemini()`（future）
- 不改變任何 socket event API
- 不重寫現有測試（只確保相容）

## Decisions

### D1: FakeSummoner 結構

```typescript
class FakeSummoner {
  readonly filesystem = new FakeFilesystemService();

  private readonly container: Container;
  private readonly socketServer: SocketServer;
  private readonly fakeIO: FakeIO;

  constructor() {
    // 建立 container，注入 FakeFilesystemService
    this.container = createTestContainer({
      filesystemService: this.filesystem,
    });
    this.socketServer = this.container.get(TYPES.SocketServer);
    this.fakeIO = createFakeIO();
    this.socketServer.register(this.fakeIO);
  }

  /** 建立一個 Claude client（browser window） */
  claude(): FakeClaude {
    const socket = createFakeSocket();
    this.fakeIO.connect(socket.serverSocket);
    return new FakeClaude(socket, this.container);
  }
}
```

**Server + container 由 FakeSummoner 擁有。** FakeClaude 只拿 socket 和 container reference。

### D2: FakeFilesystemService

```typescript
class FakeFilesystemService implements FilesystemService {
  private roots: string[] = [];
  private dirs = new Map<string, string[]>();  // parent path → child names
  private files = new Map<string, string>();   // file path → content

  // ── Setup API ──
  setRoots(roots: string[]): void
  addDirectory(parent: string, children: string[]): void
  addFile(path: string, content: string): void
  reset(): void

  // ── FilesystemService interface ──
  browseDirectories(path?: string): DirectoryEntry[]
  listFiles(cwd: string, pattern: string): FileResult[]
  readFile(cwd: string, filePath: string): ReadFileResult
}
```

`browseDirectories`：無 path → 回傳 roots；有 path → 查 `dirs` map 回傳 children。
`listFiles`：查 `dirs` + `files` 做 pattern match（簡化版，不需要 glob/fuse）。
`readFile`：查 `files` map。

### D3: FakeClaude 重構

```typescript
// 改前
class FakeClaude {
  readonly provider: FakeProcessProvider;
  readonly socket: ReturnType<typeof io>;
  readonly container: Container;

  constructor() {
    this.provider = new FakeProcessProvider();
    this.socket = io();
    this.container = createTestContainer({ processProvider: this.provider });
    // ... register ...
  }
}

// 改後
class FakeClaude {
  private readonly provider: FakeProcessProvider;  // private
  private readonly socket: ReturnType<typeof io>;  // private

  constructor(socket, container) {
    this.socket = socket;
    this.provider = container.get(TYPES.ProcessProvider);  // 或從 spawn hook 取
    // 不再自己 register — FakeSummoner 已經做了
  }

  // 公開 API 不變
  async initialize(): Promise<string>
  async emit(segment: string): Promise<void>
  async send<T>(event, payload): Promise<T>
  received(): Record<string, unknown>[]
}
```

### D4: 向後相容 — createFakeClaude() 無參數

```typescript
export function createFakeClaude(): FakeClaude {
  const summoner = createFakeSummoner();
  return summoner.claude();
}
```

現有所有測試呼叫 `createFakeClaude()` 行為不變。

### D5: Server 端 FilesystemService 注入

```typescript
// types.ts
export const TYPES = {
  ...existing,
  FilesystemService: Symbol.for('FilesystemService'),
};

// container.ts — production binding
container.bind(TYPES.FilesystemService)
  .toDynamicValue(() => new LocalFilesystemService(config.explorerRoots));

// server.ts — 從 container 取
register() {
  const fs = this.container.get<FilesystemService>(TYPES.FilesystemService);
  file.create(em, fs);
  explorer.create(em, fs);
}

// create-test-container.ts — test override
if (overrides.filesystemService) {
  container.rebind(TYPES.FilesystemService)
    .toConstantValue(overrides.filesystemService);
}
```

### D6: FakeIO 管理多個 socket 連線

現在 FakeClaude 自己建 fakeIO 傳給 `socketServer.register()`。改為 FakeSummoner 持有一個 FakeIO，支援多次 connect：

```typescript
class FakeIO {
  private connectionHandler: ((socket) => void) | null = null;
  
  // socketServer.register(fakeIO) 呼叫這個
  on(event: string, cb) {
    if (event === 'connection') this.connectionHandler = cb;
  }

  // 每個新 client connect 時呼叫
  connect(serverSocket) {
    this.connectionHandler?.(serverSocket);
  }

  // broadcast
  emit(event, ...args) { ... }
}
```

## Risks / Trade-offs

### [Risk] FakeProcessProvider 的 ownership

現在 `FakeProcessProvider` 是 per-FakeClaude 的。改為 FakeSummoner 持有後，多個 FakeClaude 共享同一個 provider。`provider.latest` 回傳最後一個 spawn 的 handle — multi-window 時可能指向不同 window 的 handle。
→ **Mitigation:** FakeClaude 記住自己 spawn 的 handle index，提供 `this.handle` 存取自己的 handle 而非 `provider.latest`。

### [Trade-off] FakeFilesystemService 的 listFiles 簡化

Production 的 `listFiles` 用 glob + fuse.js 做 fuzzy search。Fake 版本只做精確 match 或簡單 prefix match。
→ **Accepted:** Test 不需要測 fuzzy search 演算法（那是 fuse.js 的事）。Test 只需要驗證 handler pipeline 正確傳遞 pattern 和回傳結果。
