import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChoicePills } from '../ChoicePills.tsx';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('ChoicePills', () => {
  it('renders one radio per option', () => {
    render(<ChoicePills options={OPTIONS} currentValue="a" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the current value as checked', () => {
    render(<ChoicePills options={OPTIONS} currentValue="b" onSelect={vi.fn()} />);
    const checked = screen
      .getAllByRole('radio')
      .filter((r) => r.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName('Beta');
  });

  it('calls onSelect on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ChoicePills options={OPTIONS} currentValue="a" onSelect={onSelect} />);
    await user.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('exposes a horizontal radiogroup (Radix-supplied roving focus)', () => {
    render(<ChoicePills options={OPTIONS} currentValue="a" onSelect={vi.fn()} />);
    // Radix RadioGroup wraps in a role="radiogroup" element with
    // data-orientation. Roving focus / arrow nav are Radix-internal
    // (RovingFocusGroup) and trusted via upstream tests; jsdom keyboard
    // event propagation makes asserting the actual arrow result flaky.
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(3);
  });
});
