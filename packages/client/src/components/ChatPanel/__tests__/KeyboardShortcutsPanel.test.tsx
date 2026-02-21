import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KeyboardShortcutsPanel } from '../KeyboardShortcutsPanel';

describe('KeyboardShortcutsPanel', () => {
  it('should render keyboard shortcuts list', () => {
    render(<KeyboardShortcutsPanel onClose={vi.fn()} />);

    expect(screen.getByTestId('keyboard-shortcuts-panel')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+T')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+W')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+B')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
    expect(screen.getByText('Shift+Enter')).toBeInTheDocument();
  });

  it('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsPanel onClose={onClose} />);

    fireEvent.keyDown(screen.getByTestId('keyboard-shortcuts-panel'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsPanel onClose={onClose} />);

    fireEvent.click(screen.getByTestId('shortcuts-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
