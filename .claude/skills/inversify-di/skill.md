---
name: inversify-di
description: >
  Inversify dependency injection patterns for the server.
  Use when creating or modifying DI container bindings, adding injectable services,
  writing tests with dependency overrides, or managing TYPES symbols.
---

# Inversify DI

## TYPES Registry

**File:** `apps/server/src/types.ts`

```typescript
export const TYPES = {
  RunnerFactory: Symbol.for('RunnerFactory'),
  SessionStore: Symbol.for('SessionStore'),
  RawEventStore: Symbol.for('RawEventStore'),
  ChatHandler: Symbol.for('ChatHandler'),
  Database: Symbol.for('Database'),
  UsageTracker: Symbol.for('UsageTracker'),
  SettingsStore: Symbol.for('SettingsStore'),
  ChannelManager: Symbol.for('ChannelManager'),
} as const;
```

## Container Setup

**File:** `apps/server/src/container.ts` — `createContainer(options)`

All bindings are inline (no ContainerModule pattern):

| Symbol | Binding | Scope |
|--------|---------|-------|
| RunnerFactory | `.toConstantValue(factory)` | — |
| Database | `.toConstantValue(db)` | — |
| SessionStore | `.toConstantValue(store)` | — |
| RawEventStore | `.toConstantValue(store)` | — |
| SettingsStore | `.toConstantValue(store)` | — |
| ChannelManager | `.toConstantValue(mgr)` | — |
| UsageTracker | `.to(UsageTracker).inSingletonScope()` | Singleton |
| ChatHandler | `.to(ChatHandler).inSingletonScope()` | Singleton |

Only `ChatHandler` and `UsageTracker` use `@injectable()` + `@inject()`.

## Injectable Services

```typescript
// apps/server/src/socket/chat-handler.ts
@injectable()
export class ChatHandler implements HandlerContext {
  constructor(
    @inject(TYPES.RunnerFactory) public runnerFactory: RunnerFactory,
    @inject(TYPES.RawEventStore) public rawEventStore: RawEventStore,
    @inject(TYPES.SessionStore) public sessionStore: SessionStore,
    @inject(TYPES.UsageTracker) public usageTracker: UsageTracker,
    @inject(TYPES.ChannelManager) public channelManager: ChannelManager,
    @inject(TYPES.SettingsStore) @optional() settingsStore?: SettingsStore,
  ) {}
}
```

## HandlerContext Interface

**File:** `apps/server/src/socket/handler-context.ts`

Aggregates all injected services. Socket handlers access dependencies through this interface.

## Composite Store Pattern

`buildStores()` in container.ts creates stores based on `StoreConfig`, wrapping multiple backends in `CompositeRawStore` / `CompositeSessionStore` when needed.

## Testing

**File:** `apps/server/src/test/create-test-container.ts`

```typescript
export function createTestContainer(overrides): Container {
  const container = createContainer({ ...overrides, storeConfig: { sqlite: true } });
  const db = container.get<DrizzleDatabase>(TYPES.Database);
  migrate(db, { migrationsFolder });
  container.rebindSync<SettingsStore>(TYPES.SettingsStore)
    .toConstantValue(new InMemorySettingsStore());
  return container;
}
```

Key test methods:
- `container.get<T>(TYPES.X)` — retrieve service
- `container.rebindSync<T>(TYPES.X).toConstantValue(mock)` — replace binding

## Adding a New Service

1. Add symbol to `TYPES` in `apps/server/src/types.ts`
2. If constructor-injectable: add `@injectable()` + `@inject()` decorators
3. If constant-bound: instantiate and `.bind(TYPES.X).toConstantValue(instance)`
4. Add to test container if tests need it
