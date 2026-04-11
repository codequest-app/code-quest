import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActivityBar, type ActivityBarItem } from '../ActivityBar';

const items: ActivityBarItem[] = [
  { id: 'explorer', icon: '📁', title: 'Explorer' },
  { id: 'history', icon: '🕐', title: 'History' },
];

describe('ActivityBar', () => {
  it('renders an icon button for each item', () => {
    render(<ActivityBar items={items} activePanel={null} onToggle={vi.fn()} />);

    expect(screen.getByTitle('Explorer')).toBeInTheDocument();
    expect(screen.getByTitle('History')).toBeInTheDocument();
  });

  it('calls onToggle with item id when clicked', async () => {
    const onToggle = vi.fn();
    render(<ActivityBar items={items} activePanel={null} onToggle={onToggle} />);

    await userEvent.click(screen.getByTitle('Explorer'));
    expect(onToggle).toHaveBeenCalledWith('explorer');
  });

  it('calls onToggle with null when clicking the active panel (toggle off)', async () => {
    const onToggle = vi.fn();
    render(<ActivityBar items={items} activePanel="explorer" onToggle={onToggle} />);

    await userEvent.click(screen.getByTitle('Explorer'));
    expect(onToggle).toHaveBeenCalledWith(null);
  });

  it('applies active indicator to the selected panel icon', () => {
    render(<ActivityBar items={items} activePanel="explorer" onToggle={vi.fn()} />);

    const explorerBtn = screen.getByTitle('Explorer');
    const historyBtn = screen.getByTitle('History');
    expect(explorerBtn).toHaveAttribute('data-active', 'true');
    expect(historyBtn).toHaveAttribute('data-active', 'false');
  });
});
