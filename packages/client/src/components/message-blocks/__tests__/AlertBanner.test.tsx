import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertBanner } from '../AlertBanner';

describe('AlertBanner', () => {
  it('renders children', () => {
    render(<AlertBanner className="border-l-warning bg-warning-bg">Warning text</AlertBanner>);
    expect(screen.getByText('Warning text')).toBeInTheDocument();
  });

  it('always has border-l-2 and rounded-r-lg', () => {
    const { container } = render(
      <AlertBanner className="border-l-warning bg-warning-bg">content</AlertBanner>,
    );
    const el = container.firstElementChild;
    expect(el?.className).toContain('border-l-2');
    expect(el?.className).toContain('rounded-r-lg');
  });

  it('merges extra className', () => {
    const { container } = render(
      <AlertBanner className="border-l-danger bg-danger-bg px-4 py-3">content</AlertBanner>,
    );
    const el = container.firstElementChild;
    expect(el?.className).toContain('border-l-danger');
    expect(el?.className).toContain('bg-danger-bg');
    expect(el?.className).toContain('px-4');
    expect(el?.className).toContain('py-3');
  });
});
