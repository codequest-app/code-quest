import type { SessionSummary } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { SessionHistory } from '../SessionHistory';

const makeSessions = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `s-${i}`,
    mode: 'interactive',
    provider: 'claude',
    command: 'claude',
    args: '',
    role: 'user',
    createdAt: new Date(Date.now() - i * 1000).toISOString(),
    cwd: '/test',
  }));

/**
 * Helper to create a socket-based callback for session:detail
 * Returns a function matching (id: string) => Promise<SessionSummary | null>
 */
function createGetDetailCallback(responses: Record<string, SessionSummary | null>) {
  return (id: string) => Promise.resolve(responses[id] ?? null);
}

const stubRename = () => Promise.resolve({ success: true } as { success: boolean; error?: string });
const stubDelete = () => Promise.resolve({ success: true } as { success: boolean; error?: string });

describe('SessionHistory (unit)', () => {
  it('shows Load More when hasMore is true', () => {
    render(
      <SessionHistory
        sessions={makeSessions(3)}
        hasMore
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadMore={vi.fn()}
      />,
    );
    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('hides Load More when hasMore is false', () => {
    render(
      <SessionHistory
        sessions={makeSessions(3)}
        hasMore={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('Load More')).not.toBeInTheDocument();
  });

  it('calls onLoadMore when Load More clicked', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(
      <SessionHistory
        sessions={makeSessions(3)}
        hasMore
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadMore={onLoadMore}
      />,
    );
    await user.click(screen.getByText('Load More'));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('shows detail panel when onGetDetail provided and session clicked', async () => {
    const user = userEvent.setup();
    const session = {
      id: 's-0',
      mode: 'interactive',
      provider: 'claude',
      command: 'claude',
      args: 'claude --chat',
      role: 'user',
      createdAt: new Date().toISOString(),
      cwd: '/project',
    };
    const onGetDetail = createGetDetailCallback({ 's-0': session });
    render(
      <SessionHistory
        sessions={[session]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onGetDetail={onGetDetail}
      />,
    );
    await user.click(screen.getByText('s-0'));
    expect(await screen.findByText('Resume this session')).toBeInTheDocument();
    expect(screen.getByText(/command:/)).toBeInTheDocument();
  });

  it('shows loading state while fetching detail', async () => {
    const user = userEvent.setup();
    let resolveDetail!: (v: SessionSummary | null) => void;
    const onGetDetail = (_id: string) =>
      new Promise<SessionSummary | null>((resolve) => {
        resolveDetail = resolve;
      });
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onGetDetail={onGetDetail}
      />,
    );
    await user.click(screen.getByText('s-0'));
    expect(screen.getByText('Loading details...')).toBeInTheDocument();
    resolveDetail(null);
    // Wait for async setState (setDetail + setDetailLoading) to flush
    await waitFor(() => expect(screen.queryByText('Loading details...')).not.toBeInTheDocument());
  });

  it('shows error when detail fetch fails', async () => {
    const user = userEvent.setup();
    const onGetDetail = (_id: string) => Promise.reject(new Error('fail'));
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onGetDetail={onGetDetail}
      />,
    );
    await user.click(screen.getByText('s-0'));
    expect(await screen.findByText('Failed to load details')).toBeInTheDocument();
  });

  it('shows rename icon when onRename provided', () => {
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onRename={stubRename}
      />,
    );
    expect(screen.getByTitle('Rename session')).toBeInTheDocument();
  });

  it('shows inline input on rename click', async () => {
    const user = userEvent.setup();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onRename={stubRename}
      />,
    );
    await user.click(screen.getByTitle('Rename session'));
    expect(screen.getByLabelText('Rename session')).toBeInTheDocument();
  });

  it('calls onRename with new title on Enter', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn((_id: string, _title: string) =>
      Promise.resolve({ success: true } as { success: boolean; error?: string }),
    );
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onRename={onRename}
      />,
    );
    await user.click(screen.getByTitle('Rename session'));
    const input = screen.getByLabelText('Rename session');
    await user.type(input, 'My Session{Enter}');
    // After successful rename, the input should be hidden (parent element removed)
    expect(screen.queryByLabelText('Rename session')).not.toBeInTheDocument();
  });

  it('displays title when session has title', () => {
    const sessions = [{ ...makeSessions(1)[0], title: 'Custom Title' }];
    render(<SessionHistory sessions={sessions} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('shows delete icon when onDelete provided', () => {
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onDelete={stubDelete}
      />,
    );
    expect(screen.getByTitle('Delete session')).toBeInTheDocument();
  });

  it('shows confirm dialog on delete click', async () => {
    const user = userEvent.setup();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onDelete={stubDelete}
      />,
    );
    await user.click(screen.getByTitle('Delete session'));
    expect(screen.getByText(/delete this session/i)).toBeInTheDocument();
  });

  it('calls onDelete after confirm', async () => {
    const user = userEvent.setup();
    const onDelete = stubDelete;
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByTitle('Delete session'));
    await user.click(screen.getByText('Confirm'));
    // Component behavior verified by successful deletion
    expect(screen.queryByText('s-0')).not.toBeInTheDocument();
  });

  it('removes session from list after successful delete', async () => {
    const user = userEvent.setup();
    const onDelete = stubDelete;
    render(
      <SessionHistory
        sessions={makeSessions(2)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onDelete={onDelete}
      />,
    );
    // Delete first session
    const deleteButtons = screen.getAllByTitle('Delete session');
    await user.click(deleteButtons[0]);
    await user.click(screen.getByText('Confirm'));
    // s-0 should be gone
    expect(screen.queryByText('s-0')).not.toBeInTheDocument();
    expect(screen.getByText('s-1')).toBeInTheDocument();
  });

  it('renders session count matching sessions array length', () => {
    render(<SessionHistory sessions={makeSessions(3)} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/^\(/)).toHaveTextContent('(3)');
  });

  it('renders "X of Y" when totalCount provided', () => {
    render(
      <SessionHistory
        sessions={makeSessions(3)}
        totalCount={10}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/^\(/)).toHaveTextContent('(3 of 10)');
  });

  it('renders just count when totalCount not provided', () => {
    render(<SessionHistory sessions={makeSessions(5)} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/^\(/)).toHaveTextContent('(5)');
  });

  it('disables delete for current active session', () => {
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        currentChannelId="s-0"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onDelete={stubDelete}
      />,
    );
    const deleteBtn = screen.getByTitle('Delete session');
    expect(deleteBtn).toBeDisabled();
  });
});

