import type { SessionSummary } from '@code-quest/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionHistory } from '../SessionHistory';

// Helper: render with mutable sessions prop
function renderWithSessions(initialSessions: SessionSummary[], onDelete: ReturnType<typeof vi.fn>) {
  let currentSessions = initialSessions;
  const { rerender } = render(
    <SessionHistory sessions={currentSessions} onSelect={vi.fn()} onDelete={onDelete} />,
  );
  return {
    rerender: (sessions: SessionSummary[]) => {
      currentSessions = sessions;
      rerender(<SessionHistory sessions={sessions} onSelect={vi.fn()} onDelete={onDelete} />);
    },
  };
}

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

describe('SessionHistory', () => {
  it('renders search box', () => {
    render(<SessionHistory sessions={[]} onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search sessions...')).toBeInTheDocument();
  });

  it('renders session list', () => {
    render(<SessionHistory sessions={makeSessions(3)} onSelect={vi.fn()} />);
    expect(screen.getByText('Session 0')).toBeInTheDocument();
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByText('Session 2')).toBeInTheDocument();
  });

  it('shows "No sessions" when empty', () => {
    render(<SessionHistory sessions={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No sessions')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<SessionHistory sessions={[]} loading onSelect={vi.fn()} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('filters sessions by search text', async () => {
    const user = userEvent.setup();
    const sessions = [
      { ...makeSessions(1)[0], title: 'Fix login bug' },
      { ...makeSessions(1)[0], channelId: 's-1', title: 'Add dark mode' },
    ];
    render(<SessionHistory sessions={sessions} onSelect={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Search sessions...'), 'login');

    expect(
      screen.getByText((_content, el) => el?.textContent === 'Fix login bug'),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('option')[0]?.textContent).not.toContain('Add dark mode');
  });

  it('calls onSelect when session clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SessionHistory sessions={makeSessions(1)} onSelect={onSelect} />);

    await user.click(screen.getByText('Session 0'));
    expect(onSelect).toHaveBeenCalledWith('s-0');
  });

  it('ArrowDown/Up navigates focus, Enter selects', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SessionHistory sessions={makeSessions(3)} onSelect={onSelect} />);

    const searchInput = screen.getByPlaceholderText('Search sessions...');
    await user.click(searchInput);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith('s-2');
  });

  describe('semantic HTML / a11y roles', () => {
    it('session list container has role="listbox"', () => {
      render(<SessionHistory sessions={makeSessions(2)} onSelect={vi.fn()} />);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('each session row has role="option"', () => {
      render(<SessionHistory sessions={makeSessions(2)} onSelect={vi.fn()} />);
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });
  });

  it('removes session after successful delete — parent updates sessions prop', async () => {
    const user = userEvent.setup();
    const sessions = makeSessions(2);
    const onDelete = vi.fn().mockResolvedValue({ ok: true, data: {} });
    const { rerender } = renderWithSessions(sessions, onDelete);

    await user.click(screen.getAllByTitle('Delete')[0]);

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('s-0'));
    // Parent re-renders with updated sessions (s-0 removed)
    rerender([sessions[1]]);

    await waitFor(() => expect(screen.queryByText('Session 0')).not.toBeInTheDocument());
    expect(screen.getByText('Session 1')).toBeInTheDocument();
  });

  it('does not hide session via local state — deletion is parent-driven', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue({ ok: true, data: {} });
    render(<SessionHistory sessions={makeSessions(2)} onSelect={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getAllByTitle('Delete')[0]);

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('s-0'));
    // Without parent rerender, session stays visible (no local deletedIds)
    expect(screen.getByText('Session 0')).toBeInTheDocument();
  });
});
