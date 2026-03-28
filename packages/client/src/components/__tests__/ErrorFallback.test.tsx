import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from 'react-error-boundary';
import { describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  it('renders error message', () => {
    render(<ErrorFallback error={new Error('Something broke')} resetErrorBoundary={vi.fn()} />);
    expect(screen.getByText(/something broke/i)).toBeInTheDocument();
  });

  it('calls resetErrorBoundary on "Try again" click', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorFallback error={new Error('fail')} resetErrorBoundary={reset} />);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalled();
  });

  it('catches child component errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Boom(): never {
      throw new Error('Boom!');
    }
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/boom/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    spy.mockRestore();
  });
});
