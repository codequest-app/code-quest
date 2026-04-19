import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeader } from '../SectionHeader';

describe('SectionHeader', () => {
  it('renders children as the heading text', () => {
    render(<SectionHeader>Projects</SectionHeader>);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('applies uppercase + small + monospace chrome', () => {
    render(<SectionHeader>Filters</SectionHeader>);
    const el = screen.getByText('Filters');
    expect(el.className).toMatch(/uppercase/);
    expect(el.className).toMatch(/font-mono/);
  });

  it('forwards data-testid prop', () => {
    render(<SectionHeader data-testid="my-section">Messages</SectionHeader>);
    expect(screen.getByTestId('my-section')).toBeInTheDocument();
  });
});
