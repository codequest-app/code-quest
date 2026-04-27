import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AttachMenu } from '../AttachMenu';

describe('AttachMenu', () => {
  it('shows "Add context" label instead of "Files & Folders"', async () => {
    const user = userEvent.setup();
    render(<AttachMenu onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await user.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();
  });

  it('shows both menu items when both callbacks provided', async () => {
    const user = userEvent.setup();
    render(<AttachMenu onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await user.click(screen.getByTitle('Add'));
    expect(screen.getByTitle('Attach files from your computer')).toBeInTheDocument();
    expect(screen.getByTitle('Add files or folders to the conversation')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<AttachMenu onAttachFile={vi.fn()} onMentionFile={vi.fn()} />);
    await user.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Add context')).not.toBeInTheDocument();
  });

  it('closes on click outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AttachMenu onAttachFile={vi.fn()} onMentionFile={vi.fn()} />
        <div>outside</div>
      </div>,
    );
    await user.click(screen.getByTitle('Add'));
    expect(screen.getByText('Add context')).toBeInTheDocument();

    await user.click(screen.getByText('outside'));
    expect(screen.queryByText('Add context')).not.toBeInTheDocument();
  });
});
