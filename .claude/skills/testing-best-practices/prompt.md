# Testing Best Practices - MSW + Vitest + Testing Library

這個 skill 提供現代前端和後端測試的最佳實踐指南。

---

## 快速參考

### MSW (Mock Service Worker) v2.x

#### 基本設定（Vitest + Node.js）

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.example.com/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]);
  }),

  http.post('https://api.example.com/login', async ({ request }) => {
    const { email, password } = await request.json();
    return HttpResponse.json({ token: 'mock-token' });
  })
];

// src/mocks/node.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/node';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### 關鍵要點

✅ **DO（正確做法）**：
- 使用 `server.resetHandlers()` 在每個測試後重置
- 使用 `HttpResponse.json()` 返回 JSON
- 使用 `http.get/post/put/delete` 定義 handlers
- 組織 handlers 按功能模組分類

❌ **DON'T（錯誤做法）**：
- 不要忘記在 `afterEach` 中 reset handlers
- 不要直接返回物件（必須用 HttpResponse）
- 不要在測試中直接修改 global handlers

#### 測試中覆寫 Handler

```typescript
it('handles error response', async () => {
  server.use(
    http.get('https://api.example.com/users', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  // 測試錯誤處理...
});
```

---

### Testing Library

#### Query 優先級（由高到低）

1. **getByRole** - 最推薦（可訪問性最佳）
2. **getByLabelText** - 表單元素
3. **getByPlaceholderText** - 輸入框
4. **getByText** - 非互動元素
5. **getByDisplayValue** - 表單當前值
6. **getByAltText** - 圖片
7. **getByTitle** - 標題屬性
8. **getByTestId** - 最後手段（避免使用）

#### Query 變體

| 變體 | 用途 | 找不到時 | 找到多個時 | 異步 |
|------|------|----------|------------|------|
| **getBy** | 預期存在 | 拋錯 | 拋錯 | ❌ |
| **queryBy** | 預期不存在 | 返回 null | 拋錯 | ❌ |
| **findBy** | 異步等待 | 拋錯 | 拋錯 | ✅ |

#### 實際範例

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('user can submit form', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<LoginForm onSubmit={onSubmit} />);

  // ✅ 使用 getByRole（最佳）
  const emailInput = screen.getByRole('textbox', { name: /email/i });
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /submit/i });

  // ✅ 使用 user-event（模擬真實用戶行為）
  await user.type(emailInput, 'test@example.com');
  await user.type(passwordInput, 'password123');
  await user.click(submitButton);

  // ✅ 等待異步操作
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

#### 8 個常見錯誤

❌ **1. 使用 getByTestId 作為首選**
```tsx
// ❌ 錯誤
screen.getByTestId('submit-button');

// ✅ 正確
screen.getByRole('button', { name: /submit/i });
```

❌ **2. 使用 waitFor 包裝非異步查詢**
```tsx
// ❌ 錯誤
await waitFor(() => screen.getByText('Hello'));

// ✅ 正確
await screen.findByText('Hello');
```

❌ **3. 使用 container.querySelector**
```tsx
// ❌ 錯誤
const { container } = render(<MyComponent />);
const button = container.querySelector('.my-button');

// ✅ 正確
const button = screen.getByRole('button', { name: /my button/i });
```

❌ **4. 過度使用 act()**
```tsx
// ❌ 錯誤（user-event 已自動處理）
await act(async () => {
  await user.click(button);
});

// ✅ 正確
await user.click(button);
```

❌ **5. 直接操作 DOM**
```tsx
// ❌ 錯誤
fireEvent.change(input, { target: { value: 'text' } });

// ✅ 正確（更真實的用戶行為）
await user.type(input, 'text');
```

---

### Vitest 整合

#### 完整配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // React 測試
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/__tests__/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
```

#### Mock 策略決策表

| 場景 | 使用 MSW | 使用 vi.mock |
|------|----------|--------------|
| API 請求 | ✅ | ❌ |
| WebSocket | ✅ | ❌ |
| 模組依賴 | ❌ | ✅ |
| Timer/Date | ❌ | ✅ |
| localStorage | ❌ | ✅ |
| 第三方 SDK | ❌ | ✅ |

#### 實戰範例：整合測試

```typescript
// src/components/UserList.test.tsx
import { render, screen } from '@testing-library/react';
import { server } from '../mocks/node';
import { http, HttpResponse } from 'msw';
import { UserList } from './UserList';

describe('UserList', () => {
  it('displays users from API', async () => {
    render(<UserList />);

    // ✅ 等待異步加載
    const user1 = await screen.findByText('John');
    const user2 = await screen.findByText('Jane');

    expect(user1).toBeInTheDocument();
    expect(user2).toBeInTheDocument();
  });

  it('handles API error', async () => {
    // ✅ 覆寫 handler 測試錯誤
    server.use(
      http.get('https://api.example.com/users', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<UserList />);

    const errorMessage = await screen.findByText(/error loading users/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
```

---

## 完整文檔

詳細的配置說明、進階用法和更多範例，請參閱：

**`docs/testing/TESTING-BEST-PRACTICES-GUIDE.md`**

內容包含：
- MSW v2 完整 API 和最佳實踐
- Testing Library 完整 Query 指南
- user-event 完整 API 參考
- Vitest 配置詳解
- 10+ 實戰測試範例
- 常見陷阱和解決方案
- 除錯指南

---

## 快速決策流程圖

### 選擇正確的 Query

```
需要查詢元素？
├─ 是互動元素（按鈕、連結、輸入框）？
│  └─ ✅ 使用 getByRole
├─ 是表單輸入？
│  └─ ✅ 使用 getByLabelText
├─ 是顯示文字？
│  └─ ✅ 使用 getByText
└─ 實在找不到？
   └─ ⚠️ 使用 getByTestId（最後手段）
```

### 選擇正確的變體

```
元素現在存在？
├─ 是 → 使用 getBy
├─ 否（預期不存在）→ 使用 queryBy
└─ 異步加載 → 使用 findBy
```

### Mock 策略選擇

```
需要 Mock 什麼？
├─ HTTP/GraphQL 請求
│  └─ ✅ 使用 MSW
├─ WebSocket/SSE
│  └─ ✅ 使用 MSW
├─ 模組依賴
│  └─ ✅ 使用 vi.mock
└─ Timer/Date/localStorage
   └─ ✅ 使用 vi.mock
```

---

## 常用指令

```bash
# 執行測試
pnpm test

# 執行測試（UI 模式）
pnpm test:ui

# 生成覆蓋率報告
pnpm test:coverage

# 監視模式（開發中）
pnpm test --watch

# 執行特定測試
pnpm test UserList.test.tsx

# 更新 snapshot
pnpm test -u
```

---

## 參考資源

- **MSW 官方文檔**: https://mswjs.io/docs/
- **Testing Library 文檔**: https://testing-library.com/
- **Vitest 文檔**: https://vitest.dev/
- **完整指南**: `docs/testing/TESTING-BEST-PRACTICES-GUIDE.md`
