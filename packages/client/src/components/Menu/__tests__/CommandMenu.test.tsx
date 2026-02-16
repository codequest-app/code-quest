import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CommandMenuItem } from '../CommandMenu';
import { CommandMenu } from '../CommandMenu';

const items: CommandMenuItem[] = [
  { id: 's1', label: 'Claude 1' },
  { id: 's2', label: 'Claude 2', hasBattle: true },
  { id: 's3', label: 'Terminal 1' },
];

describe('CommandMenu', () => {
  it('renders menu items', () => {
    render(<CommandMenu items={items} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('command-menu')).toBeDefined();
    expect(screen.getByTestId('menu-item-s1')).toHaveTextContent('Claude 1');
    expect(screen.getByTestId('menu-item-s2')).toHaveTextContent('Claude 2');
  });

  it('shows battle indicator', () => {
    render(<CommandMenu items={items} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('battle-indicator')).toBeDefined();
  });

  it('highlights active item', () => {
    render(<CommandMenu items={items} activeId="s2" onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('menu-item-s2').className).toContain('active');
  });

  it('navigates with arrow keys', () => {
    render(<CommandMenu items={items} onSelect={vi.fn()} onClose={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    // Second item should now have cursor
    expect(screen.getByTestId('menu-item-s2').textContent).toContain('▶');
  });

  it('calls onSelect on Enter', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<CommandMenu items={items} onSelect={onSelect} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('s1');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<CommandMenu items={items} onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
