import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Feature } from '@/lib/feature';
import { toMenuItem } from '../to-menu-item.tsx';

const base = (override: Partial<Feature> = {}): Feature => ({
  id: 'x',
  label: 'X',
  section: 'Settings',
  execute: vi.fn(),
  ...override,
});

describe('toMenuItem', () => {
  it('maps basic fields id/label/section/order/description/disabled', () => {
    const f = base({ order: 5, description: '(help)', disabled: true });
    const out = toMenuItem(f);
    expect(out.id).toBe('x');
    expect(out.menuItem.label).toBe('X');
    expect(out.menuItem.section).toBe('Settings');
    expect(out.menuItem.order).toBe(5);
    expect(out.menuItem.description).toBe('(help)');
    expect(out.menuItem.disabled).toBe(true);
  });

  it('closeSilent defaults to false when no state', () => {
    expect(toMenuItem(base()).menuItem.closeSilent).toBe(false);
  });

  it('closeSilent defaults to true when state is toggle', () => {
    const f = base({ state: { kind: 'toggle', active: true } });
    expect(toMenuItem(f).menuItem.closeSilent).toBe(true);
  });

  it('ui.closeSilent overrides the state-based default', () => {
    const f = base({
      state: { kind: 'toggle', active: true },
      ui: { closeSilent: false },
    });
    expect(toMenuItem(f).menuItem.closeSilent).toBe(false);
  });

  it('passes ui.matchFirstToken and filterOnly through', () => {
    const f = base({ ui: { matchFirstToken: true, filterOnly: true } });
    const out = toMenuItem(f);
    expect(out.menuItem.matchFirstToken).toBe(true);
    expect(out.menuItem.filterOnly).toBe(true);
  });

  it('renders toggle state as trailing ToggleSwitch (per-feature testid)', () => {
    const f = base({ state: { kind: 'toggle', active: true } });
    const out = toMenuItem(f);
    render(out.menuItem.trailing);
    // menu surface keeps ToggleSwitch; adapter tags it with feature id
    expect(screen.getByRole('status', { name: 'x-switch' })).toHaveAttribute('data-state', 'on');
  });

  it('no trailing when no state', () => {
    expect(toMenuItem(base()).menuItem.trailing).toBeUndefined();
  });

  it('execute is the same function reference', () => {
    const execute = vi.fn();
    const f = base({ execute });
    toMenuItem(f).execute();
    expect(execute).toHaveBeenCalledOnce();
  });
});
