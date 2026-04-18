import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderMenuTrailing, renderPaletteTrailing } from '../trailing-renderers';

describe('renderMenuTrailing', () => {
  it('returns undefined when state is undefined', () => {
    expect(renderMenuTrailing(undefined)).toBeUndefined();
  });

  it('renders ToggleSwitch with active state for kind=toggle', () => {
    render(<>{renderMenuTrailing({ kind: 'toggle', active: true })}</>);
    expect(screen.getByTestId('toggle-switch')).toHaveAttribute('data-state', 'on');
  });

  it('renders tri-state indicator for kind=tri-state', () => {
    render(<>{renderMenuTrailing({ kind: 'tri-state', state: 'all' })}</>);
    expect(screen.getByTestId('tri-state-indicator')).toHaveAttribute('data-state', 'all');
  });

  it('tri-state partial with onPartial is clickable and stopsPropagation', async () => {
    const onPartial = vi.fn();
    const rowClick = vi.fn();
    render(
      <button type="button" onClick={rowClick}>
        {renderMenuTrailing({ kind: 'tri-state', state: 'partial', onPartial })}
      </button>,
    );
    await userEvent.click(screen.getByTestId('tri-state-indicator'));
    expect(onPartial).toHaveBeenCalledOnce();
    expect(rowClick).not.toHaveBeenCalled();
  });

  it('renders current value for kind=select', () => {
    render(<>{renderMenuTrailing({ kind: 'select', currentValue: 'gpt-4' })}</>);
    expect(screen.getByTestId('select-current')).toHaveTextContent('gpt-4');
  });
});

describe('renderPaletteTrailing', () => {
  it('currently shares renderMenuTrailing', () => {
    expect(renderPaletteTrailing).toBe(renderMenuTrailing);
  });
});
