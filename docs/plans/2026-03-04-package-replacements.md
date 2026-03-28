# Package Replacements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace four hand-rolled implementations with well-maintained packages: `diff.parsePatch()` for DiffViewer parsers, zustand `persist` for localStorage in chat-store, `react-intersection-observer` for MessageList IntersectionObserver, and `use-debounce` for the custom `useDebouncedCallback` hook.

**Architecture:** TDD cycle for each task — write failing test, verify it fails, implement minimal code, verify it passes, commit. Existing expects must NOT be changed; only add new tests or update infrastructure.

**Tech Stack:** `diff` (already installed), `zustand/middleware` (already installed), `react-intersection-observer` (to install), `use-debounce` (to install)

---

## Task 1: Replace DiffViewer hand-rolled parsers with `diff.parsePatch()`

The four functions `isDiff`, `parseDiffFileName`, `parseHunkStart`, and `extractNewContent` in `DiffViewer.tsx` parse unified diff strings manually. The `diff` package (already a dependency) exports `parsePatch()` which does this correctly.

**Files:**
- Modify: `packages/client/src/components/DiffViewer.tsx`
- Modify: `packages/client/src/components/__tests__/DiffViewer.test.tsx` (add tests only)

**Step 1: Write failing tests for parsePatch-based helpers**

In `DiffViewer.test.tsx`, add these tests BEFORE touching implementation (existing tests must not change):

```typescript
// Add at top of file:
import { parsePatch } from 'diff';

describe('parsePatch integration', () => {
  const SAMPLE_DIFF = `--- a/src/foo.ts\n+++ b/src/foo.ts\n@@ -1,3 +1,3 @@\n line1\n-line2\n+line2_new\n line3\n`;

  it('parsePatch returns structured hunk data', () => {
    const [file] = parsePatch(SAMPLE_DIFF);
    expect(file.oldFileName).toBe('a/src/foo.ts');
    expect(file.newFileName).toBe('b/src/foo.ts');
    expect(file.hunks).toHaveLength(1);
    expect(file.hunks[0].lines).toContain('-line2');
    expect(file.hunks[0].lines).toContain('+line2_new');
  });

  it('parsePatch returns empty array for non-diff string', () => {
    expect(parsePatch('just some text')).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it passes (this is not testing our code yet — just verifying parsePatch API works)**

```bash
cd packages/client && npx vitest run src/components/__tests__/DiffViewer.test.tsx
```

Expected: new tests PASS (they just verify the library works).

**Step 3: Refactor DiffViewer.tsx to use parsePatch**

Replace the four hand-rolled functions with `parsePatch`-based equivalents:

```typescript
import { parsePatch } from 'diff';

// isDiff: check if parsePatch returns at least one file
function isDiff(content: string): boolean {
  try {
    return parsePatch(content).length > 0;
  } catch {
    return false;
  }
}

