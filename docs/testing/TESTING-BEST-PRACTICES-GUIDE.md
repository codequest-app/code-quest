# 完整測試配置指南：MSW v2 + Vitest + Testing Library

本指南涵蓋現代前端測試的最佳實踐，包括 API 模擬、單元測試和整合測試的完整配置方案。

---

## 目錄

1. [MSW (Mock Service Worker) v2.x](#1-msw-mock-service-worker-v2x)
2. [Testing Library](#2-testing-library)
3. [Vitest 整合](#3-vitest-整合)
4. [完整範例專案結構](#4-完整範例專案結構)

---

## 1. MSW (Mock Service Worker) v2.x

### 1.1 核心概念

MSW 是一個 API 模擬庫，在網路層級攔截請求，可在瀏覽器和 Node.js 中運作。其獨特之處在於**創建獨立的 API 模擬層**，為網路行為提供單一真實來源。

#### 主要特性

- **環境無關**：相容所有請求客戶端（fetch、axios、RTK Query 等）
- **無縫整合**：利用 Service Worker API 和 Node.js 原生模組進行請求攔截
- **可重用性**：相同的 mock 可用於開發、測試、Storybook 等場景
- **標準化**：基於 Fetch API 標準（Request、Response、Headers）

#### 支援的 API 類型

- RESTful HTTP 請求
- GraphQL 操作（Query、Mutation）
- WebSocket 連接
- Server-Sent Events (SSE)

---

### 1.2 安裝與版本要求

```bash
# 安裝 MSW v2
npm install -D msw@latest

# 最低版本要求
# - Node.js >= 18.0.0
# - TypeScript >= 4.7 (如果使用 TypeScript)
```

---

### 1.3 Node.js 環境設定（用於 Vitest）

#### 步驟 1：定義 Request Handlers

```javascript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // REST API handlers
  http.get('https://api.example.com/user', () => {
    return HttpResponse.json({
      id: 'abc-123',
      firstName: 'John',
      lastName: 'Maverick',
    })
  }),

  http.post('https://api.example.com/login', async ({ request }) => {
    const credentials = await request.json()

    return HttpResponse.json({
      token: 'mocked-token-123',
      user: { email: credentials.email }
    })
  }),

  // 錯誤處理範例
  http.get('https://api.example.com/error', () => {
    return new HttpResponse(null, { status: 500 })
  }),

  // 延遲回應範例
  http.get('https://api.example.com/slow', async () => {
    await delay(2000) // 延遲 2 秒
    return HttpResponse.json({ data: 'slow response' })
  }),
]
```

#### 步驟 2：設定 Server

```javascript
// src/mocks/node.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

#### 步驟 3：整合至 Vitest

```javascript
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './src/mocks/node'

// 在所有測試前啟用 API 模擬
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // 對未處理的請求發出警告
  })
})

// 每個測試後重置處理器
afterEach(() => {
  server.resetHandlers()
})

// 所有測試結束後關閉 server
afterAll(() => {
  server.close()
})

// 可選：監聽所有請求以進行除錯
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url)
})
```

#### 步驟 4：配置 Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'], // 引入 setup 文件
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
})
```

---

### 1.4 Browser 環境設定

#### 步驟 1：初始化 Service Worker

```bash
# 生成 Service Worker 文件
npx msw init public/ --save
```

#### 步驟 2：設定 Browser Worker

```javascript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

#### 步驟 3：在應用中啟動

```javascript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('./mocks/browser')

  // `worker.start()` 返回一個 Promise
  return worker.start()
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
```

#### 步驟 4：Vitest Browser Mode 設定

```typescript
// test/test-extend.ts
import { test as testBase } from 'vitest'
import { setupWorker } from 'msw/browser'
import { handlers } from '../src/mocks/handlers'

const worker = setupWorker(...handlers)

export const test = testBase.extend({
  worker: async ({}, use) => {
    // 測試前啟動 worker
    await worker.start()

    // 提供 worker 給測試使用
    await use(worker)

    // 測試後重置處理器並停止 worker
    worker.resetHandlers()
    worker.stop()
  },
})

// 自動應用到所有測試
test.worker.auto = true
```

---

### 1.5 HTTP Handler 寫法

#### 基本 HTTP 方法

```javascript
import { http, HttpResponse, delay } from 'msw'

export const handlers = [
  // GET 請求
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({ id, name: 'John' })
  }),

  // POST 請求（處理 JSON body）
  http.post('/api/users', async ({ request }) => {
    const newUser = await request.json()
    return HttpResponse.json(
      { id: '123', ...newUser },
      { status: 201 }
    )
  }),

  // POST 請求（處理 FormData）
  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file')
    return HttpResponse.json({ fileName: file.name })
  }),

  // PUT 請求
  http.put('/api/users/:id', async ({ params, request }) => {
    const { id } = params
    const updates = await request.json()
    return HttpResponse.json({ id, ...updates })
  }),

  // PATCH 請求
  http.patch('/api/users/:id', async ({ params, request }) => {
    const { id } = params
    const updates = await request.json()
    return HttpResponse.json({ id, ...updates })
  }),

  // DELETE 請求
  http.delete('/api/users/:id', ({ params }) => {
    return new HttpResponse(null, { status: 204 })
  }),

  // 處理所有方法
  http.all('/api/wildcard', () => {
    return HttpResponse.json({ message: 'Handles all methods' })
  }),
]
```

#### 進階用法

```javascript
// 處理 Query Parameters
http.get('/api/search', ({ request }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  return HttpResponse.json({
    results: [`Result for "${query}"`]
  })
})

