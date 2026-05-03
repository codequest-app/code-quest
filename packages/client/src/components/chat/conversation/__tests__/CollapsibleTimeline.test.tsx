import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { msg } from '@/utils/message';
import type { MessageNode } from '@/utils/message-tree';
import { CollapsibleTimeline } from '../CollapsibleTimeline.tsx';
import { TimelineItem } from '../TimelineItem.tsx';

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

describe('TimelineItem', () => {
  it('renders children inside relative pl-7 container', () => {
    const { container } = render(
      <TimelineItem position="only" dotClass="bg-success">
        <span>content</span>
      </TimelineItem>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('relative');
    expect(wrapper.className).toContain('pl-7');
  });

  it('renders a dot span', () => {
    const { container } = render(
      <TimelineItem position="only" dotClass="bg-success">
        <span>x</span>
      </TimelineItem>,
    );
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('renders a line span with w-px bg-border', () => {
    const { container } = render(
      <TimelineItem position="first" dotClass="bg-success">
        <span>x</span>
      </TimelineItem>,
    );
    expect(container.querySelector('span.w-px.bg-border')).toBeInTheDocument();
  });

  it('hides line when position is only', () => {
    const { container } = render(
      <TimelineItem position="only" dotClass="bg-success">
        <span>x</span>
      </TimelineItem>,
    );
    const line = container.querySelector('span.w-px.bg-border');
    expect(line?.className).toContain('hidden');
  });
});

describe('CollapsibleTimeline — ToolGroup timeline structure', () => {
  it('tool group row has a timeline dot', () => {
    const nodes = [toolNode({ name: 'Bash', result: { content: 'ok' } })];
    const { container } = render(<CollapsibleTimeline nodes={nodes} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('tool group row has a vertical timeline line', () => {
    const nodes = [toolNode({ name: 'Bash', result: { content: 'ok' } })];
    const { container } = render(<CollapsibleTimeline nodes={nodes} />);
    // line is a <span> with w-px and bg-border
    const line = container.querySelector('span.w-px.bg-border');
    expect(line).toBeInTheDocument();
  });

  it('tool group chevron is next to chips, not pushed to far right', () => {
    const nodes = [
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
      toolNode({ name: 'Bash', result: { content: 'ok' } }),
    ];
    const { container } = render(<CollapsibleTimeline nodes={nodes} />);
    const groupEl = container.querySelector('[data-collapsed-ids]')!;
    const button = groupEl.querySelector('button[type="button"]')!;
    const svgs = button.querySelectorAll('svg');
    const lastSvg = svgs[svgs.length - 1];
    expect(lastSvg?.getAttribute('class')).not.toContain('ml-auto');
  });
});

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
