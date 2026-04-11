import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SocketProvider } from '../../contexts/SocketContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { FileTree } from '../FileTree';

function setup() {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/projects']);
  summoner.filesystem().addDirectory('/projects', ['app', 'blog']);
  summoner.filesystem().addDirectory('/projects/app', ['src', 'tests']);

  function Wrapper({ children }: { children: ReactNode }) {
    return <SocketProvider socket={summoner.socket}>{children}</SocketProvider>;
  }

  return { summoner, Wrapper };
}

describe('FileTree', () => {
  it('renders root directories on mount', async () => {
    const { Wrapper } = setup();
    render(<FileTree />, { wrapper: Wrapper });

    expect(await screen.findByRole('treeitem', { name: 'projects' })).toBeInTheDocument();
  });

  it('expands directory on click to show children', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    render(<FileTree />, { wrapper: Wrapper });

    const projects = await screen.findByRole('treeitem', { name: 'projects' });
    await user.click(projects);

    expect(await screen.findByRole('treeitem', { name: 'app' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'blog' })).toBeInTheDocument();
  });

  it('shows context menu on right-click with Open in New Tab', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    const onSelect = vi.fn();
    render(<FileTree onSelect={onSelect} />, { wrapper: Wrapper });

    const projects = await screen.findByRole('treeitem', { name: 'projects' });
    await user.pointer({ keys: '[MouseRight]', target: projects });

    expect(screen.getByText('Open in New Tab')).toBeInTheDocument();
  });

  it('context menu Open in New Tab fires onSelect', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    const onSelect = vi.fn();
    render(<FileTree onSelect={onSelect} />, { wrapper: Wrapper });

    const projects = await screen.findByRole('treeitem', { name: 'projects' });
    await user.pointer({ keys: '[MouseRight]', target: projects });
    await user.click(screen.getByText('Open in New Tab'));

    expect(onSelect).toHaveBeenCalledWith('/projects');
    expect(screen.queryByText('Open in New Tab')).not.toBeInTheDocument();
  });

  it('fires onSelect when directory is double-clicked', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    const onSelect = vi.fn();
    render(<FileTree onSelect={onSelect} />, { wrapper: Wrapper });

    const projects = await screen.findByRole('treeitem', { name: 'projects' });
    await user.dblClick(projects);

    expect(onSelect).toHaveBeenCalledWith('/projects');
  });
});