// 處理 Headers
http.get('/api/protected', ({ request }) => {
  const auth = request.headers.get('Authorization')

  if (!auth) {
    return new HttpResponse(null, { status: 401 })
  }

  return HttpResponse.json({ data: 'protected' })
})

// 處理 Cookies
http.get('/api/session', ({ cookies }) => {
  const sessionId = cookies.sessionId

  if (!sessionId) {
    return new HttpResponse(null, { status: 401 })
  }

  return HttpResponse.json({ sessionId })
})

// 一次性 Handler（僅執行一次）
http.get('/api/once', () => {
  return HttpResponse.json({ data: 'only once' })
}, { once: true })

// 延遲回應
http.get('/api/slow', async () => {
  await delay(2000)
  return HttpResponse.json({ data: 'slow response' })
})

// 自訂回應
http.get('/api/custom', () => {
  return new HttpResponse('Custom text', {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'text/plain',
      'X-Custom-Header': 'value',
    },
  })
})
```

---

### 1.6 GraphQL Handler 寫法

#### Query 處理

```javascript
import { graphql, HttpResponse } from 'msw'

export const handlers = [
  // 基本 Query
  graphql.query('GetUser', ({ query, variables }) => {
    return HttpResponse.json({
      data: {
        user: {
          id: variables.userId,
          name: 'John Maverick',
          email: 'john@example.com',
        },
      },
    })
  }),

  // 處理錯誤
  graphql.query('GetUser', ({ variables }) => {
    return HttpResponse.json({
      errors: [
        {
          message: 'User not found',
          extensions: {
            code: 'USER_NOT_FOUND',
          },
        },
      ],
    })
  }),
]
```

#### Mutation 處理

```javascript
// 基本 Mutation
graphql.mutation('CreateUser', ({ variables }) => {
  return HttpResponse.json({
    data: {
      createUser: {
        id: 'new-user-id',
        ...variables.input,
      },
    },
  })
})

// 帶驗證的 Mutation
graphql.mutation('UpdateUser', ({ variables }) => {
  if (!variables.input.name) {
    return HttpResponse.json({
      errors: [
        {
          message: 'Name is required',
          path: ['updateUser', 'name'],
        },
      ],
    })
  }

  return HttpResponse.json({
    data: {
      updateUser: {
        id: variables.id,
        ...variables.input,
      },
    },
  })
})
```

#### 多個 GraphQL Endpoint

```javascript
// GitHub API
const github = graphql.link('https://api.github.com/graphql')

github.query('GetRepository', () => {
  return HttpResponse.json({
    data: {
      repository: {
        name: 'msw',
        owner: { login: 'mswjs' },
      },
    },
  })
})

// 自己的 API
const myApi = graphql.link('https://my-api.example.com/graphql')

myApi.query('GetPosts', () => {
  return HttpResponse.json({
    data: {
      posts: [
        { id: '1', title: 'Post 1' },
        { id: '2', title: 'Post 2' },
      ],
    },
  })
})

export const handlers = [
  github.query('GetRepository', ...),
  myApi.query('GetPosts', ...),
]
```

#### 攔截所有 GraphQL 操作

```javascript
// 攔截所有操作（不論 query 或 mutation）
graphql.operation(({ query, variables, operationName }) => {
  console.log('Operation:', operationName)
  console.log('Variables:', variables)

  return HttpResponse.json({
    data: { /* mock data */ },
  })
})
```

---

### 1.7 最佳實踐

#### 組織 Handlers 的結構

```
src/
  mocks/
    handlers/
      user.ts          # User 相關的 handlers
      auth.ts          # 認證相關的 handlers
      products.ts      # Product 相關的 handlers
      index.ts         # 統一匯出
    node.ts            # Node.js server 設定
    browser.ts         # Browser worker 設定
```

```typescript
// handlers/user.ts
import { http, HttpResponse } from 'msw'

export const userHandlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ])
  }),

  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John',
    })
  }),
]

// handlers/index.ts
import { userHandlers } from './user'
import { authHandlers } from './auth'
import { productHandlers } from './products'

export const handlers = [
  ...userHandlers,
  ...authHandlers,
  ...productHandlers,
]
```

#### 成功優先策略

基礎 handlers 應定義成功場景（happy path），測試特定錯誤場景時使用運行時覆蓋。

```javascript
// handlers.ts - 只定義成功場景
export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'John' })
  }),
]

// user.test.ts - 測試時覆蓋為錯誤場景
it('handles server error', () => {
  server.use(
    http.get('/api/user', () => {
      return new HttpResponse(null, { status: 500 })
    })
  )

  // 測試錯誤處理邏輯
})

it('handles network error', () => {
  server.use(
    http.get('/api/user', () => {
      return HttpResponse.error()
    })
  )

  // 測試網路錯誤處理
})
```

#### 抽象化重複邏輯

```javascript
// utils/withAuth.ts
import { HttpResponse } from 'msw'

