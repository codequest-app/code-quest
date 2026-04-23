# Test Templates — Reference

常用 test boilerplate 與 Fake 骨架。用到對應 pattern 時複製修改。

## Component Test Template

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('calls onSubmit with input value', async () => {
    const onSubmit = vi.fn(); // pure UI callback — OK to use vi.fn
    const user = userEvent.setup();

    render(<MyComponent onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith('hello');
  });
});
```

## Fake<BrowserAPI> Template

給瀏覽器 API（SpeechRecognition / IntersectionObserver / etc.）做 fake + beforeEach/afterEach setup。

```ts
// src/test/fake-speech-recognition.ts
import { afterEach, beforeEach } from 'vitest';

export class FakeSpeechRecognition {
  continuous = false;
  onresult: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = () => { FakeSpeechRecognition.instances.push(this); };
  stop = () => { this.onend?.(); };
  emit(entries: Array<{ isFinal: boolean; transcript: string }>) { /* ... */ }
  static instances: FakeSpeechRecognition[] = [];
}

export function setupSpeechRecognition(): void {
  beforeEach(() => {
    FakeSpeechRecognition.instances = [];
    (window as unknown as { SpeechRecognition: typeof FakeSpeechRecognition }).SpeechRecognition =
      FakeSpeechRecognition;
  });
  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });
}
```

Consumer：
```ts
setupSpeechRecognition();

it('x', async () => {
  // ... render, trigger
  FakeSpeechRecognition.instances.at(-1)?.emit([{ isFinal: true, transcript: 'hi' }]);
});
```

## Fake Component Template

當要隔離子元件、但需保留 prop 型別檢查時：

```tsx
// src/test/fake-compose-toolbar.tsx
import type { ComposeToolbarProps } from '../components/ComposeToolbar';

export function FakeComposeToolbar(props: ComposeToolbarProps) {
  return (
    <div data-testid="fake-toolbar" data-mode={props.mode}>
      {/* expose parent-passed props via data-* for assertions */}
    </div>
  );
}
```

Consumer：
```ts
vi.mock('./ComposeToolbar', () => ({ ComposeToolbar: FakeComposeToolbar }));
```

## Packages cheatsheet

| Package | Purpose | Double 層級 |
|---|---|---|
| `@testing-library/react` | `render` / `screen` / `renderHook` | — |
| `@testing-library/user-event` | 真實使用者互動模擬 | — |
| `@testing-library/jest-dom` | DOM matchers | — |
| `vitest` | Runner + `vi.fn()` / `vi.spyOn()` | Spy / Mock |
| `msw` | 網路層攔截 | Fake（proxy） |
| `storybook` | 視覺測試 + play function | — |
