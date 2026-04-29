import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThinkingBlock } from '../ThinkingBlock';

describe('ThinkingBlock', () => {
  it('renders collapsed by default with "Thinking" label', () => {
    render(<ThinkingBlock content="I need to analyze this code..." />);
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    // Content is in DOM but hidden via CSS (hidden class)
    expect(screen.getByText('I need to analyze this code...')).not.toBeVisible();
  });

  it('uses <details> element collapsed by default', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const details = container.querySelector('details');
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute('open');
  });

  it('uses <summary> element containing "Thinking"', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const summary = container.querySelector('summary');
    expect(summary).toBeInTheDocument();
    expect(summary?.textContent).toContain('Thinking');
  });

  it('has a chevron SVG inside summary', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const summary = container.querySelector('summary');
    expect(summary?.querySelector('svg')).toBeInTheDocument();
  });

  it('chevron SVG has explicit size class (else heroicons stretch to fill flex parent)', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const svg = container.querySelector('summary svg');
    const classes = svg?.getAttribute('class') ?? '';
    expect(classes).toMatch(/\bw-\d/);
    expect(classes).toMatch(/\bh-\d/);
  });

  it('expands on click to show thinking content', async () => {
    const { container } = render(<ThinkingBlock content="I need to analyze this code..." />);
    const summary = container.querySelector('summary')!;
    await userEvent.click(summary);
    expect(screen.getByText('I need to analyze this code...')).toBeInTheDocument();
  });

  it('collapses on second click', async () => {
    const { container } = render(<ThinkingBlock content="I need to analyze this code..." />);
    const summary = container.querySelector('summary')!;
    await userEvent.click(summary);
    expect(screen.getByText('I need to analyze this code...')).toBeInTheDocument();
    await userEvent.click(summary);
    // Content remains in DOM but hidden via CSS
    expect(screen.getByText('I need to analyze this code...')).not.toBeVisible();
  });
});