export function withAuth(resolver) {
  return ({ request, ...rest }) => {
    const auth = request.headers.get('Authorization')

    if (!auth || !auth.startsWith('Bearer ')) {
      return new HttpResponse(null, {
        status: 401,
        statusText: 'Unauthorized'
      })
    }

    return resolver({ request, ...rest })
  }
}

// handlers.ts
import { http, HttpResponse } from 'msw'
import { withAuth } from './utils/withAuth'

export const handlers = [
  http.get('/api/profile', withAuth(() => {
    return HttpResponse.json({ name: 'John' })
  })),

  http.get('/api/settings', withAuth(() => {
    return HttpResponse.json({ theme: 'dark' })
  })),
]
```

#### TypeScript 支援

```typescript
// types/user.ts
export interface User {
  id: string
  name: string
  email: string
}

// handlers/user.ts
import { http, HttpResponse } from 'msw'
import type { User } from '../types/user'

export const userHandlers = [
  http.get<never, never, User>('/api/user', () => {
    return HttpResponse.json({
      id: '1',
      name: 'John',
      email: 'john@example.com',
    })
  }),

  http.post<never, Partial<User>, User>('/api/user', async ({ request }) => {
    const userData = await request.json()

    return HttpResponse.json({
      id: 'new-id',
      name: userData.name!,
      email: userData.email!,
    })
  }),
]
```

---

### 1.8 常見陷阱與解決方案

#### 陷阱 1：環境變數未設定

```javascript
// ❌ 錯誤：環境變數在測試中未設定
http.get(`${process.env.API_URL}/users`, () => {
  return HttpResponse.json([])
})

// ✅ 正確：使用完整 URL 或確保環境變數已設定
http.get('https://api.example.com/users', () => {
  return HttpResponse.json([])
})
```

#### 陷阱 2：相對路徑在 Node.js 中無效

```javascript
// ❌ 錯誤：Node.js 不支援相對路徑
http.get('/api/users', () => {
  return HttpResponse.json([])
})

// ✅ 正確：使用絕對 URL
http.get('https://api.example.com/api/users', () => {
  return HttpResponse.json([])
})

// 或者使用萬用字元
http.get('*/api/users', () => {
  return HttpResponse.json([])
})
```

#### 陷阱 3：忘記 await request body

```javascript
// ❌ 錯誤：MSW v2 不會自動解析 body
http.post('/api/user', ({ request }) => {
  console.log(request.body) // undefined
})

// ✅ 正確：使用 async/await
http.post('/api/user', async ({ request }) => {
  const body = await request.json()
  console.log(body) // { name: 'John' }
})
```

#### 陷阱 4：未重置 handlers

```javascript
// ✅ 正確：每個測試後重置
afterEach(() => {
  server.resetHandlers()
})

// 或在特定測試後恢復
afterEach(() => {
  server.restoreHandlers()
})
```

#### 陷阱 5：Jest fake timers 與 body 讀取衝突

```javascript
// ❌ 問題：Jest fake timers 會破壞 request body 讀取
jest.useFakeTimers()

// ✅ 解決：不要 fake queueMicrotask
jest.useFakeTimers({
  doNotFake: ['queueMicrotask']
})
```

---

### 1.9 除錯指南

#### 步驟 1：驗證 MSW 是否攔截請求

```javascript
// vitest.setup.ts
server.events.on('request:start', ({ request }) => {
  console.log('🔵 MSW intercepted:', request.method, request.url)
})

server.events.on('request:match', ({ request }) => {
  console.log('✅ Handler matched:', request.method, request.url)
})

server.events.on('request:unhandled', ({ request }) => {
  console.log('❌ No handler:', request.method, request.url)
})
```

#### 步驟 2：驗證 Handler 是否執行

```javascript
http.get('/api/user', () => {
  console.log('🟢 Handler executed') // 加入 log
  return HttpResponse.json({ name: 'John' })
})
```

#### 步驟 3：驗證回應

```javascript
http.get('/api/user', () => {
  const response = HttpResponse.json({ name: 'John' })
  console.log('📤 Response:', response)
  return response
})
```

#### 步驟 4：檢查應用程式邏輯

如果以上都正常，問題可能在應用程式的請求/回應處理邏輯。

---

## 2. Testing Library

### 2.1 核心原則

**指導原則**：「你的測試越接近軟體的實際使用方式，就越能給你信心。」

- 測試使用者行為，而非實作細節
- 使用 DOM 節點而非 React 元件實例
- 優先使用無障礙查詢
- 鼓勵提升應用的可訪問性

---

### 2.2 Query 優先級

Testing Library 建議按以下優先級選擇查詢方法：

#### 1️⃣ 所有人都可訪問的查詢

**`getByRole`** - 最優先選擇

```javascript
// 按鈕
screen.getByRole('button', { name: /submit/i })

// 輸入框
screen.getByRole('textbox', { name: /username/i })

// 連結
screen.getByRole('link', { name: /learn more/i })

// 標題
screen.getByRole('heading', { name: /welcome/i, level: 1 })

// 複選框
screen.getByRole('checkbox', { name: /agree to terms/i })
```

**`getByLabelText`** - 表單欄位的最佳選擇

```javascript
// 適合表單欄位
screen.getByLabelText(/username/i)
screen.getByLabelText('Email Address')

