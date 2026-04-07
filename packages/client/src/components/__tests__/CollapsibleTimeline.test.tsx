import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { msg } from '@/utils/message';
import type { MessageNode } from '@/utils/message-tree';
import { CollapsibleTimeline } from '../CollapsibleTimeline';

function toolNode(overrides?: { result?: { content: string; is_error?: boolean } }): MessageNode {
  const m = msg({
    role: 'assistant',
    type: 'tool_use',
    content: 'Read',
    meta: { toolId: crypto.randomUUID(), input: {}, result: overrides?.result },
  });
  return { message: m, children: [] };
}

function completedNodes(count: number): MessageNode[] {
  return Array.from({ length: count }, () => toolNode({ result: { content: 'ok' } }));
}

describe('CollapsibleTimeline', () => {
  it('auto-collapses on reload when all complete and toolCount >= 5', () => {
    const nodes = completedNodes(5);
    render(<CollapsibleTimeline nodes={nodes} />);

    // Should show collapsed summary with "Explored" text
    expect(screen.getByText('Explored')).toBeInTheDocument();
  });

  it('stays expanded when toolCount < 5 even if all complete', () => {
    const nodes = completedNodes(3);
    render(<CollapsibleTimeline nodes={nodes} />);

    expect(screen.queryByText('Explored')).not.toBeInTheDocument();
  });
});
