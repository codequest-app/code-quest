import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThinkingBlock } from '../ThinkingBlock.tsx';

describe('ThinkingBlock', () => {
  it('renders collapsed by default with "Thinking" label', () => {
    render(<ThinkingBlock content="I need to analyze this code..." />);
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    // Radix Collapsible removes content from DOM when closed
    expect(screen.queryByText('I need to analyze this code...')).toBeNull();
  });

  it('uses Radix Collapsible root collapsed by default', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const root = container.querySelector('[data-state="closed"]');
    expect(root).toBeInTheDocument();
  });

  it('trigger contains "Thinking"', () => {
    render(<ThinkingBlock content="thinking..." />);
    expect(screen.getByText('Thinking')).toBeInTheDocument();
  });

  it('has a chevron SVG inside trigger', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const trigger = container.querySelector('button');
    expect(trigger?.querySelector('svg')).toBeInTheDocument();
  });

  it('chevron SVG has explicit size class (else heroicons stretch to fill flex parent)', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const svg = container.querySelector('button svg');
    const classes = svg?.getAttribute('class') ?? '';
    expect(classes).toMatch(/\bw-\d/);
    expect(classes).toMatch(/\bh-\d/);
  });

  it('chevron is w-4 h-4 to match tool group chevron size', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const svg = container.querySelector('button svg');
    const classes = svg?.getAttribute('class') ?? '';
    expect(classes).toContain('w-4');
    expect(classes).toContain('h-4');
  });

  it('trigger has no py-1 padding (TimelineItem manages vertical spacing)', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const trigger = container.querySelector('button');
    expect(trigger?.className).not.toContain('py-1');
  });

  it('trigger has hover text color transition (no full-width background)', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const trigger = container.querySelector('button');
    expect(trigger?.className).toContain('hover:text-text');
    expect(trigger?.className).not.toContain('hover:bg-white/5');
    expect(trigger?.className).not.toContain('w-full');
  });

  it('chevron is next to the label text, not pushed to far right', () => {
    const { container } = render(<ThinkingBlock content="thinking..." />);
    const svg = container.querySelector('button svg');
    const classes = svg?.getAttribute('class') ?? '';
    expect(classes).not.toContain('ml-auto');
  });

  it('expands on click to show thinking content', async () => {
    const { container } = render(<ThinkingBlock content="I need to analyze this code..." />);
    const trigger = container.querySelector('button')!;
    await userEvent.click(trigger);
    expect(screen.getByText('I need to analyze this code...')).toBeVisible();
  });

  it('shows "Thinking..." when isStreaming is true', () => {
    render(<ThinkingBlock content="..." isStreaming={true} />);
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('shows "Thought for Ns" when durationMs is provided', () => {
    render(<ThinkingBlock content="..." durationMs={5000} />);
    expect(screen.getByText('Thought for 5s')).toBeInTheDocument();
  });

  it('shows token count when budgetTokens is provided and durationMs is absent', () => {
    render(<ThinkingBlock content="..." budgetTokens={1000} />);
    expect(screen.getByText('Thinking (1,000 tokens)')).toBeInTheDocument();
  });

  it('isStreaming takes priority over durationMs', () => {
    render(<ThinkingBlock content="..." isStreaming={true} durationMs={5000} />);
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('collapses on second click', async () => {
    const { container } = render(<ThinkingBlock content="I need to analyze this code..." />);
    const trigger = container.querySelector('button')!;
    await userEvent.click(trigger);
    expect(screen.getByText('I need to analyze this code...')).toBeVisible();
    await userEvent.click(trigger);
    // Radix Collapsible removes content from DOM when closed
    expect(screen.queryByText('I need to analyze this code...')).toBeNull();
  });
});
