---
name: inversify-di
description: |
  Inversify 7 dependency injection patterns, conventions, and best practices for Code Quest server.
  Covers container setup, binding patterns, factory resolution, testing, and ContainerModule organization.

  AUTO-INVOKE when:
  - Creating or modifying DI container bindings
  - Adding new injectable services or factories
  - Writing tests that need dependency overrides (rebindSync)
  - Discussing server-side architecture or dependency graph
  - Adding new TYPES symbols or binding tokens
  - Refactoring container.ts or introducing ContainerModules

  Keywords: inversify, DI, dependency injection, container, inject, injectable, bind, rebind, factory, toDynamicValue, ContainerModule, TYPES, Symbol
---

# Inversify 7 — DI Conventions & Best Practices

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Composition Root (container.ts)                     │
│  ┌──────────────┐  ┌────────────────────────────┐   │
│  │ Config        │  │ Factories                  │   │
│  │ toConstant    │  │ toDynamicValue (lazy deps) │   │
│  └──────────────┘  └────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Singletons (.to(Impl).inSingletonScope())    │   │
│  │ TerminalManager, ChatManager, SocketHandler   │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Entry Point (main.ts / server.ts)                   │
│  container.get<Server>(TYPES.Server).start()         │
└─────────────────────────────────────────────────────┘
```

---

## 1. Binding Tokens（`types.symbols.ts`）

**所有 token 集中定義於 `packages/server/src/types.symbols.ts`**，使用 `Symbol.for()` 確保跨模組唯一：

```typescript
export const TYPES = {
  // Singleton services
  TerminalManager: Symbol.for('TerminalManager'),
  ChatManager: Symbol.for('ChatManager'),
  SocketHandler: Symbol.for('SocketHandler'),

  // Factories
  ChatSessionFactory: Symbol.for('ChatSessionFactory'),
  TerminalSessionFactory: Symbol.for('TerminalSessionFactory'),
  OrchestratorSessionFactory: Symbol.for('OrchestratorSessionFactory'),
  ParserFactory: Symbol.for('ParserFactory'),
  ProcessFactory: Symbol.for('ProcessFactory'),

  // Config
  ChatCommandsConfig: Symbol.for('ChatCommandsConfig'),
  ServerConfig: Symbol.for('ServerConfig'),

  // Server
  Server: Symbol.for('Server'),
} as const;
```

### 新增 token 規則

1. Token name = interface name（一對一映射）
2. 按 category 分組：Singletons → Factories → Config → Server
3. 永遠用 `Symbol.for('...')`（不用 `Symbol()`，避免序列化問題）
4. 加上 `as const` 確保 type narrowing

---

## 2. 三種 Binding 模式

### 2a. Constant Value — Config 與簡單工廠

適用於**不需要 context 的靜態值或純函式**：

```typescript
// Config object
container.bind<ServerConfig>(TYPES.ServerConfig).toConstantValue({ port: 3000 });

// Simple factory（不依賴其他 binding）
container
  .bind<TerminalSessionFactory>(TYPES.TerminalSessionFactory)
  .toConstantValue((options) => new TerminalSessionImpl(options));

// Node.js built-in
container.bind<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(spawn);
```

### 2b. Dynamic Value — 有依賴的 Factory

**關鍵模式：lazy resolution**——在 returned function 內部呼叫 `context.get()`，
而非在外層 callback。這確保 `rebindSync` 在測試中立即生效：

```typescript
container.bind<ChatSessionFactory>(TYPES.ChatSessionFactory).toDynamicValue((context) => {
  // ⚠️ 不要在這裡 get()！這是建立 binding 時執行的
  return (options: ChatSessionOptions) => {
    // ✅ 在這裡 get()——每次呼叫 factory 時才 resolve
    const parserFactory = context.get<ParserFactory>(TYPES.ParserFactory);
    const processFactory = context.get<ProcessFactory>(TYPES.ProcessFactory);
    return new ChatSessionImpl({ ...options, processFactory, parserFactory });
  };
});
```

**為什麼 lazy？** 假設測試中 `rebindSync(TYPES.ProcessFactory).toConstantValue(mockFactory)`，
如果 factory 是 eager 的，它拿到的仍是舊的 `spawn`。lazy 則每次呼叫都重新取。

### 2c. Class Binding — Singleton 服務

搭配 `@injectable()` + `@inject()` 裝飾器：

```typescript
// 實作類
@injectable()
export class ChatManagerImpl implements ChatManager {
  constructor(
    @inject(TYPES.ChatSessionFactory)
    private readonly createSession_: ChatSessionFactory,
    @inject(TYPES.ChatCommandsConfig)
    private readonly commands: ChatCommandsConfig,
  ) {}
}