// 驗證 label 與 input 的正確關聯
```

**`getByPlaceholderText`** - 當無 label 時的備選

```javascript
screen.getByPlaceholderText(/enter your email/i)
```

**`getByText`** - 非互動元素

```javascript
// 段落、div、span 等
screen.getByText(/welcome to our app/i)
screen.getByText('No results found')
```

**`getByDisplayValue`** - 表單元素的當前值

```javascript
// 已填入值的輸入框
screen.getByDisplayValue('John Doe')
```

#### 2️⃣ 語義化查詢

**`getByAltText`** - 圖片、area、自訂元素

```javascript
screen.getByAltText(/profile picture/i)
```

**`getByTitle`** - title 屬性

```javascript
screen.getByTitle('Close')
```

#### 3️⃣ Test ID（最後手段）

**`getByTestId`** - 動態內容或無法用其他方式查詢時使用

```javascript
screen.getByTestId('custom-element')
```

```jsx
// 在元件中添加
<div data-testid="custom-element">Content</div>
```

---

### 2.3 Query 變體

每種查詢都有三種變體：

#### `getBy*` - 同步查詢，找不到會拋出錯誤

```javascript
const button = screen.getByRole('button')
// ✅ 找到元素：返回元素
// ❌ 找不到：拋出錯誤
// ❌ 找到多個：拋出錯誤
```

#### `queryBy*` - 同步查詢，找不到返回 null

```javascript
const button = screen.queryByRole('button')
// ✅ 找到元素：返回元素
// ✅ 找不到：返回 null
// ❌ 找到多個：拋出錯誤

// 適合驗證元素不存在
expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
```

#### `findBy*` - 異步查詢，返回 Promise

```javascript
const button = await screen.findByRole('button')
// ✅ 找到元素：resolve 元素
// ❌ 找不到：reject（預設 1000ms timeout）
// ❌ 找到多個：reject

// 適合等待異步渲染的元素
await screen.findByText('Data loaded')
```

#### 多元素查詢

```javascript
// getAllBy* - 返回陣列，找不到拋出錯誤
const buttons = screen.getAllByRole('button')

// queryAllBy* - 返回陣列，找不到返回空陣列 []
const buttons = screen.queryAllByRole('button')

// findAllBy* - 返回 Promise<Element[]>
const buttons = await screen.findAllByRole('button')
```

---

### 2.4 異步測試

#### `findBy*` 查詢

最簡單的異步測試方式：

```javascript
import { render, screen } from '@testing-library/react'

test('loads and displays data', async () => {
  render(<UserProfile userId="1" />)

  // ✅ 等待元素出現
  const username = await screen.findByText('John Maverick')
  expect(username).toBeInTheDocument()

  // ✅ 可以配置 timeout 和 interval
  const slowElement = await screen.findByText('Slow data', {
    timeout: 3000,
    interval: 100,
  })
})
```

#### `waitFor` 工具

當需要等待多個斷言或複雜條件時：

```javascript
import { render, screen, waitFor } from '@testing-library/react'

test('updates on data change', async () => {
  render(<DataTable />)

  // ✅ 等待條件滿足
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
  })

  // ✅ 配置選項
  await waitFor(
    () => {
      expect(screen.getByRole('alert')).toHaveTextContent('Success')
    },
    {
      timeout: 2000,
      interval: 50,
    }
  )
})
```

**重要注意事項**：

```javascript
// ❌ 錯誤：在 waitFor 中執行副作用
await waitFor(() => {
  fireEvent.click(button) // 不要這樣做！
  expect(modal).toBeVisible()
})

// ✅ 正確：副作用在外面執行
fireEvent.click(button)
await waitFor(() => {
  expect(modal).toBeVisible()
})

// ❌ 錯誤：使用空的 waitFor
await waitFor(() => {}) // 沒有意義

// ❌ 錯誤：返回 falsy 不會重試
await waitFor(() => {
  return element !== null // 不會重試！
})

// ✅ 正確：必須拋出錯誤才會重試
await waitFor(() => {
  if (!element) throw new Error('Not found')
})

// ✅ 更好：使用斷言（自動拋出錯誤）
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

#### `waitForElementToBeRemoved`

等待元素被移除：

```javascript
import { waitForElementToBeRemoved } from '@testing-library/react'

test('removes loading spinner', async () => {
  render(<AsyncComponent />)

  const loader = screen.getByText('Loading...')

  // ✅ 等待元素被移除
  await waitForElementToBeRemoved(loader)

  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})

// ❌ 錯誤：傳入 null
await waitForElementToBeRemoved(null) // 會拋出錯誤

// ✅ 正確：使用 query* 並檢查
const loader = screen.queryByText('Loading...')
if (loader) {
  await waitForElementToBeRemoved(loader)
}
```

---

### 2.5 @testing-library/user-event

#### 為什麼使用 user-event 而非 fireEvent？

**`fireEvent`**：只分發單個 DOM 事件

**`user-event`**：模擬完整的使用者互動流程

```javascript
import userEvent from '@testing-library/user-event'

// ❌ fireEvent - 只觸發 change 事件
fireEvent.change(input, { target: { value: 'Hello' } })

// ✅ user-event - 模擬真實使用者輸入
// - 聚焦元素
// - 逐字輸入
// - 觸發 keydown、keypress、keyup、input、change 等事件
await userEvent.type(input, 'Hello')
```

#### 設定 user-event

