import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CollapsibleBlock } from '../../ui/CollapsibleBlock';

describe('CollapsibleBlock', () => {
  it('accepts a ReactNode icon (SVG element)', () => {
    render(
      <CollapsibleBlock icon={<svg role="img" aria-label="custom icon" />} label="Test">
        <span>content</span>
      </CollapsibleBlock>,
    );
    expect(screen.getByRole('img', { name: 'custom icon' })).toBeInTheDocument();
  });

  it('hides children by default', () => {
    render(
      <CollapsibleBlock icon="📄" label="Test">
        <span>content</span>
      </CollapsibleBlock>,
    );
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows children after clicking the trigger', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleBlock icon="📄" label="Test">
        <span>content</span>
      </CollapsibleBlock>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('hides children again after clicking trigger twice', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleBlock icon="📄" label="Test">
        <span>content</span>
      </CollapsibleBlock>,
    );
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows children when defaultOpen is true', () => {
    render(
      <CollapsibleBlock icon="📄" label="Test" defaultOpen>
        <span>content</span>
      </CollapsibleBlock>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
