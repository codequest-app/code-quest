import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { msg } from '@/utils/message';
import type { MessageNode } from '@/utils/message-tree';
import { CollapsibleTimeline } from '../CollapsibleTimeline.tsx';

function toolNode(
  opts: { name?: string; result?: { content: string; is_error?: boolean } } = {},
): MessageNode {
  const m = msg({
    role: 'assistant',
    type: 'tool_use',
    content: opts.name ?? 'Read',
    meta: { toolId: crypto.randomUUID(), input: {}, result: opts.result },
  });
  return { message: m, children: [] };
}

function textNode(content = 'hi'): MessageNode {
  return { message: msg({ role: 'assistant', type: 'text', content }), children: [] };
}

describe('CollapsibleTimeline', () => {
  it('groups consecutive tool_use nodes with chip summary', () => {
    const nodes = [
      toolNode({ name: 'Read', result: { content: 'ok' } }),
      toolNode({ name: 'Read', result: { content: 'ok' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    // chip shows tool name with count
    expect(screen.getByText(/Read/)).toBeInTheDocument();
    expect(screen.getByText(/×2/)).toBeInTheDocument();
  });

  it('single tool_use also forms a group with chip', () => {
    const nodes = [toolNode({ name: 'Read', result: { content: 'ok' } })];
    render(<CollapsibleTimeline nodes={nodes} />);
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('consecutive Bash tools collapse into one group', () => {
    const nodes = [
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText(/×3/)).toBeInTheDocument();
  });

  it('mixed tools show separate chips in one group', () => {
    const nodes = [
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
      toolNode({ name: 'Write', result: { content: 'ok' } }),
      toolNode({ name: 'Read', result: { content: 'ok' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('assistant text between reads splits into two groups', () => {
    const nodes = [
      toolNode({ name: 'Read', result: { content: 'a' } }),
      textNode('between'),
      toolNode({ name: 'Read', result: { content: 'b' } }),
      toolNode({ name: 'Read', result: { content: 'c' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    // second group has 2 reads → shows ×2
    expect(screen.getByText(/×2/)).toBeInTheDocument();
  });
});
