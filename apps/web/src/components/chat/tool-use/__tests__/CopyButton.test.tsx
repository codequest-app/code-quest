import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from '@/components/ui/CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Copied!" title immediately after click', () => {
    render(<CopyButton text="hello" title="Copy" />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('title', 'Copied!');
  });

  it('reverts title after COPY_SUCCESS_DURATION_MS (2000ms)', () => {
    render(<CopyButton text="hello" title="Copy" />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(btn).toHaveAttribute('title', 'Copy');
  });

  it('still shows "Copied!" just before COPY_SUCCESS_DURATION_MS elapses', () => {
    render(<CopyButton text="hello" title="Copy" />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(btn).toHaveAttribute('title', 'Copied!');
  });
});
