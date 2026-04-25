import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EffortSwitch } from '../EffortSwitch';

const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];

function renderSwitch(level?: string) {
  return render(<EffortSwitch level={level} levels={LEVELS} />);
}

describe('EffortSwitch visual contract', () => {
  it('thumb is vertically centered in track', () => {
    const { container } = renderSwitch('low');
    // Thumb is the last absolute div (rendered after fill + notches).
    const thumb = container.querySelector('[data-testid="effort-switch-thumb"]');
    expect(thumb).not.toBeNull();
    const cls = thumb!.className;
    expect(cls).toMatch(/top-1\/2/);
    expect(cls).toMatch(/-translate-y-1\/2/);
  });

  it('thumb has a subtle ring so it stays visible on any mode-accent fill', () => {
    const { container } = renderSwitch('low');
    const thumb = container.querySelector('[data-testid="effort-switch-thumb"]')!;
    expect(thumb.className).toMatch(/ring-/);
  });

  it('renders ticks only for positions after the thumb — count-adaptive', () => {
    // count=5 idx=0 → 4 ticks (at 1,2,3,4)
    const atLow = renderSwitch('low').container.querySelectorAll(
      '[data-testid="effort-switch-tick"]',
    );
    expect(atLow.length).toBe(LEVELS.length - 1);

    // count=5 idx=2 (high) → 2 ticks (at 3,4)
    const atHigh = renderSwitch('high').container.querySelectorAll(
      '[data-testid="effort-switch-tick"]',
    );
    expect(atHigh.length).toBe(2);

    // count=5 idx=4 (max) → 0 ticks (thumb consumed all)
    const atMax = renderSwitch('max').container.querySelectorAll(
      '[data-testid="effort-switch-tick"]',
    );
    expect(atMax.length).toBe(0);

    // count=4 idx=0 → 3 ticks
    const fourLevels = ['low', 'medium', 'high', 'max'];
    const { container } = render(<EffortSwitch level="low" levels={fourLevels} />);
    const fourTicks = container.querySelectorAll('[data-testid="effort-switch-tick"]');
    expect(fourTicks.length).toBe(fourLevels.length - 1);
  });

  it('focus ring owner must not be the same element that clips overflow', () => {
    const { container } = renderSwitch('low');
    const focusOwner = container.querySelector('[data-testid="effort-switch"]')!;
    expect(focusOwner.className).toMatch(/focus-visible:ring-/);
    expect(focusOwner.className).not.toMatch(/overflow-hidden/);
    const clipper = container.querySelector('[data-testid="effort-switch-track"]')!;
    expect(clipper.className).toMatch(/overflow-hidden/);
  });

  it('fill formula uses container% and CSS var for thumb size (density + font-size adaptive)', () => {
    // At idx=0: fill = thumb width (scales via --spacing, matches w-3.5).
    const low = renderSwitch('low').container.querySelector(
      '[data-testid="effort-switch-fill"]',
    )! as HTMLElement;
    expect(low.style.width).toMatch(/100%/);
    expect(low.style.width).toMatch(/var\(--spacing\)\s*\*\s*3\.5/);

    // At idx=max: fill covers 100% of container — no hardcoded px.
    const max = renderSwitch('max').container.querySelector(
      '[data-testid="effort-switch-fill"]',
    )! as HTMLElement;
    expect(max.style.width).toMatch(/100%/);
    expect(max.style.width).not.toMatch(/\b\d+px\b/);
  });

  it('thumb position uses container% (no hardcoded px)', () => {
    const max = renderSwitch('max').container.querySelector(
      '[data-testid="effort-switch-thumb"]',
    )! as HTMLElement;
    expect(max.style.left).toMatch(/100%/);
    expect(max.style.left).not.toMatch(/\b\d+px\b/);
    expect(max.className).toMatch(/\bbg-white\b/);
  });

  it('tick color is theme-adaptive (uses text token with opacity modifier)', () => {
    const { container } = renderSwitch('low');
    const ticks = container.querySelectorAll('[data-testid="effort-switch-tick"]');
    for (const tick of ticks) {
      expect(tick.className).not.toMatch(/bg-text-muted\/30/);
      expect(tick.className).toMatch(/\bbg-text\/35\b/);
    }
  });
});