```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('user interactions', async () => {
  // ✅ 推薦：在 render 前設定
  const user = userEvent.setup()

  render(<MyForm />)

  const input = screen.getByRole('textbox')
  const button = screen.getByRole('button')

  // 所有 user-event 方法都是異步的
  await user.type(input, 'Hello World')
  await user.click(button)
})
```

#### 常用 API

##### 點擊操作

```javascript
const user = userEvent.setup()

// 單擊
await user.click(element)

// 雙擊
await user.dblClick(element)

// 右鍵點擊
await user.pointer({ keys: '[MouseRight]', target: element })

// 懸停
await user.hover(element)
await user.unhover(element)
```

##### 鍵盤輸入

```javascript
// 輸入文字
await user.type(input, 'Hello World')

// 逐個字符輸入
await user.keyboard('Hello{Enter}')

// 特殊鍵
await user.keyboard('{Shift>}hello{/Shift}') // HELLO
await user.keyboard('{Control>}a{/Control}') // Ctrl+A
await user.keyboard('{Escape}')

// 清空輸入
await user.clear(input)
```

##### 選擇操作

```javascript
// 下拉選單
await user.selectOptions(select, 'option1')
await user.selectOptions(select, ['option1', 'option2']) // 多選

// 取消選擇
await user.deselectOptions(select, 'option1')
```

##### 上傳文件

```javascript
const file = new File(['hello'], 'hello.png', { type: 'image/png' })
const input = screen.getByLabelText(/upload file/i)

await user.upload(input, file)

// 多個文件
await user.upload(input, [file1, file2])
```

##### 複製貼上

```javascript
// 複製
await user.copy()

// 剪下
await user.cut()

// 貼上
await user.paste('text to paste')
```

##### Tab 導航

```javascript
// Tab 到下一個元素
await user.tab()

// Shift+Tab 到上一個元素
await user.tab({ shift: true })
```

#### 完整範例

```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  test('user can login successfully', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn()

    render(<LoginForm onLogin={mockLogin} />)

    // 取得元素
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // 模擬使用者互動
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // 驗證結果
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    })
  })

  test('shows validation errors', async () => {
    const user = userEvent.setup()

    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // 不填任何欄位直接提交
    await user.click(submitButton)

    // 驗證錯誤訊息
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })
})
```

---

### 2.6 常見錯誤與最佳實踐

#### ❌ 錯誤 1：使用錯誤的斷言

```javascript
// ❌ 錯誤
expect(button.disabled).toBe(true)
expect(element.className).toBe('active')

// ✅ 正確 - 使用 @testing-library/jest-dom
expect(button).toBeDisabled()
expect(element).toHaveClass('active')
```

#### ❌ 錯誤 2：使用錯誤的查詢

```javascript
// ❌ 錯誤
screen.getByTestId('username-input')

// ✅ 正確
screen.getByRole('textbox', { name: /username/i })
screen.getByLabelText(/username/i)
```

#### ❌ 錯誤 3：誤用 query* 變體

```javascript
// ❌ 錯誤 - queryBy* 找到元素時錯誤訊息不清楚
expect(screen.queryByRole('button')).toBeInTheDocument()

// ✅ 正確 - getBy* 找不到時有清楚的錯誤訊息
expect(screen.getByRole('button')).toBeInTheDocument()

// ✅ 正確 - queryBy* 只用於驗證不存在
expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
```

#### ❌ 錯誤 4：手動 cleanup

```javascript
// ❌ 不需要 - Testing Library 自動清理
afterEach(() => {
  cleanup()
})

// ✅ 移除 cleanup 呼叫
```

#### ❌ 錯誤 5：解構 render 返回值

```javascript
// ❌ 不推薦
const { getByRole } = render(<Component />)
const button = getByRole('button')

// ✅ 推薦 - 使用 screen
render(<Component />)
const button = screen.getByRole('button')
```

#### ❌ 錯誤 6：在 act() 中包裝

```javascript
// ❌ 不需要 - Testing Library 已經處理
await act(async () => {
  render(<Component />)
})

await act(async () => {
  fireEvent.click(button)
})

// ✅ 直接呼叫
render(<Component />)
fireEvent.click(button)
```

#### ❌ 錯誤 7：使用 fireEvent 而非 user-event

```javascript
// ❌ 不推薦
fireEvent.click(button)
fireEvent.change(input, { target: { value: 'text' } })

// ✅ 推薦
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'text')
```

#### ❌ 錯誤 8：添加不必要的 ARIA 屬性

```javascript
// ❌ 不需要
<button role="button">Click me</button>

// ✅ 語義化 HTML 已經提供
<button>Click me</button>

// ✅ 只在必要時添加 ARIA
<div role="button" tabIndex={0}>Custom button</div>
```

#### ✅ 最佳實踐總結

1. **優先使用 `getByRole`**
2. **表單使用 `getByLabelText`**
3. **異步元素使用 `findBy*`**
4. **使用 `user-event` 而非 `fireEvent`**
5. **使用 `@testing-library/jest-dom` 的斷言**
6. **測試使用者行為，而非實作細節**
7. **使用 `screen` 而非解構 render**
8. **避免 `data-testid`，除非別無選擇**

---

## 3. Vitest 整合

### 3.1 安裝依賴

```bash
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D msw
```

---

