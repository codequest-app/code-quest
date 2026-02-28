import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  it('renders textarea and send button', () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onSend with trimmed text and clears input', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled={false} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello world');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith('hello world');
    expect(textarea).toHaveValue('');
  });

  it('does not send empty or whitespace-only input', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled={false} />);

    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox'), '   ');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends on Enter key', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled={false} />);

    await user.type(screen.getByRole('textbox'), 'hi{Enter}');
    expect(onSend).toHaveBeenCalledWith('hi');
  });

  it('does not send on Shift+Enter (allows newline)', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled={false} />);

    await user.type(screen.getByRole('textbox'), 'line1{Shift>}{Enter}{/Shift}line2');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables textarea and button when disabled', () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('shows Stop button when processing', () => {
    render(<ChatInput onSend={vi.fn()} onStop={vi.fn()} disabled={true} isProcessing={true} />);
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
  });

  it('calls onStop when Stop button clicked', async () => {
    const onStop = vi.fn();
    render(<ChatInput onSend={vi.fn()} onStop={onStop} disabled={true} isProcessing={true} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /stop/i }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('does not show Stop button when idle', () => {
    render(<ChatInput onSend={vi.fn()} onStop={vi.fn()} disabled={false} isProcessing={false} />);
    expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
  });
});