// 綁定
container.bind<ChatManager>(TYPES.ChatManager).to(ChatManagerImpl).inSingletonScope();
```

**Scope 選擇**：
| Scope | 用途 | 範例 |
|-------|------|------|
| `inSingletonScope()` | 整個 app 共用一個 instance | Manager, Handler |
| `inTransientScope()` | 每次 `get()` 新建 | Session（但我們用 factory 模式） |

---

## 3. Decorator 規則

### @injectable()

- 所有透過 `.to(Class)` 綁定的類別**必須**加 `@injectable()`
- 透過 `toConstantValue` 或 `toDynamicValue` 綁定的**不需要**

### @inject(TYPES.xxx)

- Constructor 的每個參數**必須**有 `@inject()` decorator
- 不支援 positional injection——Inversify 只透過 decorator 辨識

### 完整範例

```typescript
import { inject, injectable } from 'inversify';
import { TYPES } from '../types.symbols.ts';

@injectable()
export class SocketHandlerImpl implements SocketHandler {
  constructor(
    @inject(TYPES.TerminalManager)
    private readonly terminalManager: TerminalManager,
    @inject(TYPES.ChatManager)
    private readonly chatManager: ChatManager,
    @inject(TYPES.OrchestratorSessionFactory)
    private readonly createOrchestrator: OrchestratorSessionFactory,
  ) {}
}
```

---

## 4. 測試模式

### createTestContainer

集中管理 test overrides，避免每個測試重複設定：

```typescript
// packages/server/src/test/create-test-container.ts
export interface TestContainerOverrides {
  serverConfig?: ServerConfig;
  chatCommandsConfig?: ChatCommandsConfig;
  processFactory?: ProcessFactory;
}

export function createTestContainer(overrides?: TestContainerOverrides): Container {
  const container = createContainer();

  if (overrides?.serverConfig) {
    container.rebindSync<ServerConfig>(TYPES.ServerConfig).toConstantValue(overrides.serverConfig);
  }
  if (overrides?.processFactory) {
    container
      .rebindSync<ProcessFactory>(TYPES.ProcessFactory)
      .toConstantValue(overrides.processFactory);
  }
  if (overrides?.chatCommandsConfig) {
    container
      .rebindSync<ChatCommandsConfig>(TYPES.ChatCommandsConfig)
      .toConstantValue(overrides.chatCommandsConfig);
  }

  return container;
}
```

### 測試中使用

```typescript
// Setup
const container = createTestContainer({ processFactory: mockFactory });
const factory = container.get<ChatSessionFactory>(TYPES.ChatSessionFactory);

// Mid-test swap（lazy resolution 確保新 binding 立即生效）
container.rebindSync<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(newMock);
// 不需要重新 get factory！下次呼叫 factory() 時自動取得新的 processFactory
```

### rebindSync vs rebind

- `rebindSync()` — 同步版，測試推薦使用
- `rebind()` — async 版（返回 Promise），少用
- 使用 `rebindSync` 而非 `unbindSync` + `bindSync`（兩步容易出錯）

---

## 5. 新增 Injectable Service 步驟

1. **定義 interface**（`types.ts`）
2. **新增 token**（`types.symbols.ts`）
3. **實作 class** 加 `@injectable()` + `@inject()`
4. **在 container.ts 綁定** `.to(Impl).inSingletonScope()`
5. **更新 TestContainerOverrides**（如果測試需要 override）

### 新增 Factory 步驟

1. **定義 factory type**（`types.ts`）
2. **新增 token**（`types.symbols.ts`）
3. **在 container.ts 綁定**：
   - 無依賴 → `toConstantValue`
   - 有依賴 → `toDynamicValue` + lazy `context.get()`
4. **消費端**用 `@inject(TYPES.XxxFactory)` 注入

---

## 6. ContainerModule 組織模式（未來擴充）

當 binding 數量超過 15~20 個時，考慮拆分成 domain-scoped modules：

```typescript
// chat/chat.module.ts
import { ContainerModule } from 'inversify';

export const chatModule = new ContainerModule((bind) => {
  bind<ParserFactory>(TYPES.ParserFactory)
    .toConstantValue((provider) => createParser(provider));

  bind<ChatSessionFactory>(TYPES.ChatSessionFactory).toDynamicValue((context) => {
    return (options: ChatSessionOptions) => {
      const parserFactory = context.get<ParserFactory>(TYPES.ParserFactory);
      const processFactory = context.get<ProcessFactory>(TYPES.ProcessFactory);
      return new ChatSessionImpl({ ...options, processFactory, parserFactory });
    };
  });

  bind<ChatManager>(TYPES.ChatManager).to(ChatManagerImpl).inSingletonScope();
});

