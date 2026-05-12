import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import { msg } from '@/utils/message';
import { CollapsibleTimeline } from '../CollapsibleTimeline.tsx';
import { TimelineItem } from '../TimelineItem.tsx';

function toolNode(name = 'Read'): Message {
  return msg({
    role: 'assistant',
    type: 'tool_use',
    content: name,
    toolId: crypto.randomUUID(),
    input: {},
  });
}

function textNode(content = 'hi'): Message {
  return msg({ role: 'assistant', type: 'text', content });
}

describe('TimelineItem', () => {
  it('renders children', () => {
    render(
      <TimelineItem position="only" dotClass="bg-success">
        <span>content</span>
      </TimelineItem>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders a dot', () => {
    render(
      <TimelineItem position="only" dotClass="bg-success">
        <span>x</span>
      </TimelineItem>,
    );
    expect(screen.getByTestId('timeline-dot')).toBeInTheDocument();
  });

  it('renders a timeline line', () => {
    render(
      <TimelineItem position="first" dotClass="bg-success">
        <span>x</span>
      </TimelineItem>,
    );
    expect(screen.getByTestId('timeline-line')).toBeInTheDocument();
  });

  it('hides line when position is only', () => {
    render(
      <TimelineItem position="only" dotClass="bg-success">
        <span>x</span>
      </TimelineItem>,
    );
    expect(screen.getByTestId('timeline-line')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('CollapsibleTimeline — ToolGroup timeline structure', () => {
  it('tool group row has a timeline dot', () => {
    render(<CollapsibleTimeline messages={[toolNode('Bash')]} />);
    expect(screen.getByTestId('timeline-dot')).toBeInTheDocument();
  });

  it('tool group row has a vertical timeline line', () => {
    render(<CollapsibleTimeline messages={[toolNode('Bash')]} />);
    expect(screen.getByTestId('timeline-line')).toBeInTheDocument();
  });
});

describe('CollapsibleTimeline', () => {
  it('groups consecutive tool_use nodes with chip summary', () => {
    const nodes = [toolNode('Read'), toolNode('Read')];
    render(<CollapsibleTimeline messages={nodes} />);
    expect(screen.getByText(/Read/)).toBeInTheDocument();
    expect(screen.getByText(/×2/)).toBeInTheDocument();
  });

  it('single tool_use also forms a group with chip', () => {
    render(<CollapsibleTimeline messages={[toolNode('Read')]} />);
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('consecutive Bash tools collapse into one group', () => {
    const nodes = [toolNode('Bash'), toolNode('Bash'), toolNode('Bash')];
    render(<CollapsibleTimeline messages={nodes} />);
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText(/×3/)).toBeInTheDocument();
  });

  it('mixed tools show separate chips in one group', () => {
    const nodes = [toolNode('Bash'), toolNode('Write'), toolNode('Read')];
    render(<CollapsibleTimeline messages={nodes} />);
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('assistant text between reads splits into two groups', () => {
    const nodes = [toolNode('Read'), textNode('between'), toolNode('Read'), toolNode('Read')];
    render(<CollapsibleTimeline messages={nodes} />);
    expect(screen.getByText(/×2/)).toBeInTheDocument();
  });

  it('group can be expanded to show individual tool rows', async () => {
    const nodes = [toolNode('Bash'), toolNode('Read')];
    render(<CollapsibleTimeline messages={nodes} />);
    const expandBtn = screen.getByRole('button');
    await userEvent.click(expandBtn);
    expect(screen.getAllByText('Bash').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Read').length).toBeGreaterThanOrEqual(1);
  });
});
