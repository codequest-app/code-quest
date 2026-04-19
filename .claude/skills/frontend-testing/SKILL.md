---
name: frontend-testing
description: >
  Frontend testing guide for React components, hooks, and stores using testing-library, vitest, and Storybook.
  Use when writing or refactoring component tests, hook tests, or choosing between test doubles
  (fake, spy, mock, stub). Covers query priority (getByRole > getByText), userEvent patterns,
  and when to use Storybook play functions vs testing-library tests.
---

# Frontend Testing Guide

> 相關 skill 分工：
> - 五型經典定義（Dummy/Stub/Fake/Spy/Mock）→ `test-doubles`
> - Server-side test double 選擇 → `vitest-testing`
> - TDD 流程 → `tdd-guidelines`
> - RTL + Storybook 通用慣例 → `testing-best-practices`

## Test Double Selection Order

**Prefer no double. Escalate only when necessary.**

```
No Double → Spy → Proxy Mock → Partial Mock → Fake (Wrapper) → Mock (vi.fn) → Stub
```

| # | Type | What it does | When to use | Frontend example |
|---|------|-------------|-------------|-----------------|
| 1 | **No Double** | Real implementation, no substitution | Always first choice | Zustand store, pure components, real child components |
| 2 | **Spy** | Observes real function without replacing | Verify a call happened | `vi.spyOn(session, 'abort')` — real method still runs |
| 3 | **Proxy Mock** | Intercepts external calls at protocol level | Any data fetching (direct or via prop callback) | `msw-fetch-mock` (preferred), MSW handlers — real code runs, network is faked |
| 4 | **Partial Mock** | Replaces one method, rest stays real | One method is expensive | `vi.spyOn(obj, 'heavyMethod').mockReturnValue(cached)` |
| 5 | **Fake (Wrapper)** | Lightweight working substitute | External system boundaries | FakeSummoner (EventEmitter-based socket + server pipeline) |
| 6 | **Mock (vi.fn)** | Standalone function with no real impl | Callback props | `onSend={vi.fn()}` — no real behavior |
| 7 | **Stub** | Fixed return, no logic | Hardcoded test data | `vi.fn().mockReturnValue(fixedData)` — most artificial |

### Decision Flow

```
Can I use the real thing with no substitution?
  ├─ YES → No Double (Zustand store, pure functions, real components)
  └─ NO → Do I just need to observe a call?
      ├─ YES → Spy (vi.spyOn, real method still runs)
      └─ NO → Does data flow through an external system?
          ├─ HTTP/fetch → Proxy Mock (msw-fetch-mock — intercept at protocol level)
          │               See msw-fetch-mock skill for API details.
          ├─ Socket.IO → FakeClaude (see "Socket Testing" section below)
          └─ Neither → Can I replace just one method?
              ├─ YES → Partial Mock (vi.spyOn + mockReturnValue)
              └─ NO → Do I need to verify it was called?
                  ├─ YES → Mock (vi.fn())
                  └─ NO → Stub (vi.fn().mockReturnValue())
```

