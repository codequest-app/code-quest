# Chat UI v2 — AI Assistant Style Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the chat interface to follow AI assistant conventions — avatar + role labels, centered content column, collapsible tool/thinking messages, card-style input area.

**Architecture:** Refactor ChatMessage into composable sub-components (avatar row, collapsible blocks). Move layout centering (`max-w-3xl mx-auto`) into MessageList and ChatInput. ChatInput becomes a card-style container with Send button inside. MessageList gains consecutive-role grouping logic.

**Tech Stack:** React, Tailwind CSS v4, Vitest, @testing-library/react, Storybook 10

---

## Critical Files

| File | Action |
|---|---|
| `packages/client/src/App.css` | Add `--color-assistant-bg` token |
| `packages/client/src/components/ChatMessage.tsx` | Major rewrite — avatar, role label, collapsible blocks |
| `packages/client/src/components/__tests__/ChatMessage.test.tsx` | Update tests for new structure |
| `packages/client/src/components/ChatMessage.stories.tsx` | Update stories |
| `packages/client/src/components/MessageList.tsx` | Add `max-w-3xl mx-auto`, consecutive-role grouping, new empty state |
| `packages/client/src/components/__tests__/MessageList.test.tsx` | Update tests |
| `packages/client/src/components/MessageList.stories.tsx` | Update stories |
| `packages/client/src/components/ChatInput.tsx` | Card-style layout, Send inside card |
| `packages/client/src/components/__tests__/ChatInput.test.tsx` | Tests should still pass (behavior unchanged) |
| `packages/client/src/components/ChatInput.stories.tsx` | Update stories |
| `packages/client/src/components/ChatPanel.tsx` | Move ControlRequestBanner/StatsBar inside centered input area |
| `packages/client/src/components/__tests__/ChatPanel.test.tsx` | Tests should still pass |

---

### Task 1: Add `--color-assistant-bg` Token

**Files:**
- Modify: `packages/client/src/App.css`

**Step 1: Add token to @theme block**

After `--color-user-bg: #141928;` add:

```css
  --color-assistant-bg: #1a1528;
```

**Step 2: Verify build**

Run: `pnpm --filter client exec vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```
feat(client): add assistant-bg design token
```

---

### Task 2: ChatMessage — Rewrite with Avatar & Collapsible Blocks

**Files:**
- Modify: `packages/client/src/components/ChatMessage.tsx`
- Modify: `packages/client/src/components/__tests__/ChatMessage.test.tsx`

**Step 1: Update tests for new structure**

Replace the full content of `ChatMessage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Message } from '../../types/ui';
import { ChatMessage } from '../ChatMessage';

const base: Omit<Message, 'type' | 'content' | 'meta'> = {
  id: '1',
  role: 'assistant',
  timestamp: Date.now(),
};

