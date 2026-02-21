import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette } from '../CommandPalette';

describe('CommandPalette', () => {
  const commands = [
    { name: 'help', description: 'Show help' },
    { name: 'commit', description: 'Create a commit' },
    { name: 'review-pr', description: 'Review a pull request' },
  ];

  it('should not render when no commands', () => {
    const { container } = render(<CommandPalette />);
    expect(container.innerHTML).toBe('');
  });

  it('should not render when commands is empty', () => {
    const { container } = render(<CommandPalette commands={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render command list', () => {
    render(<CommandPalette commands={commands} />);
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    expect(screen.getByTestId('command-help')).toBeInTheDocument();
    expect(screen.getByTestId('command-commit')).toBeInTheDocument();
    expect(screen.getByTestId('command-review-pr')).toBeInTheDocument();
  });

  it('should call onCommandSelect when command is clicked', () => {
    const onCommandSelect = vi.fn();
    render(<CommandPalette commands={commands} onCommandSelect={onCommandSelect} />);

    fireEvent.click(screen.getByTestId('command-commit'));
    expect(onCommandSelect).toHaveBeenCalledWith('commit');
  });

  it('should filter commands by search', () => {
    render(<CommandPalette commands={commands} />);

    fireEvent.change(screen.getByTestId('command-search'), {
      target: { value: 'commit' },
    });

    expect(screen.getByTestId('command-commit')).toBeInTheDocument();
    expect(screen.queryByTestId('command-help')).not.toBeInTheDocument();
    expect(screen.queryByTestId('command-review-pr')).not.toBeInTheDocument();
  });

  it('should close on Escape key', () => {
    const onClose = vi.fn();
    render(<CommandPalette commands={commands} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
