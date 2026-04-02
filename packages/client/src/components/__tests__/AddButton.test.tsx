import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddButton } from '../AddButton';

describe('AddButton', () => {
  it('shows "Add context" label instead of "Files & Folders"', async () => {
    render(<AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await userEvent.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();
  });

  it('shows icon for each menu item', async () => {
    render(<AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await userEvent.click(screen.getByTitle('Add'));
    const svgs = document.querySelectorAll('svg');
    // +1 for the plus button itself, +2 for menu items
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });

  it('closes on Escape', async () => {
    render(<AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await userEvent.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Add context')).not.toBeInTheDocument();
  });

  it('closes on click outside', async () => {
    render(
      <div>
        <AddButton onAttachFile={vi.fn()} onMentionFile={vi.fn()} />
        <div data-testid="outside">outside</div>
      </div>,
    );
    await userEvent.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Add context')).not.toBeInTheDocument();
  });
});
