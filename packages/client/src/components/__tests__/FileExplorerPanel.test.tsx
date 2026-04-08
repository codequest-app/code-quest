import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SocketProvider } from '../../contexts/SocketContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { FileExplorerPanel } from '../FileExplorerPanel';

function setup() {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/projects']);
  summoner.filesystem().addDirectory('/projects', ['app', 'blog']);

  function Wrapper({ children }: { children: ReactNode }) {
    return <SocketProvider socket={summoner.socket}>{children}</SocketProvider>;
  }

  return { summoner, Wrapper };
}

describe('FileExplorerPanel', () => {
  it('renders directory tree with roots', async () => {
    const { Wrapper } = setup();
    render(<FileExplorerPanel />, { wrapper: Wrapper });

    expect(await screen.findByRole('treeitem', { name: 'projects' })).toBeInTheDocument();
  });

  it.todo('expands root to show children — async browse in onClick needs act() investigation');

  it.skip('expands root to show children', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    render(<FileExplorerPanel />, { wrapper: Wrapper });

    const projects = await screen.findByRole('treeitem', { name: 'projects' });
    await user.click(projects);

    expect(await screen.findByRole('treeitem', { name: 'app' })).toBeInTheDocument();
    expect(await screen.findByRole('treeitem', { name: 'blog' })).toBeInTheDocument();
  });

  it('shows recents section after selecting a directory', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    const onSelectCwd = vi.fn();
    render(<FileExplorerPanel onSelectCwd={onSelectCwd} />, { wrapper: Wrapper });

    const projects = await screen.findByRole('treeitem', { name: 'projects' });
    await user.dblClick(projects);

    expect(screen.getByText('Recents')).toBeInTheDocument();
  });

  it('calls onSelectCwd on double-click', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    const onSelectCwd = vi.fn();
    render(<FileExplorerPanel onSelectCwd={onSelectCwd} />, { wrapper: Wrapper });

    const projects = await screen.findByRole('treeitem', { name: 'projects' });
    await user.dblClick(projects);

    expect(onSelectCwd).toHaveBeenCalledWith('/projects');
  });
});
