import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolBlock, ToolBlockRow } from '../message-blocks/ToolBlock.tsx';

describe('ToolBlock', () => {
  it('renders children inside a bordered container', () => {
    const { container } = render(
      <ToolBlock>
        <div>content</div>
      </ToolBlock>,
    );
    const box = container.querySelector('.border.border-border.bg-code-block');
    expect(box).toBeInTheDocument();
    expect(box).toContainElement(screen.getByText('content'));
  });
});

describe('ToolBlockRow', () => {
  it('renders label and children', () => {
    render(
      <ToolBlock>
        <ToolBlockRow label="IN">
          <pre>command</pre>
        </ToolBlockRow>
      </ToolBlock>,
    );
    expect(screen.getByText('IN')).toBeInTheDocument();
    expect(screen.getByText('command')).toBeInTheDocument();
  });

  it('shows copy button on hover when copyText provided', async () => {
    render(
      <ToolBlock>
        <ToolBlockRow label="IN" copyText="hello">
          <pre>hello</pre>
        </ToolBlockRow>
      </ToolBlock>,
    );
    expect(screen.getByTitle('Copy')).toBeInTheDocument();
  });

  it('shows divider border-b when divider prop is true', () => {
    const { container } = render(
      <ToolBlock>
        <ToolBlockRow label="IN" divider>
          <pre>cmd</pre>
        </ToolBlockRow>
      </ToolBlock>,
    );
    const row = container.querySelector('.border-b');
    expect(row).toBeInTheDocument();
  });

  it('copy button has hover:bg-surface-hover and rounded class', () => {
    const { container } = render(
      <ToolBlock>
        <ToolBlockRow label="IN" copyText="hello">
          <pre>hello</pre>
        </ToolBlockRow>
      </ToolBlock>,
    );
    const btn = container.querySelector('button[title="Copy"]');
    expect(btn?.className).toContain('hover:bg-surface-hover');
    expect(btn?.className).toContain('rounded');
  });

  it('does not show copy button when copyText is not provided', () => {
    render(
      <ToolBlock>
        <ToolBlockRow label="OUT">
          <pre>output</pre>
        </ToolBlockRow>
      </ToolBlock>,
    );
    expect(screen.queryByTitle('Copy')).not.toBeInTheDocument();
  });
});