// container.ts
export function createContainer(): Container {
  const container = new Container();
  container.load(configModule, chatModule, terminalModule, orchestratorModule, serverModule);
  return container;
}
```

**優點**：
- 每個 module 只看到自己 domain 的 binding
- 可測試個別 module（`container.load(chatModule)` + mock 其餘）
- 新增 feature 不需修改 container.ts

**目前暫不需要**——12 個 binding 在單一 `container.ts` 足夠清晰。

### ContainerModule 重構路線圖

目前 12 個 binding，**觸發時機為 binding 總數超過 15 時**。屆時依以下分組拆分：

| Module | Bindings | 檔案路徑 |
|--------|----------|----------|
| `configModule` | `ServerConfig`, `ChatCommandsConfig` | `src/config/config.module.ts` |
| `terminalModule` | `TerminalSessionFactory`, `TerminalManager` | `src/terminal/terminal.module.ts` |
| `chatModule` | `ParserFactory`, `ProcessFactory`, `ChatSessionFactory`, `ChatManager` | `src/chat/chat.module.ts` |
| `orchestratorModule` | `OrchestratorSessionFactory` | `src/orchestrator/orchestrator.module.ts` |
| `serverModule` | `SocketHandler`, `Server` | `src/server.module.ts` |

### 執行計畫

當 binding 數量超過 15 時，依以下步驟執行：

1. **建立 module 檔案**：在各 domain 目錄下建立 `*.module.ts`，將對應 binding 從 `container.ts` 搬入
2. **從最獨立的 module 開始**：`configModule`（無依賴）→ `terminalModule` → `chatModule` → `orchestratorModule` → `serverModule`
3. **更新 `container.ts`**：改為 `container.load(configModule, terminalModule, chatModule, orchestratorModule, serverModule)`
4. **更新 `createTestContainer`**：確保 `rebindSync` 仍可覆蓋各 module 的 binding（ContainerModule 的 binding 在 load 後與普通 binding 行為相同，`rebindSync` 不受影響）
5. **驗證**：`pnpm --filter server exec tsc --noEmit && pnpm --filter server exec vitest run`

### 注意事項

- ContainerModule 內的 `bind` 不需要 `container` 前綴，直接呼叫 callback 參數的 `bind`
- 跨 module 依賴（如 `chatModule` 需要 `ProcessFactory`）透過 `context.get()` 解決，不需要 module 間 import
- `rebindSync` 對 ContainerModule 綁定的 token 完全有效——測試模式無需調整

---

## 7. 反模式

### ❌ Service Locator

```typescript
// BAD: 在業務邏輯內直接 resolve
function handleRequest() {
  const manager = container.get<ChatManager>(TYPES.ChatManager);
}
```

**✅ 正確**：只在 composition root（`container.ts`、`main.ts`）呼叫 `container.get()`。

### ❌ Eager Resolution in Factory

```typescript
// BAD: 外層 get()，rebindSync 不會生效
container.bind<ChatSessionFactory>(TYPES.ChatSessionFactory).toDynamicValue((context) => {
  const parserFactory = context.get<ParserFactory>(TYPES.ParserFactory); // ❌ eager
  return (options) => new ChatSessionImpl({ ...options, parserFactory });
});
```

### ❌ 直接 `new` 可注入服務

```typescript
// BAD: 繞過 DI
const manager = new ChatManagerImpl(createSession, commands);
```

**✅ 正確**：`container.get<ChatManager>(TYPES.ChatManager)`

### ❌ 在 constructor 中做複雜初始化

```typescript
// BAD: constructor 有副作用
@injectable()
class BadService {
  constructor(@inject(TYPES.Config) config: Config) {
    this.connection = connectToDatabase(config); // ❌ 副作用
  }
}
```

**✅ 正確**：提供 `init()` / `start()` 方法，constructor 只存 reference。

---

## 8. reflect-metadata 注意事項

- Inversify 7 **仍需要** `reflect-metadata`
- 必須在 **entry point 的最頂端** import：`import 'reflect-metadata';`
- 目前在 `container.ts` 的第一行 import
- tsconfig 需要 `"experimentalDecorators": true` 和 `"emitDecoratorMetadata": true`

---

## 參考資料

- [Inversify 7 Migration Guide](https://inversify.io/docs/guides/migrating-from-v6/)
- [Inversify Binding Syntax](https://inversify.io/docs/next/api/binding-syntax/)
- [Inversify Good Practices](https://doc.inversify.cloud/en/good_practices)
- [Container API](https://inversify.io/docs/6.x/api/container/)
- [ContainerModule](https://inversify.io/docs/6.x/api/container-module/)
