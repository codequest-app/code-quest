import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FsProvider } from '@/contexts/FsContext';
import { GitProvider } from '@/contexts/GitContext';
import { OpenspecProvider } from '@/contexts/OpenspecContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { createFakeSummoner } from '@/test/fake-summoner';
import { RightPane } from '../RightPane.tsx';

function setup() {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/repo']);
  summoner.filesystem().addDirectory('/repo', []);
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SocketProvider socket={summoner.socket}>
        <GitProvider>
          <FsProvider>
            <OpenspecProvider>{children}</OpenspecProvider>
          </FsProvider>
        </GitProvider>
      </SocketProvider>
    );
  }
  return { summoner, Wrapper };
}

describe('RightPane', () => {
  it('renders three tab buttons with accessible names', () => {
    const { Wrapper } = setup();
    render(<RightPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: /files/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /git/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /spec/i })).toBeInTheDocument();
  });

  it('Files tab is active by default', () => {
    const { Wrapper } = setup();
    render(<RightPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: /files/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /git/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking a tab updates active selection', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    render(<RightPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
    await user.click(screen.getByRole('tab', { name: /git/i }));
    expect(screen.getByRole('tab', { name: /git/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /files/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('exposes cwd via data-cwd on the body for child consumers', () => {
    const { Wrapper } = setup();
    render(<RightPane cwd="/repo/cc-office" onMention={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByLabelText('right-pane-body')).toHaveAttribute('data-cwd', '/repo/cc-office');
  });

  describe('tab strip visual', () => {
    it('renders an icon next to each tab label', () => {
      const { Wrapper } = setup();
      render(<RightPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
      // Each tab carries label text + an icon child (heroicon SVG or ⎇
      // glyph). Asserting the tab has more than just text proves an icon
      // companion is rendered without coupling to a specific tag/class.
      for (const name of [/files/i, /git/i, /spec/i]) {
        const tab = screen.getByRole('tab', { name });
        expect(tab.children.length).toBeGreaterThan(0);
      }
    });
  });

  describe('keep-alive', () => {
    it('lazy first-mount: unvisited tabs are not in the DOM on initial render', () => {
      const { Wrapper } = setup();
      render(<RightPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
      expect(screen.getByLabelText('files-pane')).toBeInTheDocument();
      expect(screen.queryByLabelText('git-pane')).toBeNull();
      expect(screen.queryByLabelText('spec-pane')).toBeNull();
    });

    it('after visiting Spec then Files, Spec stays mounted with hidden attribute', async () => {
      const user = userEvent.setup();
      const { Wrapper } = setup();
      render(<RightPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });

      await user.click(screen.getByRole('tab', { name: /spec/i }));
      expect(screen.getByLabelText('spec-pane')).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: /files/i }));
      // Spec subtree still in DOM, just hidden.
      const specPane = screen.getByLabelText('spec-pane');
      expect(specPane).toBeInTheDocument();
      // The wrapper around the inactive pane carries `hidden`.
      expect(specPane.closest('[hidden]')).not.toBeNull();
      // Files wrapper is not hidden.
      const filesPane = screen.getByLabelText('files-pane');
      expect(filesPane.closest('[hidden]')).toBeNull();
    });

    it('returning to a previously-visited tab does not re-fetch via the pane-level RPC', async () => {
      const user = userEvent.setup();
      const { summoner, Wrapper } = setup();
      const listSpy = vi.spyOn(summoner.filesystem(), 'browseEntries');
      render(<RightPane cwd="/repo" onMention={vi.fn()} />, { wrapper: Wrapper });
      // Wait for any initial fetch triggered by first mount to settle before
      // recording the baseline count.
      await waitFor(() => expect(listSpy).toHaveBeenCalled());
      const initialCalls = listSpy.mock.calls.length;

      await user.click(screen.getByRole('tab', { name: /spec/i }));
      await user.click(screen.getByRole('tab', { name: /files/i }));

      // No additional browseEntries call purely from the tab switch
      // (dirty-broadcast driven refreshes are orthogonal and absent here).
      expect(listSpy.mock.calls.length).toBe(initialCalls);
    });
  });
});
