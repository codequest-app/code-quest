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

  it('expands on click to show thinking content', async () => {
    const { container } = render(<ThinkingBlock content="I need to analyze this code..." />);
    const trigger = container.querySelector('button')!;
    await userEvent.click(trigger);
    expect(screen.getByText('I need to analyze this code...')).toBeVisible();
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
