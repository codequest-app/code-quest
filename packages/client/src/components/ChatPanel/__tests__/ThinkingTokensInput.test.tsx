import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThinkingTokensInput } from '../ThinkingTokensInput';

describe('ThinkingTokensInput', () => {
  it('should render number input', () => {
    render(<ThinkingTokensInput />);
    expect(screen.getByTestId('tokens-number-input')).toBeInTheDocument();
  });

  it('should render preset buttons', () => {
    render(<ThinkingTokensInput />);
    expect(screen.getByTestId('tokens-preset-1024')).toBeInTheDocument();
    expect(screen.getByTestId('tokens-preset-4096')).toBeInTheDocument();
    expect(screen.getByTestId('tokens-preset-16384')).toBeInTheDocument();
  });

  it('should call onTokensChange when preset is clicked', () => {
    const onTokensChange = vi.fn();
    render(<ThinkingTokensInput onTokensChange={onTokensChange} />);

    fireEvent.click(screen.getByTestId('tokens-preset-4096'));
    expect(onTokensChange).toHaveBeenCalledWith(4096);
  });

  it('should call onTokensChange when input value changes', () => {
    const onTokensChange = vi.fn();
    render(<ThinkingTokensInput onTokensChange={onTokensChange} />);

    fireEvent.change(screen.getByTestId('tokens-number-input'), {
      target: { value: '8192' },
    });
    expect(onTokensChange).toHaveBeenCalledWith(8192);
  });

  it('should display current tokens value', () => {
    render(<ThinkingTokensInput currentTokens={4096} />);
    const input = screen.getByTestId('tokens-number-input') as HTMLInputElement;
    expect(input.value).toBe('4096');
  });
});
