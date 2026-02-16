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

  it('shows battle HP percentage', () => {
    const itemsWithHp: CommandMenuItem[] = [
      { id: 's1', label: 'Battle 1', hasBattle: true, battleHpPercent: 75 },
    ];
    render(<CommandMenu items={itemsWithHp} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('battle-indicator')).toHaveTextContent('75%');
  });

  it('shows worktree indicator', () => {
    const itemsWithWt: CommandMenuItem[] = [{ id: 's1', label: 'Worktree', isWorktree: true }];
    render(<CommandMenu items={itemsWithWt} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('menu-item-s1')).toHaveTextContent('🟣');
  });

  it('shows monitor mode badge', () => {
    const itemsWithMonitor: CommandMenuItem[] = [
      { id: 's1', label: 'Session', monitorMode: 'observe' },
    ];
    render(<CommandMenu items={itemsWithMonitor} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('monitor-s1')).toHaveTextContent('👁️');
  });

  it('shows attention badge for battles needing attention', () => {
    const itemsWithAttention: CommandMenuItem[] = [
      { id: 's1', label: 'Session', needsAttention: true },
    ];
    render(<CommandMenu items={itemsWithAttention} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('attention-s1')).toHaveTextContent('❗');
  });

  it('shows background monitor mode', () => {
    const itemsBg: CommandMenuItem[] = [{ id: 's1', label: 'Session', monitorMode: 'background' }];
    render(<CommandMenu items={itemsBg} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('monitor-s1')).toHaveTextContent('🔇');
  });

  it('shows realtime monitor mode', () => {
    const itemsRt: CommandMenuItem[] = [{ id: 's1', label: 'Session', monitorMode: 'realtime' }];
    render(<CommandMenu items={itemsRt} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('monitor-s1')).toHaveTextContent('📺');
  });
});