### 3.2 Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 全域測試 API (describe, it, expect)
    globals: true,

    // 測試環境
    environment: 'jsdom',

    // Setup 文件
    setupFiles: ['./vitest.setup.ts'],

    // Coverage 配置
    coverage: {
      provider: 'v8', // 或 'istanbul'
      reporter: ['text', 'html', 'json', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/mocks/**',
        'src/**/*.d.ts',
        'src/main.tsx',
      ],
      // Coverage thresholds
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },

    // 並行測試
    threads: true,

    // 測試超時時間
    testTimeout: 10000,

    // Watch mode 排除
    watchExclude: ['**/node_modules/**', '**/dist/**'],

    // 測試檔案匹配
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

### 3.3 Setup 文件配置

```typescript
// vitest.setup.ts
import { expect, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { server } from './src/mocks/node'

// 擴展 expect 的 matchers
expect.extend(matchers)

// 每個測試後自動清理
afterEach(() => {
  cleanup()
})

// ===================
// MSW Setup
// ===================

// 在所有測試前啟動 MSW server
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  })
})

// 每個測試後重置 handlers
afterEach(() => {
  server.resetHandlers()
})

// 所有測試結束後關閉 server
afterAll(() => {
  server.close()
})

// 可選：監聽請求（用於除錯）
if (process.env.DEBUG_MSW === 'true') {
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url)
  })
}
```

---

### 3.4 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### 3.5 Mock 策略：vi.mock vs MSW

#### 何時使用 `vi.mock()`

用於模擬**內部模組和依賴**：

```typescript
// ✅ 模擬工具函式
vi.mock('@/utils/storage', () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}))

// ✅ 模擬第三方庫
vi.mock('lodash', () => ({
  debounce: vi.fn((fn) => fn),
}))

// ✅ 模擬 React hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', name: 'John' },
    isAuthenticated: true,
  })),
}))
```

**範例**：

```typescript
// useLocalStorage.test.ts
import { renderHook } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

// 模擬 localStorage
const mockGetItem = vi.fn()
const mockSetItem = vi.fn()

vi.stubGlobal('localStorage', {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
})

describe('useLocalStorage', () => {
  it('reads from localStorage', () => {
    mockGetItem.mockReturnValue(JSON.stringify({ name: 'John' }))

    const { result } = renderHook(() => useLocalStorage('user'))

    expect(result.current[0]).toEqual({ name: 'John' })
    expect(mockGetItem).toHaveBeenCalledWith('user')
  })
})
```

#### 何時使用 MSW

用於模擬**網路請求**：

```typescript
// ✅ 模擬 REST API
http.get('/api/users', () => {
  return HttpResponse.json([{ id: '1', name: 'John' }])
})

// ✅ 模擬 GraphQL
graphql.query('GetUser', () => {
  return HttpResponse.json({
    data: { user: { id: '1', name: 'John' } },
  })
})
```

**範例**：

```typescript
// UserList.test.tsx
import { render, screen } from '@testing-library/react'
import { server } from '@/mocks/node'
import { http, HttpResponse } from 'msw'
import UserList from './UserList'

describe('UserList', () => {
  it('displays users from API', async () => {
    // 使用預設的 handlers (定義在 src/mocks/handlers.ts)
    render(<UserList />)

    expect(await screen.findByText('John')).toBeInTheDocument()
    expect(await screen.findByText('Jane')).toBeInTheDocument()
  })

  it('handles API error', async () => {
    // 測試特定錯誤場景：覆蓋預設 handler
    server.use(
      http.get('/api/users', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    render(<UserList />)

    expect(await screen.findByText(/error loading users/i)).toBeInTheDocument()
  })
})
```

#### 組合使用

```typescript
// UserProfile.test.tsx
import { render, screen } from '@testing-library/react'
import { server } from '@/mocks/node'
import { http, HttpResponse } from 'msw'
import UserProfile from './UserProfile'

// 模擬 React Router
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({ userId: '123' })),
  useNavigate: vi.fn(() => vi.fn()),
}))

describe('UserProfile', () => {
  it('loads user data', async () => {
    // MSW 處理 API 請求
    server.use(
      http.get('/api/users/123', () => {
        return HttpResponse.json({
          id: '123',
          name: 'John Maverick',
        })
      })
    )

    render(<UserProfile />)

    expect(await screen.findByText('John Maverick')).toBeInTheDocument()
  })
})
```

#### 決策指南

| 場景 | 使用工具 | 原因 |
|------|----------|------|
| 模擬 HTTP/GraphQL 請求 | MSW | 網路層攔截，無需修改代碼 |
| 模擬內部工具函式 | vi.mock() | 直接模擬模組 |
| 模擬第三方庫 | vi.mock() | 避免真實執行 |
| 模擬 WebSocket | MSW | 支援 WebSocket 攔截 |
| 模擬 localStorage | vi.stubGlobal() | 模擬全域物件 |
| 模擬 Date/Timer | vi.useFakeTimers() | Vitest 內建支援 |

---

### 3.6 Coverage 配置詳解

#### Provider 選擇

**V8 (推薦)**：

```typescript
coverage: {
  provider: 'v8',
  // 優點：
  // - 更快的執行速度
  // - 更低的記憶體使用
  // - 無需預處理
  // - 準確度與 Istanbul 相當（Vitest v3.2.0+）

  // 缺點：
  // - 僅支援 V8 引擎（Node.js、Deno、Chromium）
}
```

