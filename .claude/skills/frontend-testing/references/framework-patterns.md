# Frontend Testing — Framework-Specific Patterns

> 此檔案是 `frontend-testing` skill 的補充，收錄特定 library 的測試模板。主要策略與 test double 選擇在 SKILL.md。

## Testing React Hook Form + Zod

Test forms through user interactions, not internal state. No Double for the form — render the real form.

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  it('submits valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret123',
      });
    });
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

**Key points:**
- Use `waitFor` — react-hook-form validation is async
- Query by `getByLabelText` for form fields (accessible)
- Test the **user-visible error messages**, not zod internals
- `onSubmit` is a **Spy** (vi.fn) — test double #6, because the real submission would hit an API

## Testing React Query

Wrap components in `QueryClientProvider` with a fresh `QueryClient` per test.

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('TerminalList', () => {
  it('renders terminals after loading', async () => {
    // Use MSW or fetchMock (Proxy Mock — test double #3)
    server.use(
      http.get('/api/terminals', () =>
        HttpResponse.json({ sessions: [{ id: 't1', pid: 123 }] }),
      ),
    );

    renderWithQuery(<TerminalList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('t1')).toBeInTheDocument();
    });
  });
});
```

**Key points:**
- Fresh `QueryClient` per test — no shared cache
- `retry: false` — tests fail fast instead of retrying
- Use **MSW** (Proxy Mock) to intercept HTTP — ky's real code runs, only network is faked
- Don't mock `useQuery` — test the real data flow

## Testing Error Boundary

```typescript
import { ErrorBoundary } from 'react-error-boundary';
import { render, screen } from '@testing-library/react';

function ThrowingComponent() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders fallback on error', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    spy.mockRestore();
  });
});
```

## Testing ky API Client

Don't mock ky — use **msw-fetch-mock** (Proxy Mock) to intercept at the network level.
See the `msw-fetch-mock` skill for full API details.

```typescript
import { fetchMock } from 'msw-fetch-mock';
import { fetchTerminals } from '../services/terminal';

beforeAll(() => fetchMock.activate({ onUnhandledRequest: 'error' }));
afterAll(() => fetchMock.deactivate());
afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
  fetchMock.reset();
});

describe('fetchTerminals', () => {
  it('returns parsed terminals', async () => {
    fetchMock
      .get('https://localhost')
      .intercept({ path: '/api/terminals', method: 'GET' })
      .reply(200, { sessions: [{ id: 't1', pid: 1 }] });

    const result = await fetchTerminals();
    expect(result.sessions[0].id).toBe('t1');
  });

  it('throws on invalid response shape', async () => {
    fetchMock
      .get('https://localhost')
      .intercept({ path: '/api/terminals', method: 'GET' })
      .reply(200, { invalid: true });

    await expect(fetchTerminals()).rejects.toThrow();
  });
});
```

**Key points:**
- `msw-fetch-mock` intercepts at network level — ky hooks (beforeRequest, afterResponse, beforeError) all run
- Test zod parse failure by returning wrong shape
- No `vi.mock('ky')` — real code, fake network
- Use `assertNoPendingInterceptors()` to ensure all expected requests were made

