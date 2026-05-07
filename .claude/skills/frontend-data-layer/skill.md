---
name: frontend-data-layer
description: >
  Frontend data layer patterns with ky, React Query, Zod, and React Hook Form.
  Use when implementing API calls, building service layers, working with queries or mutations,
  adding form validation, or configuring error boundaries and toast notifications.
---

# Frontend Data Layer — ky + React Query + Zod + React Hook Form

## Architecture

```
Component (useQuery/useMutation + react-hook-form)
  ↓
Query Options Layer (api/*.queries.ts — queryKey + queryFn)
  ↓
Service Layer (services/*.ts — fetch fn + zod.parse response)
  ↓
HTTP Client (api-client.ts — ky.create singleton)
```

---

## 1. ky API Client (`api-client.ts`)

```ts
import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10_000,
  retry: { limit: 2, statusCodes: [408, 429, 500, 502, 503, 504] },
  hooks: {
    beforeRequest: [/* inject auth headers */],
    afterResponse: [/* handle 401 refresh */],
    beforeError: [/* parse error body into error.message */],
  },
});

// Specialized sub-client
export const uploadClient = apiClient.extend({ timeout: 60_000, retry: { limit: 0 } });
```

### ky hooks signatures

| Hook | Signature | Purpose |
|------|-----------|---------|
| `beforeRequest` | `(request, options) => Request \| void` | Inject headers |
| `beforeRetry` | `({ request, options, error, retryCount }) => void` | Refresh token |
| `afterResponse` | `(request, options, response) => Response \| void` | Handle 401 |
| `beforeError` | `(error: HTTPError) => HTTPError` | Parse error body |

---

## 2. Service Layer (schema-driven)

Each service function: assemble request + `zod.parse(response)` → return typed data.

```ts
// services/terminal.ts
export async function fetchTerminals() {
  const data = await apiClient.get('api/terminals').json();
  return terminalListResponseSchema.parse(data);  // ZodError → React Query error state
}
```

- Schemas in `@code-quest/shared` (shared) or service file (client-only)
- No manual try/catch — let React Query handle errors

---

## 3. React Query — `queryOptions` Pattern

### Query Options Factory (`*.queries.ts`)

```ts
// api/terminal.queries.ts
import { queryOptions } from '@tanstack/react-query';
import * as terminalService from '../services/terminal.ts';

export const terminalKeys = {
  all: ['terminals'] as const,
  lists: () => [...terminalKeys.all, 'list'] as const,
  detail: (id: string) => [...terminalKeys.all, 'detail', id] as const,
};

export const terminalQueries = {
  lists: () => queryOptions({
    queryKey: terminalKeys.lists(),
    queryFn: terminalService.fetchTerminals,
  }),
  detail: (id: string) => queryOptions({
    queryKey: terminalKeys.detail(id),
    queryFn: () => terminalService.fetchTerminal(id),
    enabled: !!id,
  }),
};
```

### Usage in components

```tsx
// Direct — no custom hook needed
const { data } = useQuery(terminalQueries.lists());
```

### When to use custom hook vs direct `useQuery(queryOptions())`

| Scenario | Recommendation |
|----------|---------------|
| Simple query | Direct `useQuery(xxxQueries.yyy())` |
| Query + derived state | Custom hook |
| Query + multiple mutations | Custom hook |
| Prefetch / ensureQueryData | `queryClient.ensureQueryData(xxxQueries.yyy())` |

### Mutation pattern

```tsx
const { mutate } = useMutation({
  mutationFn: createTerminal,
  meta: { successMessage: 'Terminal created' },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: terminalKeys.lists() }),
});
```

Extract to hook only when the same mutation is used in multiple components.

### QueryClient — global error handling

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      throwOnError: (error) =>
        error instanceof HTTPError && error.response.status >= 500,  // 5xx → Error Boundary
    },
    mutations: { retry: 0 },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) toast.error(`Refresh failed: ${error.message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(error.message),
    onSuccess: (_d, _v, _c, mutation) => {
      if (typeof mutation.meta?.successMessage === 'string') toast.success(mutation.meta.successMessage);
    },
  }),
});
```

---

## 4. React Hook Form + Zod Resolver

```tsx
const schema = z.object({ shell: z.string().optional(), cols: z.number().int().min(1).optional() });
type FormValues = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { cols: 80 },
});
```

For dynamic arrays use `useFieldArray({ control, name: 'tasks' })`.

---

## 5. Error Handling — Three Layers

| Layer | Scope | Mechanism |
|-------|-------|-----------|
| Local | Component | `if (error) return <ErrorMsg />` |
| Toast | Global, background | `QueryCache.onError` / `MutationCache.onError` |
| Error Boundary | 5xx / unexpected | `throwOnError` + `QueryErrorResetBoundary` |

---

## 6. Socket.io Pre-emit Validation

Socket.io emit shares the same zod schemas but doesn't go through ky/react-query:

```ts
const result = safeValidate(chatSendSchema, { sessionId, message });
if (!result.success) return;
emit('chat:send', sessionId, message);
```

---

## 7. Directory Structure & Naming

```
apps/web/src/
├── api/
│   ├── api-client.ts          # ky.create() singleton
│   ├── query-client.ts        # QueryClient + global error handlers
│   └── terminal.queries.ts    # queryKeys + queryOptions
├── services/
│   └── terminal.ts            # fetch fns + zod parse
├── hooks/                     # Only when combining query + mutation logic
└── utils/
    └── validateAndEmit.ts     # Socket pre-emit validation
```

| File pattern | Content |
|---|---|
| `api/<feature>.queries.ts` | `<feature>Keys` + `<feature>Queries` (queryOptions) |
| `services/<feature>.ts` | Pure API functions + zod parse |
| `hooks/use<Feature>.ts` | Only when combining logic for multiple components |

### Adding a new feature

1. `services/<feature>.ts` — fetch fns + zod parse
2. `api/<feature>.queries.ts` — queryKeys + queryOptions
3. Component — `useQuery(<feature>Queries.xxx())`
4. Mutations — inline `useMutation()`, or extract hook if shared
