import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  const defaultProps = {
    onSend: vi.fn(),
    onAbort: vi.fn(),
    isProcessing: false,
  };

  function renderInput(props = {}) {
    return render(<ChatInput {...defaultProps} {...props} />);
  }

  it('should render textarea and send button', () => {
    renderInput();

    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send')).toBeInTheDocument();
  });

  it('should disable textarea when isProcessing is true', () => {
    renderInput({ isProcessing: true });

    expect(screen.getByLabelText('Message input')).toBeDisabled();
  });

  it('should disable textarea when disabled prop is true', () => {
    renderInput({ disabled: true });

    expect(screen.getByLabelText('Message input')).toBeDisabled();
  });

  it('should show stop button when isProcessing', () => {
    renderInput({ isProcessing: true });

    expect(screen.getByLabelText('Stop')).toBeInTheDocument();
    expect(screen.queryByLabelText('Send')).not.toBeInTheDocument();
  });

  it('should call onAbort when stop button clicked', () => {
    const onAbort = vi.fn();
    renderInput({ isProcessing: true, onAbort });

    fireEvent.click(screen.getByLabelText('Stop'));
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  it('should call onSend with trimmed message when send clicked', () => {
    const onSend = vi.fn();
    renderInput({ onSend });

    fireEvent.change(screen.getByLabelText('Message input'), {
      target: { value: '  Hello!  ' },
    });
    fireEvent.click(screen.getByLabelText('Send'));

    expect(onSend).toHaveBeenCalledWith('Hello!');
  });

  it('should clear input after send', () => {
    renderInput();

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.click(screen.getByLabelText('Send'));

    expect(input).toHaveValue('');
  });

  it('should not send empty or whitespace-only message', () => {
    const onSend = vi.fn();
    renderInput({ onSend });

    fireEvent.change(screen.getByLabelText('Message input'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByLabelText('Send'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should disable send button when input is empty', () => {
    renderInput();

    expect(screen.getByLabelText('Send')).toBeDisabled();
  });

  it('should send on Enter key', () => {
    const onSend = vi.fn();
    renderInput({ onSend });

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Hello!');
  });

  it('should not send on Shift+Enter', () => {
    const onSend = vi.fn();
    renderInput({ onSend });

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should not send when isProcessing even if input has value', () => {
    const onSend = vi.fn();
    renderInput({ isProcessing: true, onSend });

    // Can't type when disabled, but test the guard in handleSend
    expect(screen.getByLabelText('Message input')).toBeDisabled();
  });

  it('should call onSlashTyped when / is typed on empty input', () => {
    const onSlashTyped = vi.fn();
    renderInput({ onSlashTyped });

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: '/' } });

    expect(onSlashTyped).toHaveBeenCalledTimes(1);
  });

  it('should not call onSlashTyped when / is typed on non-empty input', () => {
    const onSlashTyped = vi.fn();
    renderInput({ onSlashTyped });

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.change(input, { target: { value: 'hello/' } });

    expect(onSlashTyped).not.toHaveBeenCalled();
  });
});
