import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EffortSwitch } from '../EffortSwitch';

const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];

describe('EffortSwitch behavior', () => {
  it('exposes role="slider" with aria-valuemin/max/now mapped to level index', () => {
    render(<EffortSwitch level="high" levels={LEVELS} onSelect={vi.fn()} />);
    const sl = screen.getByRole('slider');
    expect(sl).toHaveAttribute('aria-valuemin', '0');
    expect(sl).toHaveAttribute('aria-valuemax', String(LEVELS.length - 1));
    expect(sl).toHaveAttribute('aria-valuenow', '2');
  });

  it('ArrowRight advances the level', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EffortSwitch level="medium" levels={LEVELS} onSelect={onSelect} />);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenLastCalledWith('high');
  });

  it('ArrowLeft retreats the level', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EffortSwitch level="medium" levels={LEVELS} onSelect={onSelect} />);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowLeft}');
    expect(onSelect).toHaveBeenLastCalledWith('low');
  });

  it('Home / End jump to extremes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EffortSwitch level="medium" levels={LEVELS} onSelect={onSelect} />);
    screen.getByRole('slider').focus();
    await user.keyboard('{End}');
    expect(onSelect).toHaveBeenLastCalledWith('max');
    await user.keyboard('{Home}');
    expect(onSelect).toHaveBeenLastCalledWith('low');
  });

  it('click at the visible right edge picks max (linear mapping across full pill)', () => {
    const onSelect = vi.fn();
    render(<EffortSwitch level="low" levels={LEVELS} onSelect={onSelect} />);
    const root = screen.getByRole('slider');
    const PILL = 100;
    root.getBoundingClientRect = () =>
      ({
        left: 0,
        right: PILL,
        top: 0,
        bottom: 20,
        x: 0,
        y: 0,
        width: PILL,
        height: 20,
        toJSON() {},
      }) as DOMRect;
    // Use detail=1 so the click handler doesn't early-return on detail===0.
    fireEvent.click(root, { clientX: PILL - 1, clientY: 10, detail: 1 });
    expect(onSelect).toHaveBeenLastCalledWith('max');
  });

  it('click at left edge picks low', () => {
    const onSelect = vi.fn();
    render(<EffortSwitch level="max" levels={LEVELS} onSelect={onSelect} />);
    const root = screen.getByRole('slider');
    const PILL = 100;
    root.getBoundingClientRect = () =>
      ({
        left: 0,
        right: PILL,
        top: 0,
        bottom: 20,
        x: 0,
        y: 0,
        width: PILL,
        height: 20,
        toJSON() {},
      }) as DOMRect;
    fireEvent.click(root, { clientX: 1, clientY: 10, detail: 1 });
    expect(onSelect).toHaveBeenLastCalledWith('low');
  });
});

describe('EffortSwitch visual contract', () => {
  it('thumb is vertically centered in track', () => {
    const { container } = render(<EffortSwitch level="low" levels={LEVELS} />);
    const thumb = container.querySelector('[data-testid="effort-switch-thumb"]')!;
    expect(thumb.className).toMatch(/top-1\/2/);
    expect(thumb.className).toMatch(/-translate-y-1\/2/);
  });

  it('thumb has a subtle ring so it stays visible on any mode-accent fill', () => {
    const { container } = render(<EffortSwitch level="low" levels={LEVELS} />);
    const thumb = container.querySelector('[data-testid="effort-switch-thumb"]')!;
    expect(thumb.className).toMatch(/ring-/);
  });

  it('renders ticks only for positions after the thumb (count-adaptive)', () => {
    const atLow = render(<EffortSwitch level="low" levels={LEVELS} />);
    expect(atLow.container.querySelectorAll('[data-testid="effort-switch-tick"]')).toHaveLength(
      LEVELS.length - 1,
    );

    const atHigh = render(<EffortSwitch level="high" levels={LEVELS} />);
    expect(atHigh.container.querySelectorAll('[data-testid="effort-switch-tick"]')).toHaveLength(2);

    const atMax = render(<EffortSwitch level="max" levels={LEVELS} />);
    expect(atMax.container.querySelectorAll('[data-testid="effort-switch-tick"]')).toHaveLength(0);
  });

  it('visible pill height matches the thumb/fill bar (slim h-3.5, not h-5)', () => {
    // User-reported: command menu showed the visible frame oversized
    // relative to thumb/fill — wanted the slim "inner bar" look as the
    // canonical visual, with the larger box reserved for the click hit
    // area. Track height collapses to h-3.5 to match thumb + fill.
    const { container } = render(<EffortSwitch level="medium" levels={LEVELS} />);
    const track = container.querySelector('[data-testid="effort-switch-track"]')! as HTMLElement;
    const fill = container.querySelector('[data-testid="effort-switch-fill"]')! as HTMLElement;
    expect(track.className).toMatch(/\bh-3\.5\b/);
    expect(fill.className).toMatch(/\b(h-3\.5|h-full)\b/);
  });

  it('focus ring owner must not be the same element that clips overflow', () => {
    const { container } = render(<EffortSwitch level="low" levels={LEVELS} />);
    const focusOwner = container.querySelector('[data-testid="effort-switch"]')!;
    expect(focusOwner.className).toMatch(/focus-visible:ring-/);
    expect(focusOwner.className).not.toMatch(/overflow-hidden/);
    const clipper = container.querySelector('[data-testid="effort-switch-track"]')!;
    expect(clipper.className).toMatch(/overflow-hidden/);
  });

  it('fill uses container% + CSS var for thumb size (density + font-size adaptive)', () => {
    const low = render(<EffortSwitch level="low" levels={LEVELS} />).container.querySelector(
      '[data-testid="effort-switch-fill"]',
    )! as HTMLElement;
    expect(low.style.width).toMatch(/100%/);
    expect(low.style.width).toMatch(/var\(--spacing\)\s*\*\s*3\.5/);

    const max = render(<EffortSwitch level="max" levels={LEVELS} />).container.querySelector(
      '[data-testid="effort-switch-fill"]',
    )! as HTMLElement;
    expect(max.style.width).toMatch(/100%/);
    expect(max.style.width).not.toMatch(/\b\d+px\b/);
  });

  it('thumb edges align flush with pill edges (no overhang)', () => {
    const max = render(<EffortSwitch level="max" levels={LEVELS} />).container.querySelector(
      '[data-testid="effort-switch-thumb"]',
    )! as HTMLElement;
    // (100% - thumb) * 1 → at max the formula puts thumb's left edge so its
    // right edge sits flush with 100% — never overhangs.
    expect(max.style.left).toMatch(/100%/);
    expect(max.style.left).toMatch(/-/);
    expect(max.style.left).not.toMatch(/\b\d+px\b/);
  });
});