**Istanbul**：

```typescript
coverage: {
  provider: 'istanbul',
  // 優點：
  // - 跨 JavaScript 引擎支援
  // - 成熟穩定（13 年歷史）
  // - 可限制 coverage 到特定文件

  // 缺點：
  // - 需要預處理（instrumentation）
  // - 較高記憶體使用
  // - 較慢的執行速度
}
```

#### 完整配置範例

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      // Provider
      provider: 'v8',

      // Reporters
      reporter: [
        'text',        // 終端顯示
        'html',        // 生成 HTML 報告
        'json',        // JSON 格式
        'lcov',        // LCOV 格式（CI 整合）
        'json-summary', // JSON 摘要
      ],

      // 包含的文件
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
      ],

      // 排除的文件
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/mocks/**',
        'src/types/**',
        'src/**/*.stories.tsx',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],

      // Coverage thresholds (門檻)
      lines: 80,          // 行覆蓋率
      functions: 80,      // 函式覆蓋率
      branches: 80,       // 分支覆蓋率
      statements: 80,     // 語句覆蓋率

      // 包含所有文件（包括未測試的）
      all: true,

      // 報告輸出目錄
      reportsDirectory: './coverage',

      // 忽略特定程式碼
      ignoreClassMethods: ['constructor'],

      // 自訂 threshold（針對特定文件）
      perFile: true,

      // Watermarks（顏色標記）
      watermarks: {
        lines: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        statements: [80, 95],
      },
    },
  },
})
```

#### 忽略程式碼（Coverage Comments）

```typescript
// 忽略整個區塊
/* v8 ignore start -- @preserve */
function untestableCode() {
  // 這段不會計入 coverage
}
/* v8 ignore stop -- @preserve */

// 忽略下一行
/* v8 ignore next -- @preserve */
const hardToTest = process.env.NODE_ENV === 'production' ? a : b

// 忽略 if 條件
/* v8 ignore if -- @preserve */
if (isDevelopment) {
  console.log('Debug info')
}

// 忽略 else 條件
if (isProduction) {
  logToServer()
} /* v8 ignore else -- @preserve */ else {
  console.log('Dev only')
}
```

**注意**：必須加上 `-- @preserve` 以確保 esbuild 不會移除註釋。

#### 執行 Coverage

```bash
# 執行測試並生成 coverage
npm run test -- --coverage

# 指定 reporter
npm run test -- --coverage --coverage.reporter=html

# 在 UI 中查看 coverage
npm run test -- --ui --coverage
```

#### CI 整合

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
```

---

## 4. 完整範例專案結構

```
project/
├── src/
│   ├── components/
│   │   ├── UserList/
│   │   │   ├── UserList.tsx
│   │   │   ├── UserList.test.tsx
│   │   │   └── index.ts
│   │   ├── LoginForm/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── LoginForm.test.tsx
│   │   │   └── index.ts
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAuth.test.ts
│   │   └── ...
│   │
│   ├── mocks/
│   │   ├── handlers/
│   │   │   ├── user.ts          # User API handlers
│   │   │   ├── auth.ts          # Auth API handlers
│   │   │   ├── products.ts      # Products API handlers
│   │   │   └── index.ts         # 統一匯出
│   │   ├── node.ts              # Node.js server setup
│   │   ├── browser.ts           # Browser worker setup
│   │   └── utils/
│   │       ├── withAuth.ts      # 認證中介層
│   │       └── fixtures.ts      # 測試資料
│   │
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── helpers.test.ts
│   │   └── ...
│   │
│   └── main.tsx
│
├── tests/
│   ├── setup/
│   │   └── test-utils.tsx       # 自訂測試工具
│   └── ...
│
├── public/
│   └── mockServiceWorker.js     # MSW Service Worker
│
├── vitest.config.ts
├── vitest.setup.ts
├── tsconfig.json
└── package.json
```

---

### 4.1 實際測試範例

#### 範例 1：測試帶 API 請求的元件

```typescript
// src/components/UserList/UserList.tsx
import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://api.example.com/users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div role="alert">Error: {error}</div>

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </li>
      ))}
    </ul>
  )
}
```

```typescript
// src/components/UserList/UserList.test.tsx
import { render, screen } from '@testing-library/react'
import { server } from '@/mocks/node'
import { http, HttpResponse } from 'msw'
import UserList from './UserList'

describe('UserList', () => {
  it('displays loading state initially', () => {
    render(<UserList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays users after loading', async () => {
    render(<UserList />)

    // 等待 loading 消失
    expect(await screen.findByText('John Maverick')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('handles server error', async () => {
    // 覆蓋預設 handler
    server.use(
      http.get('https://api.example.com/users', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    render(<UserList />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Error: Failed to fetch')
  })

  it('handles network error', async () => {
    server.use(
      http.get('https://api.example.com/users', () => {
        return HttpResponse.error()
      })
    )

    render(<UserList />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Error: Failed to fetch')
  })
})
```

#### 範例 2：測試表單提交

```typescript
// src/components/LoginForm/LoginForm.tsx
import { useState } from 'react'

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await onLogin({ email, password })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <div role="alert">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
```

