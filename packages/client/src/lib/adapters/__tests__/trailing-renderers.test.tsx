import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderPaletteTrailing } from '@/components/palette/to-palette-command';
import { renderMenuTrailing } from '../to-menu-item';

describe('renderMenuTrailing', () => {
  it('returns undefined when state is undefined', () => {
    expect(renderMenuTrailing(undefined)).toBeUndefined();
  });

  it('renders ToggleSwitch with active state for kind=toggle', () => {
    render(renderMenuTrailing({ kind: 'toggle', active: true }));
    expect(screen.getByLabelText('toggle-switch')).toHaveAttribute('data-state', 'on');
  });

  it('renders tri-state indicator for kind=group (aggregate derived from items)', () => {
    render(
      renderMenuTrailing({
        kind: 'group',
        items: [
          { value: 'a', label: 'A', on: true, toggle: () => {} },
          { value: 'b', label: 'B', on: true, toggle: () => {} },
        ],
      }),
    );
    // all items on → aggregate 'all'
    expect(screen.getByLabelText('tri-state-indicator')).toHaveAttribute('data-state', 'all');
  });

  it('derives partial aggregate when some items are on', () => {
    render(
      renderMenuTrailing({
        kind: 'group',
        items: [
          { value: 'a', label: 'A', on: true, toggle: () => {} },
          { value: 'b', label: 'B', on: false, toggle: () => {} },
        ],
      }),
    );
    expect(screen.getByLabelText('tri-state-indicator')).toHaveAttribute('data-state', 'partial');
  });

  it('group kind onPartial is clickable and stopsPropagation (partial state)', async () => {
    const onPartial = vi.fn();
    const rowClick = vi.fn();
    render(
      <button type="button" onClick={rowClick}>
        {renderMenuTrailing({
          kind: 'group',
          items: [
            { value: 'a', label: 'A', on: true, toggle: () => {} },
            { value: 'b', label: 'B', on: false, toggle: () => {} },
          ],
          onPartial,
        })}
      </button>,
    );
    await userEvent.click(screen.getByLabelText('tri-state-indicator'));
    expect(onPartial).toHaveBeenCalledOnce();
    expect(rowClick).not.toHaveBeenCalled();
  });

  it('renders current value for kind=select', () => {
    render(renderMenuTrailing({ kind: 'select', currentValue: 'gpt-4' }));
    expect(screen.getByRole('status', { name: 'select-current' })).toHaveTextContent('gpt-4');
  });

  it('renders pill group for kind=choice with all options visible', async () => {
    const onSelect = vi.fn();
    render(
      renderMenuTrailing({
        kind: 'choice',
        options: [
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
        ],
        currentValue: 'dark',
        onSelect,
      }),
    );
    const darkPill = screen.getByRole('radio', { name: 'Dark' });
    const lightPill = screen.getByRole('radio', { name: 'Light' });
    expect(darkPill).toHaveAttribute('aria-checked', 'true');
    expect(lightPill).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(lightPill);
    expect(onSelect).toHaveBeenCalledWith('light');
  });

  it('renders EffortSwitch (segmented slider) for kind=segmented', () => {
    render(
      renderMenuTrailing({
        kind: 'segmented',
        options: ['low', 'medium', 'high'],
        currentValue: 'medium',
        onSelect: vi.fn(),
      }),
    );
    // EffortSwitch renders a slider with notch dots — presence check via testid
    expect(screen.getByRole('slider', { name: 'Effort level' })).toBeInTheDocument();
  });
});

describe('renderPaletteTrailing', () => {
  it('returns undefined when state is undefined', () => {
    expect(renderPaletteTrailing(undefined)).toBeUndefined();
  });

  it('renders ON pill (tri-state "all") for kind=toggle with active=true', () => {
    render(renderPaletteTrailing({ kind: 'toggle', active: true }));
    const pill = screen.getByLabelText('tri-state-indicator');
    expect(pill).toHaveAttribute('data-state', 'all');
    expect(pill.textContent).toBe('ON');
  });

  it('renders OFF pill (tri-state "none") for kind=toggle with active=false', () => {
    render(renderPaletteTrailing({ kind: 'toggle', active: false }));
    const pill = screen.getByLabelText('tri-state-indicator');
    expect(pill).toHaveAttribute('data-state', 'none');
    expect(pill.textContent).toBe('OFF');
  });

  it('renders tri-state pill for kind=group (palette: partial aggregate from items)', () => {
    render(
      renderPaletteTrailing({
        kind: 'group',
        items: [
          { value: 'a', label: 'A', on: true, toggle: () => {} },
          { value: 'b', label: 'B', on: false, toggle: () => {} },
        ],
      }),
    );
    const pill = screen.getByLabelText('tri-state-indicator');
    expect(pill).toHaveAttribute('data-state', 'partial');
    expect(pill.textContent).toBe('∂');
  });

  it('tags pill with per-feature testid when featureId provided', () => {
    render(renderPaletteTrailing({ kind: 'toggle', active: false }, { featureId: 'raw-panel' }));
    expect(screen.getByLabelText('raw-panel-toggle')).toHaveAttribute('data-state', 'none');
  });

  it('falls back to menu rendering for kind=select (no palette case today)', () => {
    render(renderPaletteTrailing({ kind: 'select', currentValue: 'gpt-4' }));
    expect(screen.getByRole('status', { name: 'select-current' })).toHaveTextContent('gpt-4');
  });
});
