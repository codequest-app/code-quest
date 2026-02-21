import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PermissionModeSelector } from '../PermissionModeSelector';

describe('PermissionModeSelector', () => {
  it('should render default and acceptEdits options', () => {
    render(<PermissionModeSelector />);

    const select = screen.getByTestId('permission-mode-selector');
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue('default');
    expect(options[1]).toHaveValue('acceptEdits');
  });

  it('should reflect current value', () => {
    render(<PermissionModeSelector currentMode="acceptEdits" />);

    const select = screen.getByTestId('permission-mode-selector') as HTMLSelectElement;
    expect(select.value).toBe('acceptEdits');
  });

  it('should call onModeChange when selection changes', () => {
    const onModeChange = vi.fn();
    render(<PermissionModeSelector currentMode="default" onModeChange={onModeChange} />);

    fireEvent.change(screen.getByTestId('permission-mode-selector'), {
      target: { value: 'acceptEdits' },
    });
    expect(onModeChange).toHaveBeenCalledWith('acceptEdits');
  });
});
