import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Feature } from '../../feature';
import { toPaletteCommand } from '../to-palette-command';

const base = (over: Partial<Feature> = {}): Feature => ({
  id: 'x',
  label: 'X',
  section: 'Settings',
  execute: vi.fn(),
  ...over,
});

describe('toPaletteCommand', () => {
  it('maps basic fields', () => {
    const f = base({ description: 'short help' });
    const out = toPaletteCommand(f);
    expect(out.id).toBe('x');
    expect(out.label).toBe('X');
    expect(out.section).toBe('Settings');
    expect(out.description).toBe('short help');
  });

  it('onExecute equals feature.execute', () => {
    const execute = vi.fn();
    toPaletteCommand(base({ execute })).onExecute();
    expect(execute).toHaveBeenCalledOnce();
  });

  it('renders trailing for toggle state as ON/OFF pill (palette pill vocabulary)', () => {
    const f = base({ state: { kind: 'toggle', active: false } });
    render(<>{toPaletteCommand(f).trailing}</>);
    // palette surface renders toggle as pill (same as filter group pill) —
    // adapter tags the pill with the feature id so surface tests can target it
    const pill = screen.getByTestId('x-toggle');
    expect(pill).toHaveAttribute('data-state', 'none');
    expect(pill.textContent).toBe('OFF');
  });

  it('renders trailing for select state', () => {
    const f = base({ state: { kind: 'select', currentValue: 'dark' } });
    render(<>{toPaletteCommand(f).trailing}</>);
    expect(screen.getByTestId('select-current')).toHaveTextContent('dark');
  });

  it('no trailing when no state', () => {
    expect(toPaletteCommand(base()).trailing).toBeUndefined();
  });
});