describe('ChatMessage', () => {
  it('renders text message with markdown', () => {
    render(<ChatMessage message={{ ...base, type: 'text', content: 'Hello **world**' }} />);
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders role label for assistant', () => {
    render(<ChatMessage message={{ ...base, type: 'text', content: 'Hi' }} showAvatar />);
    expect(screen.getByText('Assistant')).toBeInTheDocument();
  });

  it('renders role label for user', () => {
    render(<ChatMessage message={{ ...base, role: 'user', type: 'text', content: 'Hi' }} showAvatar />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('hides avatar and label when showAvatar is false', () => {
    render(<ChatMessage message={{ ...base, type: 'text', content: 'Hi' }} showAvatar={false} />);
    expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
  });

  it('renders code blocks in text messages', () => {
    const { container } = render(
      <ChatMessage message={{ ...base, type: 'text', content: '```js\nconsole.log("hi")\n```' }} />,
    );
    expect(container.textContent).toContain('console');
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('renders thinking message as collapsible with label', () => {
    render(<ChatMessage message={{ ...base, type: 'thinking', content: 'Let me think...' }} />);
    expect(screen.getByText(/thought/i)).toBeInTheDocument();
  });

  it('expands thinking message on click', async () => {
    const user = userEvent.setup();
    render(<ChatMessage message={{ ...base, type: 'thinking', content: 'Let me think...' }} />);
    await user.click(screen.getByText(/thought/i));
    expect(screen.getByText('Let me think...')).toBeInTheDocument();
  });

  it('renders tool_use as collapsible with tool name', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_use',
          content: 'bash',
          meta: { toolId: 't1', input: { command: 'ls -la' } },
        }}
      />,
    );
    expect(screen.getByText(/bash/i)).toBeInTheDocument();
  });

  it('expands tool_use to show input on click', async () => {
    const user = userEvent.setup();
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_use',
          content: 'bash',
          meta: { toolId: 't1', input: { command: 'ls -la' } },
        }}
      />,
    );
    await user.click(screen.getByText(/bash/i));
    expect(screen.getByText(/ls -la/)).toBeInTheDocument();
  });

  it('renders tool_result as collapsible', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: 'file.txt\nREADME.md',
          meta: { toolId: 't1', name: 'bash' },
        }}
      />,
    );
    expect(screen.getByText(/result/i)).toBeInTheDocument();
  });

  it('renders error message (not collapsed)', () => {
    render(
      <ChatMessage
        message={{ ...base, role: 'system', type: 'error', content: 'Something broke' }}
      />,
    );
    const el = screen.getByText('Something broke');
    expect(el).toBeInTheDocument();
    expect(el.closest('[data-type="error"]')).toBeInTheDocument();
  });

  it('renders control_request message', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'control_request',
          content: 'bash',
          meta: { requestId: 'r1', input: { command: 'rm -rf /' } },
        }}
      />,
    );
    expect(screen.getByText(/bash/i)).toBeInTheDocument();
    expect(screen.getByText(/tool approval/i)).toBeInTheDocument();
  });

  it('renders user messages with user role styling', () => {
    render(<ChatMessage message={{ ...base, role: 'user', type: 'text', content: 'Hi there' }} />);
    const el = screen.getByText('Hi there');
    expect(el.closest('[data-role="user"]')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter client exec vitest run src/components/__tests__/ChatMessage.test.tsx`
Expected: FAIL — `showAvatar` prop doesn't exist yet

**Step 3: Rewrite ChatMessage implementation**

Replace the full content of `ChatMessage.tsx`:

```tsx
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types/ui';

interface ChatMessageProps {
  message: Message;
  showAvatar?: boolean;
}

const roleConfig = {
  user: { label: 'You', icon: '👤', bgClass: 'bg-user/20', textClass: 'text-user' },
  assistant: { label: 'Assistant', icon: '✦', bgClass: 'bg-assistant/20', textClass: 'text-assistant' },
  system: { label: 'System', icon: '⚙', bgClass: 'bg-text-muted/20', textClass: 'text-text-muted' },
};

function CollapsibleBlock({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer select-none text-sm text-text-muted hover:text-text transition-colors py-1">
        <span>{icon}</span>
        <span>{label}</span>
        <span className="text-xs opacity-50 group-open:rotate-90 transition-transform">▶</span>
      </summary>
      <div className="mt-2 pl-6">{children}</div>
    </details>
  );
}

function TextContent({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className ?? '');
          const code = String(children).replace(/\n$/, '');
          if (match) {
            return (
              <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
                {code}
              </SyntaxHighlighter>
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </Markdown>
  );
}

function ThinkingContent({ content }: { content: string }) {
  return (
    <CollapsibleBlock icon="💭" label="Thought">
      <p className="text-sm text-text-muted italic">{content}</p>
    </CollapsibleBlock>
  );
}

function ToolUseContent({ content, meta }: { content: string; meta?: Record<string, unknown> }) {
  const input = meta?.input;
  return (
    <CollapsibleBlock icon="⚙" label={content}>
      {input != null && (
        <pre className="bg-code-block p-3 rounded-lg overflow-x-auto text-[13px] font-mono border border-border">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </CollapsibleBlock>
  );
}

function ToolResultContent({ content }: { content: string }) {
  return (
    <CollapsibleBlock icon="✓" label="Result">
      <pre className="bg-code-block p-3 rounded-lg overflow-x-auto text-[13px] font-mono border border-border">
        {content}
      </pre>
    </CollapsibleBlock>
  );
}

function ControlRequestContent({ content }: { content: string }) {
  return (
    <div className="bg-warning-bg border-l-2 border-l-warning px-4 py-2.5 rounded-r-lg">
      <strong className="text-warning text-sm">⚠ Tool Approval: {content}</strong>
    </div>
  );
}

function ErrorContent({ content }: { content: string }) {
  return (
    <div className="text-danger bg-danger-bg rounded-lg px-4 py-3 border border-danger/20" data-type="error">
      {content}
    </div>
  );
}

export function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const config = roleConfig[message.role] ?? roleConfig.system;

  let body: React.ReactNode;
  switch (message.type) {
    case 'text':
      body = <TextContent content={message.content} />;
      break;
    case 'thinking':
      body = <ThinkingContent content={message.content} />;
      break;
    case 'tool_use':
      body = <ToolUseContent content={message.content} meta={message.meta} />;
      break;
    case 'tool_result':
      body = <ToolResultContent content={message.content} />;
      break;
    case 'error':
      body = <ErrorContent content={message.content} />;
      break;
    case 'control_request':
      body = <ControlRequestContent content={message.content} />;
      break;
    default:
      body = <p>{message.content}</p>;
  }

  // Avatar column width for alignment
  const avatarColWidth = 'w-7';

  return (
    <div
      className="leading-relaxed text-sm"
      data-role={message.role}
      data-type={message.type}
    >
      {showAvatar ? (
        <div className="flex gap-3">
          <div className={`${avatarColWidth} shrink-0 pt-0.5`}>
            <div className={`w-7 h-7 rounded-md ${config.bgClass} flex items-center justify-center text-sm`}>
              {config.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-semibold ${config.textClass}`}>{config.label}</span>
            <div className="mt-1" data-type={message.type === 'text' ? 'text' : undefined}>
              {body}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className={`${avatarColWidth} shrink-0`} />
          <div className="flex-1 min-w-0" data-type={message.type === 'text' ? 'text' : undefined}>
            {body}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter client exec vitest run src/components/__tests__/ChatMessage.test.tsx`
Expected: All tests pass

**Step 5: Commit**

```
refactor(client): rewrite ChatMessage with avatar, role labels, and collapsible blocks
```

---

### Task 3: ChatMessage Stories Update

**Files:**
- Modify: `packages/client/src/components/ChatMessage.stories.tsx`

**Step 1: Update stories for new props**

Replace the full content of `ChatMessage.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Message } from '../types/ui';
import { ChatMessage } from './ChatMessage';

const base: Omit<Message, 'type' | 'content' | 'meta'> = {
  id: '1',
  role: 'assistant',
  timestamp: Date.now(),
};

const meta = {
  component: ChatMessage,
  tags: ['autodocs'],
  args: { showAvatar: true },
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-bg text-text p-6 font-sans">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserText: Story = {
  args: {
    message: { ...base, role: 'user', type: 'text', content: 'Can you help me fix this bug?' },
  },
};

export const AssistantText: Story = {
  args: {
    message: { ...base, type: 'text', content: 'Hello **world**! Here is `inline code`.' },
  },
};

export const TextWithCodeBlock: Story = {
  args: {
    message: {
      ...base,
      type: 'text',
      content: 'Here is some code:\n\n```typescript\nconst x: number = 42;\nconsole.log(x);\n```\n\nDone!',
    },
  },
};

export const Thinking: Story = {
  args: {
    message: {
      ...base,
      type: 'thinking',
      content: 'Let me analyze the requirements and think through the approach...',
    },
  },
};

export const ToolUse: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_use',
      content: 'bash',
      meta: { toolId: 't1', input: { command: 'ls -la /home' } },
    },
  },
};

export const ToolResult: Story = {
  args: {
    message: {
      ...base,
      type: 'tool_result',
      content: 'total 12\ndrwxr-xr-x 3 user user 4096 Jan 1 00:00 .\ndrwxr-xr-x 5 root root 4096 Jan 1 00:00 ..',
      meta: { toolId: 't1', name: 'bash' },
    },
  },
};

export const ErrorMessage: Story = {
  args: {
    message: { ...base, role: 'system', type: 'error', content: 'Connection lost: server unreachable' },
  },
};

export const ControlRequest: Story = {
  args: {
    message: {
      ...base,
      type: 'control_request',
      content: 'bash',
      meta: { requestId: 'r1', input: { command: 'rm -rf /tmp/old' } },
    },
  },
};

export const WithoutAvatar: Story = {
  args: {
    showAvatar: false,
    message: { ...base, type: 'text', content: 'This is a consecutive message without avatar.' },
  },
};
```

**Step 2: Commit**

```
feat(client): update ChatMessage stories for avatar and collapsible design
```

---

### Task 4: MessageList — Centered Layout, Consecutive Grouping, Empty State

**Files:**
- Modify: `packages/client/src/components/__tests__/MessageList.test.tsx`
- Modify: `packages/client/src/components/MessageList.tsx`

**Step 1: Update tests**

Replace the full content of `MessageList.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import type { Message } from '../../types/ui';
import { MessageList } from '../MessageList';

const messages: Message[] = [
  { id: '1', role: 'user', type: 'text', content: 'Hello', timestamp: 1 },
  { id: '2', role: 'assistant', type: 'text', content: 'Hi there', timestamp: 2 },
  { id: '3', role: 'system', type: 'error', content: 'Oops', timestamp: 3 },
];

describe('MessageList', () => {
  it('renders all messages', () => {
    render(<MessageList messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi there/)).toBeInTheDocument();
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('renders empty state with welcome text when no messages', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText(/how can i help/i)).toBeInTheDocument();
  });

  it('shows avatar on first message of a role group', () => {
    render(<MessageList messages={messages} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
  });

  it('hides avatar on consecutive same-role messages', () => {
    const consecutive: Message[] = [
      { id: '1', role: 'assistant', type: 'text', content: 'First', timestamp: 1 },
      { id: '2', role: 'assistant', type: 'tool_use', content: 'bash', meta: { toolId: 't1', input: {} }, timestamp: 2 },
      { id: '3', role: 'assistant', type: 'text', content: 'Second', timestamp: 3 },
    ];
    render(<MessageList messages={consecutive} />);
    // Only one "Assistant" label should appear
    const labels = screen.getAllByText('Assistant');
    expect(labels).toHaveLength(1);
  });

  it('auto-scrolls to bottom', () => {
    render(<MessageList messages={messages} />);
    const list = screen.getByTestId('message-list');
    expect(list).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter client exec vitest run src/components/__tests__/MessageList.test.tsx`
Expected: FAIL — empty state text doesn't match, no consecutive grouping

**Step 3: Rewrite MessageList implementation**

Replace the full content of `MessageList.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import type { Message } from '../types/ui';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" data-testid="message-list">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center select-none gap-3">
          <span className="text-4xl text-assistant">✦</span>
          <span className="text-lg font-medium text-text-bright">CC Office</span>
          <span className="text-sm text-text-muted">How can I help you today?</span>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-4">
          {messages.map((msg, i) => {
            const prevRole = i > 0 ? messages[i - 1].role : null;
            const showAvatar = msg.role !== prevRole;
            return (
              <div key={msg.id} className={showAvatar && i > 0 ? 'pt-6 border-t border-border/30 mt-6' : 'mt-1'}>
                <ChatMessage message={msg} showAvatar={showAvatar} />
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter client exec vitest run src/components/__tests__/MessageList.test.tsx`
Expected: All tests pass

**Step 5: Commit**

```
refactor(client): MessageList with centered layout, role grouping, and new empty state
```

---

### Task 5: MessageList Stories Update

**Files:**
- Modify: `packages/client/src/components/MessageList.stories.tsx`

**Step 1: Update stories**

Replace the full content of `MessageList.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Message } from '../types/ui';
import { MessageList } from './MessageList';

const conversation: Message[] = [
  { id: '1', role: 'user', type: 'text', content: 'How do I list files?', timestamp: 1 },
  { id: '2', role: 'assistant', type: 'thinking', content: 'The user wants to list files in a directory...', timestamp: 2 },
  { id: '3', role: 'assistant', type: 'tool_use', content: 'bash', meta: { toolId: 't1', input: { command: 'ls -la' } }, timestamp: 3 },
  { id: '4', role: 'assistant', type: 'tool_result', content: 'total 8\n-rw-r--r-- 1 user user 123 Jan 1 main.ts\n-rw-r--r-- 1 user user 456 Jan 1 README.md', meta: { toolId: 't1', name: 'bash' }, timestamp: 4 },
  { id: '5', role: 'assistant', type: 'text', content: 'Here are the files:\n\n- `main.ts`\n- `README.md`', timestamp: 5 },
  { id: '6', role: 'user', type: 'text', content: 'Thanks! Can you read main.ts?', timestamp: 6 },
  { id: '7', role: 'assistant', type: 'text', content: 'Sure, let me read it for you.', timestamp: 7 },
];

const meta = {
  component: MessageList,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="h-[500px] bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { messages: [] },
};

export const Conversation: Story = {
  args: { messages: conversation },
};

export const WithError: Story = {
  args: {
    messages: [
      ...conversation,
      { id: '8', role: 'system', type: 'error', content: 'Connection lost', timestamp: 8 },
    ],
  },
};
```

**Step 2: Commit**

```
feat(client): update MessageList stories for v2 design
```

---

### Task 6: ChatInput — Card-Style Layout with Send Inside

**Files:**
- Modify: `packages/client/src/components/__tests__/ChatInput.test.tsx`
- Modify: `packages/client/src/components/ChatInput.tsx`

**Step 1: Run existing tests to confirm baseline**

Run: `pnpm --filter client exec vitest run src/components/__tests__/ChatInput.test.tsx`
Expected: All 6 tests pass (no test changes needed — behavior is the same)

**Step 2: Rewrite ChatInput layout**

Replace the full content of `ChatInput.tsx`:

```tsx
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <div className="shrink-0 bg-surface border-t border-border">
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div
          className={`rounded-xl bg-bg border transition-all ${
            focused ? 'border-accent glow-accent-ring' : 'border-border'
          }`}
          onClick={() => textareaRef.current?.focus()}
          onKeyDown={() => {}}
          role="presentation"
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            placeholder="Type a message..."
            rows={3}
            className="w-full bg-transparent text-text px-4 pt-3 pb-1 text-sm resize-none focus:outline-none disabled:opacity-50 placeholder:text-text-muted"
          />
          <div className="flex justify-end px-3 pb-3">
            <button
              type="button"
              onClick={submit}
              disabled={disabled}
              className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm font-medium cursor-pointer transition-all hover:glow-accent-lg hover:-translate-y-px active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm --filter client exec vitest run src/components/__tests__/ChatInput.test.tsx`
Expected: All 6 tests pass

**Step 4: Commit**

```
refactor(client): ChatInput card-style layout with Send inside
```

---

### Task 7: ChatInput Stories Update

**Files:**
- Modify: `packages/client/src/components/ChatInput.stories.tsx`

**Step 1: Update stories**

Replace the full content of `ChatInput.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ChatInput } from './ChatInput';

const meta = {
  component: ChatInput,
  tags: ['autodocs'],
  args: {
    onSend: fn(),
    disabled: false,
  },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const SubmitViaButton: Story = {
  play: async ({ args, canvas, step }) => {
    await step('Type and submit', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'hello world');
      await userEvent.click(canvas.getByRole('button', { name: /send/i }));
    });

    await expect(args.onSend).toHaveBeenCalledWith('hello world');
    await expect(canvas.getByRole('textbox')).toHaveValue('');
  },
};

export const SubmitViaEnter: Story = {
  play: async ({ args, canvas, step }) => {
    await step('Type and press Enter', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'hi{Enter}');
    });

    await expect(args.onSend).toHaveBeenCalledWith('hi');
  },
};

export const ShiftEnterNewline: Story = {
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole('textbox');
    await userEvent.type(textarea, 'line1{Shift>}{Enter}{/Shift}line2');
    await expect(args.onSend).not.toHaveBeenCalled();
  },
};
```

**Step 2: Commit**

```
feat(client): update ChatInput stories for card-style design
```

---

### Task 8: ChatPanel — Move Banner & Stats into Centered Input Area

**Files:**
- Modify: `packages/client/src/components/ChatPanel.tsx`

**Step 1: Run existing ChatPanel tests to confirm baseline**

Run: `pnpm --filter client exec vitest run src/components/__tests__/ChatPanel.test.tsx`
Expected: All 8 tests pass

**Step 2: Update ChatPanel layout**

Replace the full content of `ChatPanel.tsx`:

```tsx
import { useEffect } from 'react';
import { useChat } from '../hooks/use-chat';
import type { TypedSocket } from '../socket/client';
import { useChatStore } from '../stores/chat-store';
import { ChatInput } from './ChatInput';
import { ControlRequestBanner } from './ControlRequestBanner';
import { HeaderBar } from './HeaderBar';
import { MessageList } from './MessageList';
import { StatsBar } from './StatsBar';

interface ChatPanelProps {
  socket: TypedSocket;
}

export function ChatPanel({ socket }: ChatPanelProps) {
  const { createSession, sendMessage, respondToControl } = useChat(socket);
  const messages = useChatStore((s) => s.messages);
  const status = useChatStore((s) => s.status);
  const sessionId = useChatStore((s) => s.sessionId);
  const pendingControl = useChatStore((s) => s.pendingControl);
  const stats = useChatStore((s) => s.stats);

  useEffect(() => {
    createSession();
  }, [createSession]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <HeaderBar status={status} sessionId={sessionId} />
      <MessageList messages={messages} />
      <div className="shrink-0 bg-surface border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex flex-col gap-3">
          <ControlRequestBanner pending={pendingControl} onRespond={respondToControl} />
          <ChatInput onSend={sendMessage} disabled={status === 'processing'} />
          <StatsBar stats={stats} />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Update ChatInput to remove its own outer wrapper**

Since ChatPanel now provides the outer wrapper, ChatInput should only render the card.

Replace the full content of `ChatInput.tsx`:

```tsx
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <div
      className={`rounded-xl bg-bg border transition-all ${
        focused ? 'border-accent glow-accent-ring' : 'border-border'
      }`}
      onClick={() => textareaRef.current?.focus()}
      onKeyDown={() => {}}
      role="presentation"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        placeholder="Type a message..."
        rows={3}
        className="w-full bg-transparent text-text px-4 pt-3 pb-1 text-sm resize-none focus:outline-none disabled:opacity-50 placeholder:text-text-muted"
      />
      <div className="flex justify-end px-3 pb-3">
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm font-medium cursor-pointer transition-all hover:glow-accent-lg hover:-translate-y-px active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Also remove `mx-4 mb-2` from ControlRequestBanner since parent handles spacing**

In `ControlRequestBanner.tsx`, change the outer div className from:
```
flex items-center justify-between bg-warning-bg border border-warning/30 rounded-md px-4 py-2.5 mx-4 mb-2
```
to:
```
flex items-center justify-between bg-warning-bg border border-warning/30 rounded-md px-4 py-2.5
```

**Step 5: Run all tests**

Run: `pnpm --filter client exec vitest run`
Expected: All tests pass

**Step 6: Commit**

```
refactor(client): ChatPanel centered input area with banner and stats
```

---

### Task 9: Update All Remaining Stories for Layout Context

**Files:**
- Modify: `packages/client/src/components/ChatInput.stories.tsx`
- Modify: `packages/client/src/components/ControlRequestBanner.stories.tsx`
- Modify: `packages/client/src/components/StatsBar.stories.tsx`

**Step 1: Update ChatInput stories decorator**

Since ChatInput no longer has its own outer wrapper, update the decorator to provide context:

```tsx
  decorators: [
    (Story) => (
      <div className="bg-surface text-text p-6">
        <div className="max-w-3xl">
          <Story />
        </div>
      </div>
    ),
  ],
```

**Step 2: Update ControlRequestBanner stories decorator**

```tsx
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
```

**Step 3: Commit**

```
chore(client): update stories decorators for v2 layout context
```

---

### Task 10: Full Verification

**Step 1: Run all tests**

Run: `pnpm --filter client exec vitest run`
Expected: All tests pass (62+)

**Step 2: Type check**

Run: `pnpm --filter client exec tsc --noEmit`
Expected: No errors

**Step 3: Verify no hardcoded hex in components**

Run: `grep -r '#[0-9a-fA-F]\{3,8\}' packages/client/src/components/ --include='*.tsx' | grep -v stories | grep -v test`
Expected: No output

**Step 4: Commit if any fixes needed**

---

## Verification Checklist

1. `pnpm --filter client exec vitest run` — all tests pass
2. `pnpm --filter client exec tsc --noEmit` — no type errors
3. `pnpm dev` — visual check: centered layout, avatars, collapsible tools, card input
4. No hardcoded hex in components