> **Key rule:** If a prop callback wraps a `socket.emit()` call (e.g. `onFetch`, `listSessions`,
> `onSave`), the test should use FakeClaude socket — wire up providers with `claude.socket` and pass the
> real callback to the component. Do **not** replace socket-based callbacks with `vi.fn()` (#6).

### Why This Order Matters

Each level **removes more real behavior**:

- **No Double**: 100% real — highest confidence
- **Spy**: 99% real — just observing
- **Proxy Mock**: Real code runs, only network is intercepted
- **Partial Mock**: One seam replaced, rest is real
- **Fake**: Working substitute, but custom implementation
- **Mock**: No real behavior at all
- **Stub**: No behavior + hardcoded data — lowest confidence

### ❌ Avoid `vi.mock()` for Module Replacement

`vi.mock()` replaces the **entire module** — you're testing mock behavior, not real behavior.

```typescript
// ❌ BAD — tests mock, not real hook
vi.mock('../../hooks/use-chat', () => ({
  useChat: () => ({
    sendMessage: vi.fn(),
  }),
}));

// ✅ GOOD — inject dependency, use fake
function ChatPanel({ socket }: { socket: TypedSocket }) {
  const { sendMessage } = useChat(socket); // socket is injectable
}
// In test: pass a fake socket
render(<ChatPanel socket={fakeSocket} />);
```

**If you must mock a module**, it means your design has a coupling problem. Fix the design first.

## Query Priority (Testing Library)

Always query as the user would. Ordered from most to least preferred:

### Tier 1: Accessible to Everyone
| Query | Use for |
|-------|---------|
| `getByRole('button', { name: /send/i })` | **Default choice** — any element in accessibility tree |
| `getByLabelText('Email')` | Form fields with labels |
| `getByPlaceholderText('Search...')` | When no label exists |
| `getByText('Submit')` | Non-interactive text content |
| `getByDisplayValue('pre-filled')` | Filled form inputs |

### Tier 2: Semantic
| Query | Use for |
|-------|---------|
| `getByAltText('Logo')` | Images, area elements |
| `getByTitle('Close')` | Title attributes (unreliable) |

### Tier 3: Last Resort
| Query | Use for |
|-------|---------|
| `getByTestId('complex-widget')` | Only when semantic queries impossible |

### Query Variants
| Variant | Behavior | When |
|---------|----------|------|
| `getBy` | Throws if not found | Element must exist |
| `queryBy` | Returns null if not found | Assert element absence |
| `findBy` | Async, waits for element | After state update / async |

## Testing Strategy Split

| What to test | Where | Tool |
|-------------|-------|------|
| Visual states & variations | Storybook stories | `args` |
| Click, type, hover interactions | Storybook `play` functions | `userEvent`, `expect`, `canvas` |
| Component renders correct output | Vitest + testing-library | `render`, `screen` |
| Hook logic (state, effects) | Vitest + `renderHook` | `@testing-library/react` |
| Store logic (actions, selectors) | Vitest (no React) | `store.getState()` |
| Socket ↔ UI integration | Vitest + FakeClaude | `claude.emit(segment)` + `screen` |
| Full page integration | Storybook composite story | Decorators + providers |

### Rule of Thumb

- **Storybook** = visual documentation + interaction demos (will be seen by team)
- **Vitest** = correctness guarantees + edge cases + regression prevention (will be run in CI)
- Don't duplicate: if storybook play covers the interaction, vitest doesn't need to repeat it

## Socket Testing with FakeClaude

See `fake-summoner-client` skill for full API. Three test patterns for socket-dependent components:

### Pattern 1: State injection (no socket needed)

When testing component rendering with specific state, use `initialState` on `ChannelProvider`.
No socket interaction, no FakeClaude pipeline.

```typescript
// ✅ GOOD — test component rendering with specific state
render(
  <SocketProvider socket={createFakeSummoner().claude().socket}>
    <SessionProvider>
      <TabProvider>
        <ChannelProvider
          channelId="ch-1"
          initialState={{
            pendingControls: [{ requestId: 'r1', subtype: 'can_use_tool', toolName: 'Bash' }],
          }}
        >
          <ChatPanel joinSession={vi.fn()} toggleHistory={vi.fn()} />
        </ChannelProvider>
      </TabProvider>
    </SessionProvider>
  </SocketProvider>,
);

expect(screen.getByText(/Bash/)).toBeInTheDocument();
```

### Pattern 2: Full pipeline (server→client→UI) — `renderWithWorkspace`

When testing CLI→server→client event flow, use `renderWithWorkspace` + `claude.emit()`.
Client FakeClaude auto-wraps emit with `act()` — no manual act needed.

```typescript
// ✅ GOOD — full pipeline with renderWithWorkspace
import { renderWithWorkspace } from '../../test/render-with-workspace';

const { claude, user } = await renderWithWorkspace();
const textarea = screen.getByPlaceholderText(/Esc to focus/i);
await user.click(textarea);
await user.type(textarea, 'hello');
await user.keyboard('{Enter}');

await claude.emit(s.assistant('Hello!'));
await claude.emit(s.result());

expect(screen.getByText(/Hello!/)).toBeInTheDocument();
```

### Pattern 3: Verify client→server action via UI effect

Verify actions by their **observable effect** (state change, UI update), not by spying on socket.emit.
For fire-and-forget actions with no UI effect, verify click doesn't crash.

```typescript
// ✅ GOOD — verify action via state change
await user.click(screen.getByText('Yes'));
expect(screen.getByTestId('pending-count')).toHaveTextContent('0'); // pendingControls cleared

// ✅ GOOD — fire-and-forget, verify no crash
await user.click(screen.getByTitle('Stop subagent'));
expect(screen.getByTitle('Stop subagent')).toBeInTheDocument();

// ❌ BAD — socket.emit spy
expect(claude.socket.emit).toHaveBeenCalledWith('chat:stop_task', ...);
```

### ❌ NEVER use these patterns:

```typescript
// ❌ BAD — hand-construct fake socket
const fakeSocket = { on: vi.fn(), emit: vi.fn(), ... };

// ❌ BAD — mock callback without real socket
const onFetch = vi.fn().mockResolvedValue({ events: mockEvents });

// ❌ BAD — access serverSocket internals
(claude.socket as any).serverSocket.emit('event', data);

// ❌ BAD — client directly emit server events
claude.socket.emit('request_usage_update' as never, {}, () => {});

// ❌ BAD — addHandler is deprecated (use initialState or FakeClaude pipeline)
socket.addHandler('terminal:get_contents', () => ({ content: '...' }));

// ❌ BAD — setJoinResult is deprecated (use FakeClaude initialize)
socket.setJoinResult({ channelId: 'ch-1', state: 'idle' });

// ❌ BAD — createSocket() is deprecated (use createFakeSummoner().claude().socket)
import { createSocket } from '../../socket/client';
const socket = createSocket();
```

### When vi.fn() IS acceptable for callbacks

- **Pure UI callbacks** with no data flow: `onClose`, `onDismiss`, `onSelect(id)` — Mock (#6)
- **Callbacks the component just calls to notify parent**: not socket-based, no data returned
- If unsure: check if the callback wraps `socket.emit()` — if yes, use FakeClaude socket

## userEvent vs fireEvent

Always prefer `userEvent` — it simulates real user behavior (focus, keydown, keyup, input):

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.type(screen.getByRole('textbox'), 'hello');
await user.click(screen.getByRole('button'));
await user.keyboard('{Enter}');
```

Only use `fireEvent` for events `userEvent` doesn't support (e.g. `scroll`, `resize`).

## Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('calls onSubmit with input value', async () => {
    const onSubmit = vi.fn(); // dummy — we only verify it's called
    const user = userEvent.setup();

    render(<MyComponent onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox'), 'hello');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith('hello');
  });
});
```

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

## Packages

| Package | Purpose | Test Double Level |
|---------|---------|-------------------|
| `@testing-library/react` | `render`, `screen`, `renderHook` | — |
| `@testing-library/user-event` | Realistic user interaction simulation | — |
| `@testing-library/jest-dom` | DOM matchers (`toBeInTheDocument`, etc.) | — |
| `vitest` | Runner + `vi.fn()` / `vi.spyOn()` | Spy, Mock |
| `msw` | Network-level request interception | Proxy Mock (#3) |
| `storybook` | Visual testing + play functions | — |
| `react-error-boundary` | Error Boundary component | — |
