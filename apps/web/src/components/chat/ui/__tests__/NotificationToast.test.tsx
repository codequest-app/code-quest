import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationToast } from '@/components/chat/ui/NotificationToast';

describe('NotificationToast', () => {
  const buttons = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Maybe', value: 'maybe' },
  ];

  it('renders message text', () => {
    render(
      <NotificationToast
        message="Something happened"
        buttons={buttons}
        onButton={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('renders all buttons as clickable elements', () => {
    render(
      <NotificationToast message="msg" buttons={buttons} onButton={vi.fn()} onDismiss={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maybe' })).toBeInTheDocument();
  });

  it('calls onButton with button value when clicked', async () => {
    const onButton = vi.fn();
    const user = userEvent.setup();
    render(
      <NotificationToast message="msg" buttons={buttons} onButton={onButton} onDismiss={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(onButton).toHaveBeenCalledWith('no');
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <NotificationToast
        message="msg"
        buttons={buttons}
        onButton={vi.fn()}
        onDismiss={onDismiss}
      />,
    );
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
