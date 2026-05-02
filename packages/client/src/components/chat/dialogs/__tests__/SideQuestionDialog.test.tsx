import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SideQuestionDialog } from '../SideQuestionDialog.tsx';

function renderDialog(props: Partial<Parameters<typeof SideQuestionDialog>[0]> = {}) {
  const defaults = {
    open: true,
    question: 'What is 2+2?',
    answer: null,
    loading: false,
    error: null,
    onClose: vi.fn(),
  };
  return render(<SideQuestionDialog {...defaults} {...props} />);
}

describe('SideQuestionDialog', () => {
  it('renders nothing when closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderDialog({ loading: true });
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  it('renders markdown answer', () => {
    renderDialog({ answer: '**bold** answer' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent).toContain('bold');
  });

  it('shows error message', () => {
    renderDialog({ error: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows question in header', () => {
    renderDialog({ question: 'What is TypeScript?' });
    expect(screen.getByText(/What is TypeScript\?/)).toBeInTheDocument();
  });

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { baseElement } = renderDialog({ answer: 'hello', onClose });
    const overlay = baseElement.querySelector('[data-state="open"][aria-hidden="true"]');
    if (!overlay) throw new Error('overlay not found');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking inside the dialog', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ answer: 'hello', onClose });

    await user.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
