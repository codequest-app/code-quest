import type { SessionSummary } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionDropdown } from '../SessionDropdown';

const makeSessions = (n: number): SessionSummary[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `s-${i}`,
    channelId: `s-${i}`,
    mode: 'interactive',
    provider: 'claude',
    command: 'claude',
    args: '',
    role: 'user',
    createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
    cwd: '/test',
    projectRoot: '/test',
    title: `Session ${i}`,
  }));

describe('SessionDropdown', () => {
  it('renders overlay and dropdown panel', () => {
    render(<SessionDropdown sessions={makeSessions(1)} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('session-dropdown-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('session-dropdown-panel')).toBeInTheDocument();
  });

  it('closes when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(<SessionDropdown sessions={makeSessions(1)} onSelect={onClose} onClose={onClose} />);
    await userEvent.click(screen.getByTestId('session-dropdown-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    render(<SessionDropdown sessions={makeSessions(1)} onSelect={vi.fn()} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders SessionHistory inside panel', () => {
    render(<SessionDropdown sessions={makeSessions(2)} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Session 0')).toBeInTheDocument();
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search sessions...')).toBeInTheDocument();
  });

  it('calls onSelect when session clicked', async () => {
    const onSelect = vi.fn();
    render(<SessionDropdown sessions={makeSessions(1)} onSelect={onSelect} onClose={vi.fn()} />);
    await userEvent.click(screen.getByText('Session 0'));
    expect(onSelect).toHaveBeenCalledWith('s-0');
  });
});