```typescript
// src/components/LoginForm/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '@/mocks/node'
import { http, HttpResponse } from 'msw'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  it('submits form with credentials', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockResolvedValue(undefined)

    render(<LoginForm onLogin={mockLogin} />)

    // 取得表單元素
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // 填寫表單
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')

    // 提交表單
    await user.click(submitButton)

    // 驗證
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    })
  })

  it('displays error on login failure', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginForm onLogin={mockLogin} />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('disables button while loading', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<LoginForm onLogin={mockLogin} />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // 按鈕應該被禁用且顯示 loading 文字
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent('Signing in...')
  })
})
```

#### 範例 3：測試自訂 Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://api.example.com/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('https://api.example.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) throw new Error('Login failed')

    const data = await res.json()
    setUser(data.user)
    return data
  }

  const logout = () => {
    setUser(null)
  }

  return { user, loading, login, logout }
}
```

```typescript
// src/hooks/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '@/mocks/node'
import { http, HttpResponse } from 'msw'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('loads user on mount', async () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual({
      id: '1',
      name: 'John Maverick',
      email: 'john@example.com',
    })
  })

  it('handles login', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const loginResult = await result.current.login('user@example.com', 'password123')

    expect(loginResult.token).toBeDefined()
    expect(result.current.user).toEqual({
      id: '1',
      name: 'John Maverick',
      email: 'user@example.com',
    })
  })

  it('handles logout', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).not.toBe(null)
    })

    result.current.logout()

    expect(result.current.user).toBe(null)
  })

  it('handles login failure', async () => {
    server.use(
      http.post('https://api.example.com/auth/login', () => {
        return new HttpResponse(null, { status: 401 })
      })
    )

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(
      result.current.login('user@example.com', 'wrongpassword')
    ).rejects.toThrow('Login failed')
  })
})
```

---

### 4.2 自訂測試工具

```typescript
// tests/setup/test-utils.tsx
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 創建測試用的 QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 測試時不重試
      },
    },
  })

interface AllProvidersProps {
  children: React.ReactNode
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// 自訂 render 函式
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// 重新匯出所有 @testing-library/react 的工具
export * from '@testing-library/react'

// 覆蓋 render 方法
export { customRender as render }
```

**使用自訂測試工具**：

```typescript
// 使用自訂的 render（已包含所有 Providers）
import { render, screen } from '@/tests/setup/test-utils'
import MyComponent from './MyComponent'

test('renders with providers', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

---

### 4.3 Mock 資料管理

```typescript
// src/mocks/utils/fixtures.ts
import type { User, Product, Order } from '@/types'

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Maverick',
    email: 'john@example.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
  },
]

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Product 1',
    price: 29.99,
    stock: 100,
  },
  {
    id: 'p2',
    name: 'Product 2',
    price: 49.99,
    stock: 50,
  },
]

export const mockOrders: Order[] = [
  {
    id: 'o1',
    userId: '1',
    products: ['p1', 'p2'],
    total: 79.98,
    status: 'pending',
  },
]

// 工具函式
export const getUserById = (id: string) =>
  mockUsers.find(u => u.id === id)

export const getProductById = (id: string) =>
  mockProducts.find(p => p.id === id)
```

**在 handlers 中使用**：

```typescript
// src/mocks/handlers/user.ts
import { http, HttpResponse } from 'msw'
import { mockUsers, getUserById } from '../utils/fixtures'

export const userHandlers = [
  http.get('https://api.example.com/users', () => {
    return HttpResponse.json(mockUsers)
  }),

  http.get('https://api.example.com/users/:id', ({ params }) => {
    const user = getUserById(params.id as string)

    if (!user) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json(user)
  }),
]
```

---

### 4.4 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:debug": "DEBUG_MSW=true vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/ui": "^2.1.8",
    "jsdom": "^25.0.1",
    "msw": "^2.7.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.6",
    "vitest": "^2.1.8"
  }
}
```

---

## 總結

這份指南涵蓋了：

1. **MSW v2.x**
   - 核心概念與設定
   - Node.js 和 Browser 環境配置
   - HTTP 和 GraphQL Handler 寫法
   - 最佳實踐和常見陷阱

2. **Testing Library**
   - 核心原則與 Query 優先級
   - 異步測試（findBy, waitFor）
   - user-event 的正確使用
   - 常見錯誤與最佳實踐

3. **Vitest 整合**
   - 完整配置
   - MSW 與 Vitest 的整合
   - Mock 策略（vi.mock vs MSW）
   - Coverage 配置

4. **完整範例**
   - 專案結構
   - 實際測試範例
   - 自訂測試工具
   - Mock 資料管理

按照這份指南，你可以建立一個健全、可維護的測試環境，確保代碼品質和信心。

---

## 參考資源

### MSW
- [MSW 官方文檔](https://mswjs.io/docs/)
- [MSW GitHub](https://github.com/mswjs/msw)
- [MSW v1 到 v2 遷移指南](https://mswjs.io/docs/migrations/1.x-to-2.x/)

### Testing Library
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)
- [user-event](https://testing-library.com/docs/user-event/intro/)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Vitest
- [Vitest 官方文檔](https://vitest.dev/)
- [Vitest Coverage](https://vitest.dev/guide/coverage)
- [Vitest UI](https://vitest.dev/guide/ui.html)