// parseDiffFileName: extract new filename from parsed result
function parseDiffFileName(content: string): string | null {
  try {
    const [file] = parsePatch(content);
    if (!file) return null;
    // parsePatch preserves "b/" prefix — strip it
    return file.newFileName?.replace(/^b\//, '') ?? null;
  } catch {
    return null;
  }
}

// extractNewContent: reconstruct new file content from hunks
function extractNewContent(content: string): string {
  try {
    const [file] = parsePatch(content);
    if (!file) return content;
    const lines: string[] = [];
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.startsWith('+')) lines.push(line.slice(1));
        else if (!line.startsWith('-')) lines.push(line.slice(1));
      }
    }
    return lines.join('\n');
  } catch {
    return content;
  }
}
```

Remove `parseHunkStart` (only used internally for line number display — use `hunk.newStart` and `hunk.newLines` directly from parsePatch result in the render logic).

**Step 4: Run all DiffViewer tests**

```bash
cd packages/client && npx vitest run src/components/__tests__/DiffViewer.test.tsx
```

Expected: all tests PASS.

**Step 5: Run full client test suite**

```bash
cd packages/client && npx vitest run
```

Expected: same pass count as before (no regressions).

**Step 6: Commit**

```bash
cd packages/client && git add src/components/DiffViewer.tsx src/components/__tests__/DiffViewer.test.tsx
git commit -m "refactor: replace hand-rolled diff parsers with diff.parsePatch()"
```

---

## Task 2: Replace chat-store direct localStorage with zustand `persist`

`chat-store.ts` calls `localStorage.getItem` / `localStorage.setItem` directly at two places:
- Line ~315: `onboarding_dismissed` read in initializer
- Line ~324: `review_upsell_dismissed` read/write in actions

Zustand `persist` middleware handles serialization, hydration, and SSR safety automatically.

**Files:**
- Modify: `packages/client/src/stores/chat-store.ts`
- Modify: `packages/client/src/stores/__tests__/chat-store.test.ts` (add tests only, if file exists; otherwise create)

**Step 1: Write failing tests that verify persist behavior**

Check if `packages/client/src/stores/__tests__/chat-store.test.ts` exists. If not, create it. Add:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('chat-store persist', () => {
  beforeEach(() => localStorageMock.clear());

  it('persists onboarding_dismissed to localStorage via zustand persist', async () => {
    const { useChatStore } = await import('../chat-store');
    useChatStore.getState().dismissOnboarding();
    // zustand persist writes to localStorage
    const raw = localStorage.getItem('cc-office-ui');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.onboardingDismissed).toBe(true);
  });

  it('hydrates onboarding_dismissed from localStorage on load', async () => {
    localStorage.setItem('cc-office-ui', JSON.stringify({
      state: { onboardingDismissed: true, reviewUpsellDismissed: false },
      version: 0,
    }));
    vi.resetModules();
    const { useChatStore } = await import('../chat-store');
    await new Promise(resolve => setTimeout(resolve, 0)); // wait for rehydration
    expect(useChatStore.getState().onboardingDismissed).toBe(true);
  });
});
```

**Step 2: Run to verify tests FAIL**

```bash
cd packages/client && npx vitest run src/stores/__tests__/chat-store.test.ts
```

Expected: FAIL — `onboardingDismissed` not in localStorage / store doesn't hydrate.

**Step 3: Implement zustand persist in chat-store.ts**

Wrap the store with `persist` middleware. Key changes:

```typescript
import { persist } from 'zustand/middleware';

// Identify which state slices to persist:
// - onboardingDismissed
// - reviewUpsellDismissed

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ... existing store definition unchanged ...
        onboardingDismissed: false,        // remove localStorage.getItem() initializer
        reviewUpsellDismissed: false,      // remove localStorage.getItem() initializer
        dismissOnboarding: () => {
          set({ onboardingDismissed: true }); // remove localStorage.setItem() call
        },
        dismissReviewUpsell: () => {
          set({ reviewUpsellDismissed: true }); // remove localStorage.setItem() call
        },
      }),
      {
        name: 'cc-office-ui',
        partialize: (state) => ({
          onboardingDismissed: state.onboardingDismissed,
          reviewUpsellDismissed: state.reviewUpsellDismissed,
        }),
      },
    ),
    { name: 'chat-store' },
  ),
);
```

Remove the two direct `localStorage.getItem` initializers and two `localStorage.setItem` calls.

**Step 4: Run persist tests**

```bash
cd packages/client && npx vitest run src/stores/__tests__/chat-store.test.ts
```

Expected: PASS.

**Step 5: Run full test suite**

```bash
cd packages/client && npx vitest run
```

Expected: no regressions.

**Step 6: Commit**

```bash
git add packages/client/src/stores/chat-store.ts packages/client/src/stores/__tests__/chat-store.test.ts
git commit -m "refactor: replace direct localStorage calls with zustand persist middleware"
```

---

## Task 3: Replace MessageList manual IntersectionObserver with `react-intersection-observer`

`MessageList.tsx` lines 64-72 contain:
```typescript
const observer = new IntersectionObserver(([entry]) => {
  setShowScrollButton(!entry.isIntersecting);
});
observer.observe(el);
return () => observer.disconnect();
```

`react-intersection-observer` provides a `useInView` hook with identical semantics.

