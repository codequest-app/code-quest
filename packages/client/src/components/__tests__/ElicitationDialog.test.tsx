import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ElicitationDialog } from '../ElicitationDialog';

function defaults() {
  return {
    requestId: 'req-1',
    prompt: 'Enter your name',
    inputType: 'text' as const,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };
}

describe('ElicitationDialog', () => {
  it('renders prompt text and accessible dialog role', () => {
    render(<ElicitationDialog {...defaults()} />);
    expect(screen.getByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /Input Required/i })).toBeInTheDocument();
  });

  it('Cancel button fires onCancel with requestId', async () => {
    const props = defaults();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<ElicitationDialog {...props} />);
    await user.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(props.onCancel).toHaveBeenCalledWith('req-1');
  });

  it('Submit fires onSubmit with typed value', async () => {
    const props = defaults();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<ElicitationDialog {...props} />);
    await user.type(screen.getByPlaceholderText(/Enter value/), 'Alice');
    await user.click(screen.getByRole('button', { name: /Submit/ }));
    expect(props.onSubmit).toHaveBeenCalledWith('req-1', 'Alice');
  });

  it('is mandatory — Escape does NOT fire onCancel (user must choose explicitly)', async () => {
    const props = defaults();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<ElicitationDialog {...props} />);
    await user.keyboard('{Escape}');
    expect(props.onCancel).not.toHaveBeenCalled();
  });
});
