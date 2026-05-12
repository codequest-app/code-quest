import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolBlock } from '../ToolBlock.tsx';

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
