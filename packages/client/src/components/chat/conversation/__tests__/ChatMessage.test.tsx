import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Message } from '../../../../types/ui';
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

  it('renders assistant message without avatar badge', () => {
    render(<ChatMessage message={{ ...base, type: 'text', content: 'Hi' }} showAvatar />);
    expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('renders user message as inline pill', () => {
    render(
      <ChatMessage message={{ ...base, role: 'user', type: 'text', content: 'Hi' }} showAvatar />,
    );
    expect(screen.queryByText('You')).not.toBeInTheDocument();
    expect(screen.getByText('Hi').closest('[data-role="user"]')).toBeInTheDocument();
  });

  it('renders message content regardless of showAvatar', () => {
    render(<ChatMessage message={{ ...base, type: 'text', content: 'Hi' }} showAvatar={false} />);
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('user typed text renders plain (no markdown parsing)', () => {
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          role: 'user',
          type: 'text',
          content: '**not bold** 1. a 2. b',
          meta: { source: 'typed' },
        }}
      />,
    );
    expect(container.querySelector('strong')).toBeNull();
    expect(container.querySelector('[data-role="user"] ol')).toBeNull();
    expect(container.textContent).toContain('**not bold** 1. a 2. b');
  });

  it('user skill-body text renders markdown', () => {
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          role: 'user',
          type: 'text',
          content: '# Heading\n\n**bold** text',
          meta: { source: 'skill' },
        }}
      />,
    );
    expect(container.querySelector('h1')?.textContent).toBe('Heading');
    expect(container.querySelector('strong')?.textContent).toBe('bold');
  });

  it('user command text renders nothing', () => {
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          role: 'user',
          type: 'text',
          content: '<command-message>foo</command-message>',
          meta: { source: 'command' },
        }}
      />,
    );
    expect(container.textContent).not.toContain('command-message');
  });

  it('user reminder text renders nothing', () => {
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          role: 'user',
          type: 'text',
          content: '<system-reminder>nag</system-reminder>',
          meta: { source: 'reminder' },
        }}
      />,
    );
    expect(container.textContent).not.toContain('nag');
  });

  it('assistant text message has a copy button that copies the text content', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<ChatMessage message={{ ...base, type: 'text', content: 'Hello **world**' }} />);
    const btn = screen.queryByLabelText('message-copy');
    expect(btn).not.toBeNull();
    if (btn) await user.click(btn as HTMLElement);
    expect(writeText).toHaveBeenCalled();
    expect(String(writeText.mock.calls[0]![0])).toContain('Hello');
  });

  it('assistant copy uses raw message.content (not DOM textContent)', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const content = 'line one\n\n**bold** line';
    render(<ChatMessage message={{ ...base, type: 'text', content }} />);
    const btn = screen.queryByLabelText('message-copy');
    if (btn) await user.click(btn as HTMLElement);
    expect(writeText).toHaveBeenCalledWith(content);
  });

  it('user text message does NOT render a separate copy button (available via actions menu)', () => {
    render(
      <ChatMessage
        message={{ ...base, role: 'user', type: 'text', content: 'hi', meta: { source: 'typed' } }}
      />,
    );
    expect(screen.queryByLabelText('message-copy')).toBeNull();
  });

  it('system error message does NOT render a message-level copy button', () => {
    render(
      <ChatMessage
        message={{ ...base, role: 'system', type: 'error', content: 'Something broke' }}
      />,
    );
    expect(screen.queryByLabelText('message-copy')).toBeNull();
  });

  it('tool_use message does NOT render a message-level copy button', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_use',
          content: 'Bash',
          meta: { toolId: 't1', input: { command: 'ls' } },
        }}
      />,
    );
    expect(screen.queryByLabelText('message-copy')).toBeNull();
  });

  it('thinking message has no copy button (Copy is not meaningful for thoughts)', () => {
    render(<ChatMessage message={{ ...base, type: 'thinking', content: 'reasoning...' }} />);
    expect(screen.queryByLabelText('message-copy')).toBeNull();
  });

  it('empty-body thinking message renders nothing at all', () => {
    const { container } = render(
      <ChatMessage message={{ ...base, type: 'thinking', content: '' }} />,
    );
    // No wrapper, no copy button, nothing.
    expect(container.querySelector('[data-role="assistant"]')).toBeNull();
    expect(screen.queryByLabelText('message-copy')).toBeNull();
  });

  it('non-empty thinking still renders its block (happy path)', () => {
    render(<ChatMessage message={{ ...base, type: 'thinking', content: 'Hmm, let me see' }} />);
    // ThinkingBlock summary label shows either "Thinking" or "Thought for Ns"
    expect(screen.getByText(/Thinking|Thought for/)).toBeInTheDocument();
  });

  it('tool_result message does NOT render a message-level copy button', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: 'output',
          meta: { toolId: 't1', name: 'Bash' },
        }}
      />,
    );
    expect(screen.queryByLabelText('message-copy')).toBeNull();
  });

  it('assistant text unaffected by meta.source', () => {
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          type: 'text',
          content: '**bold**',
          meta: { source: 'typed' } as never,
        }}
      />,
    );
    expect(container.querySelector('strong')?.textContent).toBe('bold');
  });

  it('renders code blocks in text messages', () => {
    const { container } = render(
      <ChatMessage message={{ ...base, type: 'text', content: '```js\nconsole.log("hi")\n```' }} />,
    );
    expect(container.textContent).toContain('console');
    expect(container.querySelector('[class*="language-js"]')).toBeInTheDocument();
  });

  it('renders thinking message as collapsible with label', () => {
    render(<ChatMessage message={{ ...base, type: 'thinking', content: 'Let me think...' }} />);
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it('expands thinking message on click', async () => {
    const user = userEvent.setup();
    render(<ChatMessage message={{ ...base, type: 'thinking', content: 'Let me think...' }} />);
    await user.click(screen.getByText(/thinking/i));
    expect(screen.getByText('Let me think...')).toBeInTheDocument();
  });

  it('renders thinking content as markdown', async () => {
    const { container } = render(
      <ChatMessage message={{ ...base, type: 'thinking', content: 'This is **bold** thinking' }} />,
    );
    // ThinkingBlock renders MarkdownContent in DOM (CSS-hidden when collapsed)
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('strong')?.textContent).toBe('bold');
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

  it('Skill tool output renders as markdown after expand', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_use',
          content: 'Skill',
          meta: {
            toolId: 't1',
            input: { skill: 'opsx:propose' },
            result: { content: 'Hi **world**\n\n- a\n- b', is_error: false },
          },
        }}
      />,
    );
    await user.click(screen.getByText(/skill/i));
    expect(container.querySelector('strong')?.textContent).toBe('world');
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('Skill tool without result shows skill id and running indicator', async () => {
    const user = userEvent.setup();
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_use',
          content: 'Skill',
          meta: { toolId: 't1', input: { skill: 'opsx:propose' } },
        }}
      />,
    );
    await user.click(screen.getByText(/skill/i));
    expect(screen.getByText(/opsx:propose/)).toBeInTheDocument();
    expect(screen.getByText(/running/i)).toBeInTheDocument();
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

  it('renders pending_action message', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'pending_action',
          content: 'bash',
          meta: { requestId: 'r1', input: { command: 'rm -rf /' } },
        }}
      />,
    );
    expect(screen.getByText(/bash/i)).toBeInTheDocument();
    expect(screen.getByText(/tool approval/i)).toBeInTheDocument();
  });

  it('renders streamlined_text as text with fast-mode indicator', () => {
    render(
      <ChatMessage
        message={{ ...base, type: 'streamlined_text', content: 'streamed output here' }}
      />,
    );
    expect(screen.getByText('streamed output here')).toBeInTheDocument();
    expect(screen.getByText('fast mode')).toBeInTheDocument();
  });

  it('renders streamlined_tool_use_summary as collapsible', () => {
    render(
      <ChatMessage
        message={{ ...base, type: 'streamlined_tool_use_summary', content: 'Read file.txt → ok' }}
      />,
    );
    expect(screen.getByText(/tool summary/i)).toBeInTheDocument();
  });

  it('renders compact_boundary as visual separator', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'compact_boundary',
          content: 'Context was compressed',
        }}
      />,
    );
    expect(screen.getByText(/compressed/i)).toBeInTheDocument();
  });

  it('renders tool_use with partialInput preview', async () => {
    const user = userEvent.setup();
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_use',
          content: 'Write',
          meta: { toolId: 't1', input: {}, partialInput: '{"file_path":"src/m' },
        }}
      />,
    );
    await user.click(screen.getByText(/Write/i));
    expect(screen.getByText(/src\/m/)).toBeInTheDocument();
  });

  it.each([
    { content: 'Approved: Read', expectedIcon: '✓', desc: 'approved' },
    { content: 'Allowed Always: Read', expectedIcon: '✓✓', desc: 'allowed always' },
    { content: 'Denied: Bash', expectedIcon: '✗', desc: 'denied' },
    { content: 'Denied & Stopped: Write', expectedIcon: '⊘', desc: 'denied & stopped' },
    { content: 'Cancelled: Bash', expectedIcon: '↩', desc: 'cancelled' },
  ])('renders action_result with $desc styling', ({ content, expectedIcon }) => {
    render(<ChatMessage message={{ ...base, role: 'user', type: 'action_result', content }} />);
    expect(screen.getByText(`${expectedIcon} ${content}`)).toBeInTheDocument();
  });

  it('renders result stats inline', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'result',
          content: '',
          meta: {
            stats: {
              costUsd: 0.05,
              durationMs: 1234,
              inputTokens: 100,
              outputTokens: 50,
              numTurns: 3,
            },
          },
        }}
      />,
    );
    expect(screen.getByText('$0.0500')).toBeInTheDocument();
    expect(screen.getByText('1.2s')).toBeInTheDocument();
    expect(screen.getByText('↑100')).toBeInTheDocument();
    expect(screen.getByText('↓50')).toBeInTheDocument();
    expect(screen.getByText('3 turns')).toBeInTheDocument();
  });

  it('renders result with no stats gracefully', () => {
    const { container } = render(
      <ChatMessage
        message={{ ...base, role: 'system', type: 'result', content: '', meta: { stats: {} } }}
      />,
    );
    expect(container.querySelector('[data-type="result"]')).toBeInTheDocument();
  });

  it('renders rate_limit_event message', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'rate_limit_event',
          content: 'Rate limit: limited',
          meta: { rateLimitInfo: { status: 'limited', rateLimitType: 'requests' } },
        }}
      />,
    );
    expect(screen.getByText(/Rate limit: limited/)).toBeInTheDocument();
    expect(screen.getByText(/requests/)).toBeInTheDocument();
  });

  it('renders hook_started message', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'hook_started',
          content: 'PreToolUse:check',
          meta: { hookId: 'h1', hookEvent: 'PreToolUse' },
        }}
      />,
    );
    expect(screen.getByText(/Running hook: PreToolUse:check/)).toBeInTheDocument();
  });

  it('renders hook_response message with output', async () => {
    const user = userEvent.setup();
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'hook_response',
          content: 'PreToolUse:check',
          meta: { hookId: 'h1', hookEvent: 'PreToolUse', output: 'hook output' },
        }}
      />,
    );
    await user.click(screen.getByText(/Hook done: PreToolUse:check/));
    expect(screen.getByText('hook output')).toBeInTheDocument();
  });

  it('renders unknown_delta as collapsible', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'unknown_delta',
          content: 'Unknown delta: future_delta',
          meta: { deltaType: 'future_delta', data: { foo: 'bar' } },
        }}
      />,
    );
    expect(screen.getByText(/Unknown delta: future_delta/)).toBeInTheDocument();
  });

  it('renders raw_event as collapsible', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'raw_event',
          content: 'Raw: some_type',
          meta: { rawType: 'some_type', data: { key: 'val' } },
        }}
      />,
    );
    expect(screen.getByText(/Raw: some_type/)).toBeInTheDocument();
  });

  it('renders diff content with colored lines', async () => {
    const user = userEvent.setup();
    const diffContent = [
      '--- a/file.txt',
      '+++ b/file.txt',
      '@@ -1,3 +1,3 @@',
      '-old line',
      '+new line',
      ' same line',
      ' extra line',
    ].join('\n');
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: diffContent,
          meta: { toolId: 't1', name: 'Edit' },
        }}
      />,
    );
    await user.click(screen.getByText(/result/i));
    const pre = container.querySelector('pre');
    expect(pre?.querySelector('.text-success')?.textContent).toContain('+new line');
    expect(pre?.querySelector('.text-danger')?.textContent).toContain('-old line');
    expect(pre?.querySelector('.text-accent')?.textContent).toContain('@@ -1,3 +1,3 @@');
  });

  it('renders diff with filename header', async () => {
    const user = userEvent.setup();
    const diffContent = [
      '--- a/src/main.ts',
      '+++ b/src/main.ts',
      '@@ -1,1 +1,1 @@',
      '-old',
      '+new',
    ].join('\n');
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: diffContent,
          meta: { toolId: 't1', name: 'Edit' },
        }}
      />,
    );
    await user.click(screen.getByText(/result/i));
    expect(screen.getByLabelText('diff-filename')).toHaveTextContent('src/main.ts');
  });

  it('renders diff with line numbers', async () => {
    const user = userEvent.setup();
    const diffContent = ['@@ -10,1 +10,1 @@', '-old', '+new'].join('\n');
    const { container } = render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: diffContent,
          meta: { toolId: 't1', name: 'Edit' },
        }}
      />,
    );
    await user.click(screen.getByText(/result/i));
    // Line numbers should be present in gutter spans
    const gutters = container.querySelectorAll('.text-text-muted\\/40');
    expect(gutters.length).toBeGreaterThan(0);
  });

  it('renders diff without --- +++ headers gracefully', async () => {
    const user = userEvent.setup();
    const diffContent = ['@@ -1,2 +1,2 @@', '-old', '+new'].join('\n');
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: diffContent,
          meta: { toolId: 't1', name: 'Edit' },
        }}
      />,
    );
    await user.click(screen.getByText(/result/i));
    expect(screen.queryByLabelText('diff-filename')).not.toBeInTheDocument();
  });

  it('renders ANSI colored output in tool_result', async () => {
    const user = userEvent.setup();
    const ansiContent = 'normal \x1b[32mgreen text\x1b[0m end';
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: ansiContent,
          meta: { toolId: 't1', name: 'bash' },
        }}
      />,
    );
    await user.click(screen.getByText(/result/i));
    const container = screen.getByLabelText('ansi-content');
    expect(container).toBeInTheDocument();
    // Should render green text with color styling, not raw escape codes
    expect(container.textContent).toContain('green text');
    expect(container.textContent).not.toContain('\x1b[');
    expect(container.querySelector('span[style]')).not.toBeNull();
  });

  it('renders plain tool_result without ANSI as plain pre', async () => {
    const user = userEvent.setup();
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: 'plain output text',
          meta: { toolId: 't1', name: 'bash' },
        }}
      />,
    );
    await user.click(screen.getByText(/result/i));
    expect(screen.queryByLabelText('ansi-content')).not.toBeInTheDocument();
    expect(screen.getByText('plain output text')).toBeInTheDocument();
  });

  it('renders ANSI with multiple colors', async () => {
    const user = userEvent.setup();
    const ansiContent = '\x1b[31mred\x1b[0m \x1b[34mblue\x1b[0m';
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: ansiContent,
          meta: { toolId: 't1', name: 'bash' },
        }}
      />,
    );
    await user.click(screen.getByText(/result/i));
    const container = screen.getByLabelText('ansi-content');
    expect(container.textContent).toContain('red');
    expect(container.textContent).toContain('blue');
  });

  it('renders loading skeleton for content_block_start', () => {
    render(<ChatMessage message={{ ...base, type: 'content_block_start', content: '' }} />);
    expect(screen.getByLabelText('block-placeholder')).toBeInTheDocument();
  });

  it('renders user messages with user role styling', () => {
    render(<ChatMessage message={{ ...base, role: 'user', type: 'text', content: 'Hi there' }} />);
    const el = screen.getByText('Hi there');
    expect(el.closest('[data-role="user"]')).toBeInTheDocument();
  });

  // Feature 3: tool_result shows tool name
  it('renders tool_result with meta.name as label', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: 'output',
          meta: { toolId: 't1', name: 'bash' },
        }}
      />,
    );
    expect(screen.getByText(/Result: bash/)).toBeInTheDocument();
  });

  it('renders tool_result without meta.name as generic Result', () => {
    render(
      <ChatMessage
        message={{ ...base, type: 'tool_result', content: 'output', meta: { toolId: 't1' } }}
      />,
    );
    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  // Feature 4: content_block_start shows blockType
  it('renders content_block_start with blockType label', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          type: 'content_block_start',
          content: '',
          meta: { blockType: 'tool_use' },
        }}
      />,
    );
    expect(screen.getByText(/tool_use/)).toBeInTheDocument();
  });

  it('renders content_block_start without blockType as generic placeholder', () => {
    render(<ChatMessage message={{ ...base, type: 'content_block_start', content: '' }} />);
    expect(screen.getByLabelText('block-placeholder')).toBeInTheDocument();
    expect(screen.queryByText(/tool_use|text|thinking/)).not.toBeInTheDocument();
  });

  // Feature 7: rate_limit overage display
  it('renders rate_limit_event with overage warning', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'rate_limit_event',
          content: 'Rate limit: limited',
          meta: {
            rateLimitInfo: {
              status: 'limited',
              isUsingOverage: true,
              overageStatus: 'active',
            },
          },
        }}
      />,
    );
    expect(screen.getByText(/overage/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('renders rate_limit_event without overage fields gracefully', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'rate_limit_event',
          content: 'Rate limit: limited',
          meta: { rateLimitInfo: { status: 'limited' } },
        }}
      />,
    );
    expect(screen.getByText(/Rate limit: limited/)).toBeInTheDocument();
    expect(screen.queryByText(/overage/i)).not.toBeInTheDocument();
  });

  // Feature 10: task_started taskType badge
  it('renders task_started with taskType badge', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'task_started',
          content: 'Running agent',
          meta: { taskType: 'local_agent' },
        }}
      />,
    );
    expect(screen.getByText('local_agent')).toBeInTheDocument();
  });

  it('renders task_started without taskType badge', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'task_started',
          content: 'Running agent',
        }}
      />,
    );
    expect(screen.getByText('Running agent')).toBeInTheDocument();
    expect(screen.queryByText('local_agent')).not.toBeInTheDocument();
  });

  it('renders hook_diagnostics type with warning styling', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'hook_diagnostics',
          content: 'PreToolUse',
          meta: { diagnostics: 'some diagnostic info' },
        }}
      />,
    );
    expect(screen.getByText(/Hook Diagnostics: PreToolUse/)).toBeInTheDocument();
    const details = screen.getByText(/Hook Diagnostics: PreToolUse/).closest('details');
    expect(details).toHaveClass('border-warning/30');
  });

  it('shows diagnostics text inside collapsible details', async () => {
    const user = userEvent.setup();
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'hook_diagnostics',
          content: 'PreToolUse',
          meta: { diagnostics: 'detailed diagnostic output' },
        }}
      />,
    );
    await user.click(screen.getByText(/Hook Diagnostics: PreToolUse/));
    expect(screen.getByText('detailed diagnostic output')).toBeInTheDocument();
  });

  it('falls back to content when no diagnostics in meta', () => {
    render(
      <ChatMessage
        message={{
          ...base,
          role: 'system',
          type: 'hook_diagnostics',
          content: 'fallback content',
        }}
      />,
    );
    expect(screen.getByText(/Hook Diagnostics: fallback content/)).toBeInTheDocument();
    // The pre should also show the content as fallback
    const pre = screen
      .getByText(/Hook Diagnostics: fallback content/)
      .closest('details')
      ?.querySelector('pre');
    expect(pre?.textContent).toBe('fallback content');
  });

  describe('selection attachment chips', () => {
    it('renders chips when user message has attachments', () => {
      render(
        <ChatMessage
          message={{
            ...base,
            role: 'user',
            type: 'text',
            content: 'Check this code',
            attachments: [{ filename: '/src/foo/bar.ts', startLine: 10, endLine: 25 }],
          }}
        />,
      );
      expect(screen.getByText('bar.ts:10-25')).toBeInTheDocument();
    });

    it('renders chip with only filename when no line range', () => {
      render(
        <ChatMessage
          message={{
            ...base,
            role: 'user',
            type: 'text',
            content: 'Look at this',
            attachments: [{ filename: 'src/app.tsx' }],
          }}
        />,
      );
      expect(screen.getByText('app.tsx')).toBeInTheDocument();
    });

    it('renders multiple chips for multiple attachments', () => {
      render(
        <ChatMessage
          message={{
            ...base,
            role: 'user',
            type: 'text',
            content: 'Compare these',
            attachments: [
              { filename: 'src/a.ts', startLine: 1 },
              { filename: 'src/b.ts', startLine: 5, endLine: 10 },
            ],
          }}
        />,
      );
      expect(screen.getByText('a.ts:1')).toBeInTheDocument();
      expect(screen.getByText('b.ts:5-10')).toBeInTheDocument();
    });

    it('does not render chips when attachments is absent', () => {
      render(
        <ChatMessage
          message={{ ...base, role: 'user', type: 'text', content: 'No attachments' }}
        />,
      );
      // No chip-styled spans visible
      const chips = document.querySelectorAll('.bg-white\\/5.border.border-border\\/50.rounded');
      expect(chips.length).toBe(0);
    });

    it('does not render chips for assistant messages', () => {
      render(
        <ChatMessage
          message={{
            ...base,
            role: 'assistant',
            type: 'text',
            content: 'Response',
            attachments: [{ filename: 'src/foo.ts' }],
          }}
        />,
      );
      expect(screen.queryByText('foo.ts')).not.toBeInTheDocument();
    });
  });

  it('renders file paths in tool_result as clickable buttons', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    render(
      <ChatMessage
        message={{
          ...base,
          type: 'tool_result',
          content: 'Found /src/main.ts:42 in results',
          meta: { toolId: 't1', name: 'Grep' },
        }}
      />,
    );
    await user.click(screen.getByText(/Result: Grep/));
    const btn = screen.getByTitle('Copy: /src/main.ts:42');
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/src/main.ts:42');
  });
});
