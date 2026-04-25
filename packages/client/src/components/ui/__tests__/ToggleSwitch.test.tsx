import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToggleSwitch } from '../ToggleSwitch';

describe('ToggleSwitch', () => {
  it('exposes role="switch" with aria-checked when interactive', () => {
    render(<ToggleSwitch isOn={true} onClick={vi.fn()} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('aria-checked reflects off state', () => {
    render(<ToggleSwitch isOn={false} onClick={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ToggleSwitch isOn={false} onClick={onClick} />);
    await user.click(screen.getByRole('switch'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('toggles via Space key (Radix-supplied)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ToggleSwitch isOn={false} onClick={onClick} />);
    screen.getByRole('switch').focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders display-only (no role="switch") when onClick is omitted', () => {
    render(<ToggleSwitch isOn={true} />);
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
