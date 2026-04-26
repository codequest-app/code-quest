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

  it('default variant uses text-text-dim', () => {
    render(<SectionHeader>Default</SectionHeader>);
    const el = screen.getByText('Default');
    expect(el.className).toMatch(/text-text-dim/);
    expect(el.className).not.toMatch(/border-b/);
  });

  it('prominent variant uses brighter color and bottom border', () => {
    render(<SectionHeader variant="prominent">Source</SectionHeader>);
    const el = screen.getByText('Source');
    expect(el.className).toMatch(/text-text-muted/);
    expect(el.className).toMatch(/border-b/);
  });
});
