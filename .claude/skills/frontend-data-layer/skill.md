---
name: frontend-data-layer
description: |
  Best practices for ky + @tanstack/react-query + zod + react-hook-form integration.
  Covers API client setup, service layer, queryOptions pattern, form validation,
  error handling (Error Boundary + toast), and pre-emit socket validation.

  AUTO-INVOKE when:
  - Implementing HTTP API calls or REST endpoints on the client
  - Creating or modifying service layer / API client
  - Working with react-query queries or mutations
  - Building forms with react-hook-form + zod validation
  - Setting up error boundaries or toast notifications
  - Configuring ky hooks (beforeRequest, afterResponse, beforeError)
  - Discussing client-side data fetching architecture

  Keywords: ky, react-query, tanstack-query, zod, react-hook-form, API client, service, fetch, mutation, query, queryOptions, error boundary, toast, form validation, hookform resolver
---

# Frontend Data Layer — ky + React Query + Zod + React Hook Form

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Component Layer                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ React Hook   │  │ useQuery()   │  │ Error         │  │
│  │ Form + Zod   │  │ + queryOpts  │  │ Boundary      │  │
│  │ Resolver     │  │              │  │ + Toast       │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
├─────────┼─────────────────┼──────────────────────────────┤
│  Query Options Layer       │                              │
│  ┌─────────────────────────┴───────────────────────────┐ │
│  │ api/*.queries.ts                                    │ │
│  │ - queryKey factory + queryFn 合併定義                │ │
│  │ - 透過 queryOptions() 提供 type-safe config          │ │
│  └──────────────────────────┬──────────────────────────┘ │
├─────────────────────────────┼────────────────────────────┤
│  Service Layer              │                             │
│  ┌──────────────────────────┴──────────────────────────┐ │
│  │ services/*.ts                                       │ │
│  │ - fetch fn 組裝 request + zod.parse(response)       │ │
│  │ - 回傳已驗證的 typed data                            │ │
│  └──────────────────────────┬──────────────────────────┘ │
├─────────────────────────────┼────────────────────────────┤
│  HTTP Client (ky)           │                             │
│  ┌──────────────────────────┴──────────────────────────┐ │
│  │ api-client.ts (ky.create)                           │ │
│  │ - prefixUrl, timeout, retry                         │ │
│  │ - hooks.beforeRequest → inject auth headers         │ │
│  │ - hooks.afterResponse → handle 401 refresh          │ │
│  │ - hooks.beforeError → parse error body              │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 1. ky API Client (`api-client.ts`)

### 建立 singleton instance

```ts
import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10_000,
  retry: { limit: 2, statusCodes: [408, 429, 500, 502, 503, 504] },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        // 401 → 嘗試 refresh token 並重送
        if (response.status === 401) {
          const refreshed = await tryRefreshToken();
          if (refreshed) {
            return ky(request, options);
          }
        }
      },
    ],
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          try {
            const body = await response.json();
            error.message = body.message ?? error.message;
          } catch {
            // response body 非 JSON，保留原始 message
          }
        }
        return error;
      },
    ],
  },
});
```

### ky.extend() — 建立特化子 client

```ts
// 需要不同 timeout 的上傳 client
export const uploadClient = apiClient.extend({
  timeout: 60_000,
  retry: { limit: 0 },
});
```

### ky hooks 完整簽名

| Hook | Signature | 用途 |
|------|-----------|------|
| `beforeRequest` | `(request: Request, options: Options) => Request \| void` | 注入 headers、修改 body |
| `beforeRetry` | `({ request, options, error, retryCount }) => void` | refresh token 後重試 |
| `afterResponse` | `(request, options, response: Response) => Response \| void` | 處理 401、log response |
| `beforeError` | `(error: HTTPError) => HTTPError` | 從 response body 解析錯誤訊息 |

### HTTPError 處理

```ts
import ky, { HTTPError } from 'ky';

try {
  await apiClient.get('endpoint').json();
} catch (error) {
  if (error instanceof HTTPError) {
    const body = await error.response.json();
    console.error(error.response.status, body.message);
  }
}
```

---

## 2. Service Layer（schema-driven）

**原則**：每個 service function 負責「組裝 request + zod.parse(response)」，回傳已驗證的 typed data。

```ts
// services/terminal.ts
import type { TerminalListResponse } from '@code-quest/shared';
import {
  createTerminalResponseSchema,
  terminalInfoResponseSchema,
  terminalListResponseSchema,
} from '@code-quest/shared';
import { apiClient } from '../api/api-client.ts';

export async function fetchTerminals(): Promise<TerminalListResponse> {
  const data = await apiClient.get('api/terminals').json();
  return terminalListResponseSchema.parse(data);
}

export async function fetchTerminal(id: string) {
  const data = await apiClient.get(`api/terminals/${id}`).json();
  return terminalInfoResponseSchema.parse(data);
}

export async function createTerminal(options?: Record<string, unknown>) {
  const data = await apiClient.post('api/terminals', { json: options }).json();
  return createTerminalResponseSchema.parse(data);
}

export async function deleteTerminal(id: string): Promise<void> {
  await apiClient.delete(`api/terminals/${id}`);
}
```

**重點**：
- schema 定義在 `@code-quest/shared`（前後端共用）或 service 內（client-only）
- `zod.parse()` 失敗會 throw ZodError → React Query 自動進入 error state
- 不需要手動 `try/catch`，交給 React Query 處理

---

## 3. React Query — `queryOptions` Pattern（推薦）

### 為什麼用 `queryOptions`？

TkDodo（React Query maintainer）推薦的最佳實踐：
- **Type-safe**：queryKey + queryFn 在同一處定義，TypeScript 自動推導回傳型別
- **消除 boilerplate**：不再需要為每個 query 寫 custom hook wrapper
- **可組合**：`queryOptions()` 回傳的 object 可直接用於 `useQuery()`、`useSuspenseQuery()`、`queryClient.prefetchQuery()`、`queryClient.ensureQueryData()`
- **Colocation**：query key 和 query function 在同一檔案，不會失同步

### Query Options Factory（`*.queries.ts`）

```ts
// api/terminal.queries.ts
import { queryOptions } from '@tanstack/react-query';
import * as terminalService from '../services/terminal.ts';

// Query key factory — 仍然有用，mutation invalidation 需要
export const terminalKeys = {
  all: ['terminals'] as const,
  lists: () => [...terminalKeys.all, 'list'] as const,
  detail: (id: string) => [...terminalKeys.all, 'detail', id] as const,
};

// Query options — 合併 key + fn，type-safe
export const terminalQueries = {
  lists: () =>
    queryOptions({
      queryKey: terminalKeys.lists(),
      queryFn: terminalService.fetchTerminals,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: terminalKeys.detail(id),
      queryFn: () => terminalService.fetchTerminal(id),
      enabled: !!id,
    }),
};
```

### 在 Component 中使用

```tsx
import { useQuery } from '@tanstack/react-query';
import { terminalQueries } from '../api/terminal.queries.ts';

// ✅ 直接使用 queryOptions — 不需要 custom hook
function TerminalList() {
  const { data, isLoading, error } = useQuery(terminalQueries.lists());
  // ...
}

function TerminalDetail({ id }: { id: string }) {
  const { data } = useQuery(terminalQueries.detail(id));
  // ...
}
```

### 何時用 custom hook vs 直接 `useQuery(queryOptions())`

| 情境 | 建議 |
|------|------|
| 單純 query（無額外邏輯） | 直接 `useQuery(xxxQueries.yyy())` |
| Query + 衍生狀態計算 | Custom hook 包裝 |
| Query + 多個 mutation 組合 | Custom hook 包裝 |
| Prefetch / ensureQueryData | 直接用 `queryClient.ensureQueryData(xxxQueries.yyy())` |
| SSR loader | 直接用 `queryClient.prefetchQuery(xxxQueries.yyy())` |

### QueryClient 設定（含全域 error handling）

```ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner'; // 或 react-hot-toast

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      throwOnError: (error) => {
        // 5xx → throw 到 Error Boundary
        if (error instanceof HTTPError) {
          return error.response.status >= 500;
        }
        return false;
      },
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 只在 background refetch 失敗時 toast（保留 stale UI）
      if (query.state.data !== undefined) {
        toast.error(`Background refresh failed: ${error.message}`);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const msg = mutation.meta?.successMessage;
      if (typeof msg === 'string') {
        toast.success(msg);
      }
    },
  }),
});
```

### Mutation Pattern

Mutation 沒有 `mutationOptions` API，直接在 component 內或 custom hook 中使用 `useMutation`：

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { terminalKeys } from '../api/terminal.queries.ts';
import { createTerminal, deleteTerminal } from '../services/terminal.ts';

// 在 component 內直接使用
function CreateTerminalButton() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createTerminal,
    meta: { successMessage: 'Terminal created' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
    },
  });
  // ...
}

// 或抽成 hook（當多處使用同一 mutation 時）
export function useDeleteTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTerminal,
    meta: { successMessage: 'Terminal deleted' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
    },
  });
}
```

---

## 4. React Hook Form + Zod Resolver

### 安裝

```bash
pnpm add react-hook-form @hookform/resolvers
```

### Form 範例

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createTerminalSchema = z.object({
  shell: z.string().optional(),
  cwd: z.string().optional(),
  cols: z.number().int().min(1).optional(),
  rows: z.number().int().min(1).optional(),
});

type CreateTerminalForm = z.infer<typeof createTerminalSchema>;

export function TerminalCreateForm() {
  const { mutate, isPending } = useCreateTerminal();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTerminalForm>({
    resolver: zodResolver(createTerminalSchema),
    defaultValues: { cols: 80, rows: 24 },
  });

  const onSubmit = (data: CreateTerminalForm) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('shell')} placeholder="Shell" />
      {errors.shell && <span className="error">{errors.shell.message}</span>}

      <input {...register('cwd')} placeholder="Working directory" />

      <input {...register('cols', { valueAsNumber: true })} type="number" />
      {errors.cols && <span className="error">{errors.cols.message}</span>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### Dynamic Field Array（DispatchForm 場景）

```tsx
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subTaskSchema } from '@code-quest/shared';

const dispatchFormSchema = z.object({
  tasks: z.array(subTaskSchema).min(1, 'At least one task is required'),
});

type DispatchFormValues = z.infer<typeof dispatchFormSchema>;

export function DispatchForm({ onDispatch }: Props) {
  const { control, register, handleSubmit, formState: { errors } } = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchFormSchema),
    defaultValues: { tasks: [{ description: '', provider: 'claude' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'tasks' });

  return (
    <form onSubmit={handleSubmit((data) => onDispatch(data.tasks))}>
      {fields.map((field, index) => (
        <div key={field.id} className="task-row">
          <input {...register(`tasks.${index}.description`)} />
          {errors.tasks?.[index]?.description && (
            <span className="error">{errors.tasks[index].description.message}</span>
          )}

          <select {...register(`tasks.${index}.provider`)}>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>

          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ description: '', provider: 'claude' })}>
        + Add Task
      </button>
      {errors.tasks?.root && <span className="error">{errors.tasks.root.message}</span>}
      <button type="submit">Dispatch</button>
    </form>
  );
}
```

---

## 5. Error Handling — 三層策略

### Layer 1: Local（component 內）

```tsx
function TerminalList() {
  const { data, error, isLoading } = useQuery(terminalQueries.lists());

  if (isLoading) return <Spinner />;
  if (error) return <div className="error">Failed to load: {error.message}</div>;

  return <ul>{data.sessions.map(...)}</ul>;
}
```

### Layer 2: Toast（global, background refetch failures）

透過 `QueryCache.onError` + `MutationCache.onError` 自動觸發（見上方 QueryClient 設定）。

### Layer 3: Error Boundary（5xx / unexpected）

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>Something went wrong: {error.message}</p>
              <button onClick={resetErrorBoundary}>Retry</button>
            </div>
          )}
        >
          <AppContent />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

### throwOnError 策略

```ts
// 5xx → Error Boundary, 4xx → local handling
throwOnError: (error) => {
  if (error instanceof HTTPError) {
    return error.response.status >= 500;
  }
  return false;
},
```

---

## 6. Socket.io Pre-emit Validation（既有模式）

Socket.io emit 不走 ky/react-query，但共用相同的 zod schema：

```ts
import { safeValidate } from '../utils/validateAndEmit.ts';
import { chatSendSchema } from '@code-quest/shared';

const sendMessage = useCallback((sessionId: string, message: string) => {
  const result = safeValidate(chatSendSchema, { sessionId, message });
  if (!result.success) {
    console.warn('[chat:send] validation failed', result.error);
    return;
  }
  emit('chat:send', sessionId, message);
}, [emit]);
```

---

## 7. 目錄結構建議

```
packages/client/src/
├── api/
│   ├── api-client.ts          # ky.create() singleton
│   ├── query-client.ts        # QueryClient + global error handlers
│   └── terminal.queries.ts    # queryKeys + queryOptions (feature-scoped)
├── services/
│   └── terminal.ts            # fetch fns + zod parse
├── hooks/
│   ├── useChatSocket.ts       # Socket.io (不走 ky)
│   └── useOrchestratorSocket.ts
├── components/
│   └── ...
└── utils/
    └── validateAndEmit.ts     # Socket pre-emit validation
```

### 命名慣例

| 檔案 | 內容 |
|------|------|
| `api/<feature>.queries.ts` | `<feature>Keys` + `<feature>Queries`（queryOptions） |
| `services/<feature>.ts` | 純 API 函式 + zod parse |
| `hooks/use<Feature>.ts` | 僅在需要組合邏輯時才建立 custom hook |

### 新增 feature 的步驟

1. **建立 service**：`services/<feature>.ts`（fetch fns + zod parse）
2. **建立 queries**：`api/<feature>.queries.ts`（queryKeys + queryOptions）
3. **在 component 直接用**：`useQuery(<feature>Queries.xxx())`
4. **如需 mutation**：直接在 component 內 `useMutation()`，或抽成 hook（多處共用時）

---

## 參考資料

- [ky GitHub](https://github.com/sindresorhus/ky) — hooks API, HTTPError, retry
- [TkDodo: The Query Options API](https://tkdodo.eu/blog/the-query-options-api) — queryOptions pattern
- [TkDodo: Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query) — zod + query pattern
- [TkDodo: React Query Error Handling](https://tkdodo.eu/blog/react-query-error-handling) — 三層 error 策略
- [Josh Karamuth: Bulletproof Frontend with Zod + React Query](https://joshkaramuth.com/blog/tanstack-zod-dto/) — schema-driven service
- [React Hook Form Resolvers](https://github.com/react-hook-form/resolvers) — @hookform/resolvers/zod
