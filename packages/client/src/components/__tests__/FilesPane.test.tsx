import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createFakeSummoner } from '../../test/fake-summoner';
import { FsProvidersWrapper } from '../../test/wrap-fs-providers';
import { FilesPane } from '../FilesPane';

function setup() {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/repo']);
  summoner.filesystem().addDirectory('/repo', []);
  summoner.filesystem().addFile('/repo/README.md', '# hi');
  function Wrapper({ children }: { children: ReactNode }) {
    return <FsProvidersWrapper socket={summoner.socket}>{children}</FsProvidersWrapper>;
  }
  return { summoner, Wrapper };
}

describe('FilesPane', () => {
  it('renders the file tree rooted at cwd (children, not the cwd itself)', async () => {
    const { Wrapper } = setup();
    render(<FilesPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
    expect(await screen.findByRole('treeitem', { name: 'README.md' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'repo' })).toBeNull();
  });

  it('plain click on a file opens preview modal', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    render(<FilesPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });

    await user.click(await screen.findByRole('treeitem', { name: 'README.md' }));

    expect(await screen.findByRole('button', { name: /mention/i })).toBeInTheDocument();
  });

  it('shows "Path outside allowed roots" when cwd is outside fsRoots', async () => {
    const summoner = createFakeSummoner();
    summoner.filesystem().setRoots(['/projA']);
    summoner.filesystem().addDirectory('/projA', []);
    function Wrapper({ children }: { children: ReactNode }) {
      return <FsProvidersWrapper socket={summoner.socket}>{children}</FsProvidersWrapper>;
    }
    render(<FilesPane cwd="/somewhere/outside" onMention={vi.fn()} />, { wrapper: Wrapper });
    expect(await screen.findByText(/path outside allowed roots/i)).toBeInTheDocument();
  });

  it('shows skeleton rows before the file tree root resolves', () => {
    const { Wrapper } = setup();
    render(<FilesPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('switching cwd swaps the tree to the new project root', async () => {
    const summoner = createFakeSummoner();
    summoner.filesystem().setRoots(['/projA', '/projB']);
    summoner.filesystem().addDirectory('/projA', []);
    summoner.filesystem().addFile('/projA/A-only.md', '');
    summoner.filesystem().addDirectory('/projB', []);
    summoner.filesystem().addFile('/projB/B-only.md', '');
    function Wrapper({ children }: { children: ReactNode }) {
      return <FsProvidersWrapper socket={summoner.socket}>{children}</FsProvidersWrapper>;
    }
    const { rerender } = render(<FilesPane cwd="/projA" onMention={vi.fn()} />, {
      wrapper: Wrapper,
    });
    expect(await screen.findByRole('treeitem', { name: 'A-only.md' })).toBeInTheDocument();

    rerender(<FilesPane cwd="/projB" onMention={vi.fn()} />);
    expect(await screen.findByRole('treeitem', { name: 'B-only.md' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'A-only.md' })).toBeNull();
  });

  it('Cmd/Meta+click on a file fires onMention without opening modal', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    const onMention = vi.fn();
    render(<FilesPane cwd="/repo" onMention={onMention} />, { wrapper: Wrapper });

    await user.keyboard('{Meta>}');
    await user.click(await screen.findByRole('treeitem', { name: 'README.md' }));
    await user.keyboard('{/Meta}');

    expect(onMention).toHaveBeenCalledWith('/repo/README.md');
    expect(screen.queryByRole('button', { name: /^mention$/i })).not.toBeInTheDocument();
  });
});
