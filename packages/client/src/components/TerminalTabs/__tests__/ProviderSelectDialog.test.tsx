import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProviderSelectDialog } from '../ProviderSelectDialog';

describe('ProviderSelectDialog', () => {
  it('should render provider options', () => {
    render(<ProviderSelectDialog onSelect={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByTestId('provider-select-dialog')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
  });

  it('should call onSelect with claude when Claude is clicked', () => {
    const onSelect = vi.fn();
    render(<ProviderSelectDialog onSelect={onSelect} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Claude'));
    expect(onSelect).toHaveBeenCalledWith('claude');
  });

  it('should call onSelect with gemini when Gemini is clicked', () => {
    const onSelect = vi.fn();
    render(<ProviderSelectDialog onSelect={onSelect} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Gemini'));
    expect(onSelect).toHaveBeenCalledWith('gemini');
  });

  it('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<ProviderSelectDialog onSelect={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(screen.getByTestId('provider-select-dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
