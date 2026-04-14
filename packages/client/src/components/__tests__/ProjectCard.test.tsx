import {
  createFakeServer,
  createTestContainer,
  type SessionStore,
  TYPES,
} from '@code-quest/server/test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectProvider, useProjectState } from '../../contexts/ProjectContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { ProjectCard } from '../ProjectCard';

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(<ProjectCard name="cc-office" active={false} onSelect={() => {}} />);
    expect(screen.getByText(/cc-office/)).toBeInTheDocument();
  });

  it('has accent border when active', () => {
    const { container } = render(<ProjectCard name="cc-office" active onSelect={() => {}} />);
    const card = container.firstElementChild;
    expect(card?.className).toContain('border-accent');
  });

  it('does not have accent border when inactive', () => {
    const { container } = render(
      <ProjectCard name="cc-office" active={false} onSelect={() => {}} />,
    );
    const card = container.firstElementChild;
    expect(card?.className).not.toContain('border-accent');
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ProjectCard name="cc-office" active={false} onSelect={onSelect} />);
    await user.click(screen.getByText(/cc-office/));
    expect(onSelect).toHaveBeenCalled();
  });

  describe('right-click resume flow', () => {
    function setup() {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const summoner = createFakeSummoner(server);
      if (!summoner.claude().hasInitSegments) summoner.claude().prepareInit();
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);

      function Probe() {
        const { activeProjectCwd, pendingActivateChannel } = useProjectState();
        return (
          <>
            <span data-testid="active-cwd">{activeProjectCwd ?? 'null'}</span>
            <span data-testid="pending">{JSON.stringify(pendingActivateChannel)}</span>
          </>
        );
      }

      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <SocketProvider socket={summoner.socket}>
            <SessionProvider>
              <ProjectProvider>
                {children}
                <Probe />
              </ProjectProvider>
            </SessionProvider>
          </SocketProvider>
        );
      }
      return { Wrapper, sessionStore };
    }

    it('right-click opens menu, picking a session activates project + sets pending intent', async () => {
      const { Wrapper, sessionStore } = setup();
      await sessionStore.upsert({
        id: 'sess-1',
        channelId: 'sess-1',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        cwd: '/proj',
        projectRoot: '/proj',
        title: 'Pick me',
        createdAt: new Date().toISOString(),
      });

      render(
        <Wrapper>
          <ProjectCard name="proj" cwd="/proj" active={false} onSelect={() => {}} />
        </Wrapper>,
      );

      // Right-click → context menu appears
      fireEvent.contextMenu(screen.getByText('📁 proj'));
      const menuItem = await screen.findByRole('menuitem', { name: /resume session/i });

      // Click menu item → dialog opens with picker, listing the session
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(menuItem);

      const sessionRow = await screen.findByText('Pick me');

      // Click row → resume succeeds → setActiveProject + requestActivateChannel
      await user.click(sessionRow);

      await waitFor(() => {
        expect(screen.getByTestId('active-cwd')).toHaveTextContent('/proj');
        const pending = JSON.parse(screen.getByTestId('pending').textContent ?? 'null');
        expect(pending).not.toBeNull();
        expect(pending.cwd).toBe('/proj');
        expect(typeof pending.channelId).toBe('string');
      });

      // Dialog closed (picker no longer rendered)
      await waitFor(() => {
        expect(screen.queryByText('Pick me')).not.toBeInTheDocument();
      });
    });

    it('Escape closes the dialog', async () => {
      const { Wrapper } = setup();

      render(
        <Wrapper>
          <ProjectCard name="proj" cwd="/proj" active={false} onSelect={() => {}} />
        </Wrapper>,
      );

      fireEvent.contextMenu(screen.getByText('📁 proj'));
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(await screen.findByRole('menuitem', { name: /resume session/i }));

      // Dialog open — SessionHistory shows its search bar
      const searchInput = await screen.findByPlaceholderText(/Search sessions/i);
      expect(searchInput).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Search sessions/i)).not.toBeInTheDocument();
      });
    });
  });
});