**Files:**
- Modify: `packages/client/src/components/MessageList.tsx`
- Modify: `packages/client/src/components/__tests__/MessageList.test.tsx` (add tests only)

**Step 1: Install react-intersection-observer**

```bash
cd packages/client && pnpm add react-intersection-observer
```

**Step 2: Write failing test**

In `MessageList.test.tsx`, add a test that verifies scroll button visibility using `useInView` hook behavior. Since `react-intersection-observer` uses the native API under the hood, mock `IntersectionObserver`:

```typescript
it('shows scroll button when bottom sentinel is not in view', async () => {
  // The existing IntersectionObserver mock should trigger non-intersecting
  // This test verifies the hook integration works
  const { getByTestId } = render(<MessageList messages={[]} />);
  // Trigger intersection observer callback with isIntersecting: false
  const [callback] = (IntersectionObserver as jest.Mock).mock.calls[0];
  callback([{ isIntersecting: false }]);
  await waitFor(() => {
    expect(getByTestId('scroll-to-bottom')).toBeInTheDocument();
  });
});
```

**Step 3: Run to verify test exists and check current behavior**

```bash
cd packages/client && npx vitest run src/components/__tests__/MessageList.test.tsx
```

**Step 4: Replace IntersectionObserver in MessageList.tsx**

```typescript
import { useInView } from 'react-intersection-observer';

// Inside component, replace the useEffect with:
const { ref: bottomRef, inView } = useInView({ threshold: 0 });
const showScrollButton = !inView;

// Attach bottomRef to the sentinel element instead of the manual ref
<div ref={bottomRef} />
```

Remove the manual `useEffect` with `IntersectionObserver`.

**Step 5: Run tests**

```bash
cd packages/client && npx vitest run src/components/__tests__/MessageList.test.tsx
```

Expected: all tests PASS.

**Step 6: Run full test suite**

```bash
cd packages/client && npx vitest run
```

**Step 7: Commit**

```bash
git add packages/client/src/components/MessageList.tsx packages/client/src/components/__tests__/MessageList.test.tsx
git commit -m "refactor: replace manual IntersectionObserver with react-intersection-observer"
```

---

## Task 4: Replace custom `useDebouncedCallback` with `use-debounce`

The custom hook at `packages/client/src/hooks/useDebouncedCallback.ts` can be replaced with `useDebouncedCallback` from `use-debounce` (4.5M weekly downloads, updated Jan 2026).

**Files:**
- Delete: `packages/client/src/hooks/useDebouncedCallback.ts`
- Delete: `packages/client/src/hooks/__tests__/useDebouncedCallback.test.ts`
- Modify: `packages/client/src/components/ChatInput.tsx` — update import

**Step 1: Install use-debounce**

```bash
cd packages/client && pnpm add use-debounce
```

**Step 2: Verify use-debounce API matches**

`use-debounce` exports `useDebouncedCallback(callback, delay)` with identical signature. No test changes needed — `ChatInput.test.tsx` tests behavior through the component, not the hook directly.

**Step 3: Update import in ChatInput.tsx**

```typescript
// Before:
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

// After:
import { useDebouncedCallback } from 'use-debounce';
```

**Step 4: Run ChatInput tests**

```bash
cd packages/client && npx vitest run src/components/__tests__/ChatInput.test.tsx
```

Expected: all tests PASS (no behavior change).

**Step 5: Delete the custom hook files**

```bash
rm packages/client/src/hooks/useDebouncedCallback.ts
rm packages/client/src/hooks/__tests__/useDebouncedCallback.test.ts
```

**Step 6: Run full test suite**

```bash
cd packages/client && npx vitest run
```

Expected: same pass count (the deleted test file's 4 tests are gone, but all others pass).

**Step 7: Commit**

```bash
git add packages/client/src/components/ChatInput.tsx
git rm packages/client/src/hooks/useDebouncedCallback.ts packages/client/src/hooks/__tests__/useDebouncedCallback.test.ts
git commit -m "refactor: replace custom useDebouncedCallback with use-debounce package"
```

---

## Verification

After all 4 tasks:

```bash
cd packages/client && npx vitest run
```

All tests must pass.
