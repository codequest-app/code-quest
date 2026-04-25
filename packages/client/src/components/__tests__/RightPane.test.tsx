import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FsProvider } from '../../contexts/FsContext';
import { GitProvider } from '../../contexts/GitContext';
import { OpenspecProvider } from '../../contexts/OpenspecContext';
import { RightPaneScopeProvider } from '../../contexts/RightPaneScopeContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { RightPane } from '../RightPane';

afterEach(() => sessionStorage.clear());

function setup(activeCwd = '/repo') {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/repo']);
  summoner.filesystem().addDirectory('/repo', []);
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SocketProvider socket={summoner.socket}>
        <GitProvider>
          <FsProvider>
            <OpenspecProvider>
              <RightPaneScopeProvider activeCwd={activeCwd}>{children}</RightPaneScopeProvider>
            </OpenspecProvider>
          </FsProvider>
        </GitProvider>
      </SocketProvider>
    );
  }
  return { summoner, Wrapper };
}

describe('RightPane', () => {
  it('renders pane-bar at the top', () => {
    const { Wrapper } = setup();
    render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
    expect(screen.getByTestId('pane-bar-scope-label')).toBeInTheDocument();
  });

  it('renders three tab buttons with accessible names', () => {
    const { Wrapper } = setup();
    render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: /files/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /git/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /spec/i })).toBeInTheDocument();
  });

  it('Files tab is active by default', () => {
    const { Wrapper } = setup();
    render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: /files/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /git/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking a tab updates active selection', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
    await user.click(screen.getByRole('tab', { name: /git/i }));
    expect(screen.getByRole('tab', { name: /git/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /files/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('exposes cwd via data-cwd on the body', () => {
    const { Wrapper } = setup('/repo/cc-office');
    render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
    expect(screen.getByTestId('right-pane-body')).toHaveAttribute('data-cwd', '/repo/cc-office');
  });

  describe('tab strip visual', () => {
    it('renders an icon next to each tab label', () => {
      const { Wrapper } = setup();
      render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
      for (const name of [/files/i, /git/i, /spec/i]) {
        const tab = screen.getByRole('tab', { name });
        expect(tab.children.length).toBeGreaterThan(0);
      }
    });
  });

  describe('keep-alive', () => {
    it('lazy first-mount: unvisited tabs are not in the DOM on initial render', () => {
      const { Wrapper } = setup();
      render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
      expect(screen.getByTestId('files-pane')).toBeInTheDocument();
      expect(screen.queryByTestId('git-pane')).toBeNull();
      expect(screen.queryByTestId('spec-pane')).toBeNull();
    });

    it('after visiting Spec then Files, Spec stays mounted with hidden attribute', async () => {
      const user = userEvent.setup();
      const { Wrapper } = setup();
      render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });

      await user.click(screen.getByRole('tab', { name: /spec/i }));
      expect(screen.getByTestId('spec-pane')).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: /files/i }));
      const specPane = screen.getByTestId('spec-pane');
      expect(specPane).toBeInTheDocument();
      expect(specPane.closest('[hidden]')).not.toBeNull();
      const filesPane = screen.getByTestId('files-pane');
      expect(filesPane.closest('[hidden]')).toBeNull();
    });

    it('returning to a previously-visited tab does not re-fetch via the pane-level RPC', async () => {
      const user = userEvent.setup();
      const { summoner, Wrapper } = setup();
      const listSpy = vi.spyOn(summoner.filesystem(), 'browseEntries');
      render(<RightPane onMention={vi.fn()} closeMode="collapse" />, { wrapper: Wrapper });
      await waitFor(() => expect(listSpy).toHaveBeenCalled());
      const initialCalls = listSpy.mock.calls.length;

      await user.click(screen.getByRole('tab', { name: /spec/i }));
      await user.click(screen.getByRole('tab', { name: /files/i }));

      expect(listSpy.mock.calls.length).toBe(initialCalls);
    });
  });
});
