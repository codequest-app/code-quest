---
name: msw-fetch-mock
description: >
  MSW v2 patterns for API mocking in Vitest tests.
  Use when setting up API mocks, writing HTTP handlers, simulating network errors,
  or configuring msw/node for component and integration tests.
---

# MSW v2 for Vitest

## Setup

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'John' }])),
]

// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)

// vitest.setup.ts
import { server } from './src/mocks/server'
beforeAll(() => server.listen())       // sync — no await needed
afterEach(() => server.resetHandlers()) // clears per-test overrides
afterAll(() => server.close())
```

## Handler Patterns

```typescript
import { http, HttpResponse } from 'msw'

// GET with JSON
http.get('/api/users', () => HttpResponse.json([{ id: 1 }]))

// POST — read body via standard Request API
http.post('/api/users', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({ id: 2, ...body }, { status: 201 })
})

// Path params
http.get('/api/users/:id', ({ params }) => HttpResponse.json({ id: params.id }))

// Cookies
http.get('/api/me', ({ cookies }) => HttpResponse.json({ token: cookies.session }))
```

Other: `HttpResponse.text()`, `.html()`, `.xml()`, `.formData()`, `.arrayBuffer()`.

## Per-Test Override

```typescript
it('shows error on 500', async () => {
  server.use(
    http.get('/api/user', () => HttpResponse.json({ error: 'fail' }, { status: 500 }))
  )
  // render and assert...
})
// afterEach → server.resetHandlers() clears this override automatically
```

## Network Error

```typescript
http.get('/api/data', () => HttpResponse.error())  // simulates DNS/connection failure
```

## v1 → v2 Migration Summary

| v1 | v2 |
|---|---|
| `rest.get(url, (req, res, ctx) => res(ctx.json(x)))` | `http.get(url, () => HttpResponse.json(x))` |
| Import `rest` from `msw` | Import `http, HttpResponse` from `msw` |
| `req.body` auto-parsed | `await request.json()` (standard Request API) |
| `(req, res, ctx)` triple-arg | Single `{ request, params, cookies }` object |

## Gotchas

- **No auto-parsing**: must call `await request.json()` explicitly
- **Use `HttpResponse`** over native `Response` for MSW features (cookie mocking)
- `server.resetHandlers()` only clears runtime overrides; initial handlers persist
- **Don't assert on intercepted requests** — assert on UI/application behavior
