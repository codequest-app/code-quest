import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CommitComposer } from '../CommitComposer';

describe('CommitComposer', () => {
  it('focuses subject on initial mount', () => {
    render(<CommitComposer onCommit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Subject')).toHaveFocus();
  });

  it('does NOT steal focus on parent re-render while user types in body', async () => {
    const user = userEvent.setup();
    function Parent({ count }: { count: number }) {
      // Simulate the real-world parent re-render driver: useGitStatus emits
      // on every git:dirty event and forwards a fresh `count` prop.
      return <CommitComposer onCommit={vi.fn()} count={count} />;
    }
    const { rerender } = render(<Parent count={1} />);
    const body = screen.getByPlaceholderText('Body (optional)');
    await user.click(body);
    fireEvent.change(body, { target: { value: 'partial typing' } });
    expect(body).toHaveFocus();

    rerender(<Parent count={2} />);

    // Without the fix, ref callback re-fires focus on subject every render.
    expect(body).toHaveFocus();
  });
});
