import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddButton } from '../AddButton';

describe('AddButton', () => {
  it('shows "Add context" label instead of "Files & Folders"', async () => {
    const user = userEvent.setup();
    render(<AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await user.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();
  });

  it('shows icon for each menu item', async () => {
    const user = userEvent.setup();
    render(<AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await user.click(screen.getByTitle('Add'));
    const svgs = document.querySelectorAll('svg');
    // +1 for the plus button itself, +2 for menu items
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await user.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Add context')).not.toBeInTheDocument();
  });

  it('closes on click outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />
        <div>outside</div>
      </div>,
    );
    await user.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();

    await user.click(screen.getByText('outside'));
    expect(screen.queryByText('Add context')).not.toBeInTheDocument();
  });
});