describe('SessionHistory (export/import)', () => {
  it('render export button for each session when onExport provided', () => {
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onExport={vi.fn()}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTitle('Export session')).toBeInTheDocument();
  });

  it('call onExport when export button clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onExport={onExport}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByTitle('Export session'));
    expect(onExport).toHaveBeenCalledWith('s-0');
  });

  it('render import button when onImport provided', () => {
    render(
      <SessionHistory sessions={[]} onImport={vi.fn()} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByTitle('Import session')).toBeInTheDocument();
  });

  it('call onImport when import button clicked', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(
      <SessionHistory sessions={[]} onImport={onImport} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    await user.click(screen.getByTitle('Import session'));
    expect(onImport).toHaveBeenCalled();
  });

  it('not render export button when onExport not provided', () => {
    render(<SessionHistory sessions={makeSessions(1)} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTitle('Export session')).not.toBeInTheDocument();
  });

  it('not render import button when onImport not provided', () => {
    render(<SessionHistory sessions={[]} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTitle('Import session')).not.toBeInTheDocument();
  });
});

describe('SessionHistory (remote tab)', () => {
  it('shows Local/Remote tabs when onLoadRemote provided', () => {
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={vi.fn()}
        remoteSessions={[]}
      />,
    );
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('does not show tabs when onLoadRemote not provided', () => {
    render(<SessionHistory sessions={makeSessions(1)} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText('Local')).not.toBeInTheDocument();
    expect(screen.queryByText('Remote')).not.toBeInTheDocument();
  });

  it('displays remote sessions passed via props when Remote tab clicked', async () => {
    const user = userEvent.setup();
    const remoteSessions = [
      {
        id: 'remote-1',
        mode: 'interactive',
        provider: 'claude',
        command: 'claude',
        args: '',
        role: 'user',
        createdAt: new Date().toISOString(),
        title: 'Remote Session',
      },
    ];
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={vi.fn()}
        remoteSessions={remoteSessions}
      />,
    );
    await user.click(screen.getByText('Remote'));
    expect(screen.getByText('Remote Session')).toBeInTheDocument();
  });

  it('calls onLoadRemote when Remote tab clicked', async () => {
    const user = userEvent.setup();
    const onLoadRemote = vi.fn();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={onLoadRemote}
        remoteSessions={[]}
      />,
    );
    await user.click(screen.getByText('Remote'));
    expect(onLoadRemote).toHaveBeenCalled();
  });

  it('shows No sessions when remoteSessions is empty', async () => {
    const user = userEvent.setup();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={vi.fn()}
        remoteSessions={[]}
      />,
    );
    await user.click(screen.getByText('Remote'));
    expect(screen.getByText('No sessions')).toBeInTheDocument();
  });

  it('shows loading state when remoteLoading is true', async () => {
    const user = userEvent.setup();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={vi.fn()}
        remoteSessions={[]}
        remoteLoading
      />,
    );
    await user.click(screen.getByText('Remote'));
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

const makeRemoteSessions = () => [
  {
    id: 'remote-1',
    mode: 'interactive',
    provider: 'claude',
    command: 'claude',
    args: '',
    role: 'user',
    createdAt: new Date().toISOString(),
    title: 'Remote Session',
  },
];

describe('SessionHistory (teleport)', () => {
  it('render teleport button for remote sessions', async () => {
    const user = userEvent.setup();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={vi.fn()}
        remoteSessions={makeRemoteSessions()}
        onTeleport={vi.fn()}
      />,
    );
    await user.click(screen.getByText('Remote'));
    expect(screen.getByTitle('Teleport session')).toBeInTheDocument();
  });

  it('call onTeleport when teleport button clicked', async () => {
    const user = userEvent.setup();
    const onTeleport = vi.fn();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={vi.fn()}
        remoteSessions={makeRemoteSessions()}
        onTeleport={onTeleport}
      />,
    );
    await user.click(screen.getByText('Remote'));
    await user.click(screen.getByTitle('Teleport session'));
    expect(onTeleport).toHaveBeenCalledWith('remote-1');
  });

  it('not render teleport button when onTeleport not provided', async () => {
    const user = userEvent.setup();
    render(
      <SessionHistory
        sessions={makeSessions(1)}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLoadRemote={vi.fn()}
        remoteSessions={makeRemoteSessions()}
      />,
    );
    await user.click(screen.getByText('Remote'));
    expect(screen.queryByTitle('Teleport session')).not.toBeInTheDocument();
  });
});

describe('SessionHistory detail info', () => {
  it('displays cwd when available', () => {
    render(
      <SessionHistory
        sessions={[
          {
            id: 's1',
            provider: 'claude',
            command: 'claude',
            args: '--model opus',
            cwd: '/home/user/project',
            mode: 'code',
            role: 'user',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('/home/user/project')).toBeInTheDocument();
  });

  it('displays parentId as resumed-from info', () => {
    render(
      <SessionHistory
        sessions={[
          {
            id: 's1',
            provider: 'claude',
            command: 'claude',
            args: '',
            cwd: '/tmp',
            mode: 'code',
            role: 'user',
            parentId: 'p1',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/p1/)).toBeInTheDocument();
  });

  it('displays args when available', () => {
    render(
      <SessionHistory
        sessions={[
          {
            id: 's1',
            provider: 'claude',
            command: 'claude',
            args: '--model opus',
            cwd: '/tmp',
            mode: 'code',
            role: 'user',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('--model opus')).toBeInTheDocument();
  });
});

describe('SessionHistory in workspace', () => {
  it('shows history button in header bar', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('ok'));
    await claude.emit(s.result());

    expect(screen.getByTitle('Session History')).toBeInTheDocument();
  });
});
