import type { SessionSummary } from '@code-quest/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionListPage } from '../SessionListPage';

vi.mock('../../contexts/SessionContext', () => ({
  useSession: () => ({ listSessions: mockListSessionsFn }),
}));

let mockListSessionsFn: (opts: {
  limit: number;
  offset: number;
}) => Promise<{ sessions: SessionSummary[]; total: number }>;

const makeSessions = (count: number): SessionSummary[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    provider: 'claude',
    command: 'claude',
    args: '',
    cwd: '/tmp',
    mode: 'code',
    role: 'user' as const,
    createdAt: '2026-01-01T00:00:00Z',
    title: `Session ${i + 1}`,
  }));

function renderPage(
  sessions: SessionSummary[],
  props: { onSelect?: ReturnType<typeof vi.fn>; onJoin?: ReturnType<typeof vi.fn> } = {},
) {
  mockListSessionsFn = async () => ({ sessions, total: sessions.length });
  render(<SessionListPage onSelect={props.onSelect ?? vi.fn()} onJoin={props.onJoin} />);
}

describe('SessionListPage', () => {
  it('renders session list page container', async () => {
    renderPage([]);
    expect(screen.getByTestId('session-list-page')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
  });

  it('loads sessions on mount', async () => {
    const sessions = makeSessions(3);
    renderPage(sessions);

    await waitFor(() => {
      for (const s of sessions) {
        expect(screen.getByText(s.title!)).toBeInTheDocument();
      }
    });
  });

  it('calls onSelect when session is clicked', async () => {
    const sessions = makeSessions(1);
    const onSelect = vi.fn();
    renderPage(sessions, { onSelect });

    await waitFor(() => {
      expect(screen.getByText('Session 1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Session 1'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('shows Join button for active sessions', async () => {
    const sessions: SessionSummary[] = [
      { ...makeSessions(1)[0], isActive: true },
      { ...makeSessions(1)[0], id: 's2', title: 'Inactive', isActive: false },
    ];
    renderPage(sessions, { onJoin: vi.fn() });

    await waitFor(() => {
      expect(screen.getByText('Session 1')).toBeInTheDocument();
    });

    const joinButtons = screen.getAllByRole('button', { name: /join/i });
    expect(joinButtons).toHaveLength(1);
  });

  it('calls onJoin with sessionId when Join button clicked', async () => {
    const sessions: SessionSummary[] = [{ ...makeSessions(1)[0], isActive: true }];
    const onJoin = vi.fn();
    renderPage(sessions, { onJoin });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /join/i }));
    expect(onJoin).toHaveBeenCalledWith('s1');
  });

  it('does not show Join button for inactive sessions', async () => {
    const sessions: SessionSummary[] = [{ ...makeSessions(1)[0], isActive: false }];
    renderPage(sessions, { onJoin: vi.fn() });

    await waitFor(() => {
      expect(screen.getByText('Session 1')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument();
  });
});
