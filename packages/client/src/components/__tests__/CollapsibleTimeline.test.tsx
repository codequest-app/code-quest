import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { msg } from '@/utils/message';
import type { MessageNode } from '@/utils/message-tree';
import { CollapsibleTimeline } from '../CollapsibleTimeline';

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
  it('shows "Explored N" collapsed by default when 2+ consecutive read-only tools', () => {
    const nodes = [
      toolNode({ name: 'Read', result: { content: 'ok' } }),
      toolNode({ name: 'Read', result: { content: 'ok' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    expect(screen.getByText('Explored')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('single read-only tool renders solo (no "Explored")', () => {
    const nodes = [toolNode({ name: 'Read', result: { content: 'ok' } })];
    render(<CollapsibleTimeline nodes={nodes} />);
    expect(screen.queryByText('Explored')).not.toBeInTheDocument();
  });

  it('consecutive Bash also collapses (cc-office groups any tool_use)', () => {
    const nodes = [
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    expect(screen.getByText('Explored')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('mixed Bash + Write + Read grouped together', () => {
    const nodes = [
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
      toolNode({ name: 'Write', result: { content: 'ok' } }),
      toolNode({ name: 'Read', result: { content: 'ok' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    expect(screen.getByText('Explored')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('assistant text between reads splits the group', () => {
    const nodes = [
      toolNode({ name: 'Read', result: { content: 'a' } }),
      textNode('between'),
      toolNode({ name: 'Read', result: { content: 'b' } }),
      toolNode({ name: 'Read', result: { content: 'c' } }),
    ];
    render(<CollapsibleTimeline nodes={nodes} />);
    // The trailing pair is grouped — count shows 2
    expect(screen.getByText('Explored')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
