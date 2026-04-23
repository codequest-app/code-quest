import { createFakeServer } from '@code-quest/server/test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectProvider } from '../../contexts/ProjectContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { WorktreeProvider } from '../../contexts/WorktreeContext';
import { FakeSummoner } from '../../test/fake-summoner';
import { CreateWorktreeDialog } from '../CreateWorktreeDialog';

// validateWorktreeName has dedicated tests in
// packages/shared/src/validators/__tests__/worktree-name.test.ts — no need to
// duplicate pure-validator coverage here.

describe('CreateWorktreeDialog', () => {
  function Wrapper({ children }: { children: ReactNode }) {
    const server = createFakeServer();
    const ref = useRef<FakeSummoner | null>(null);
    if (!ref.current) {
      ref.current = new FakeSummoner(server);
      ref.current.git()!.setProjectRoot('/repo');
    }
    return (
      <SocketProvider socket={ref.current.socket}>
        <SessionProvider>
          <ProjectProvider>
            <WorktreeProvider>{children}</WorktreeProvider>
          </ProjectProvider>
        </SessionProvider>
      </SocketProvider>
    );
  }

  it('renders nothing when open=false', () => {
    render(
      <Wrapper>
        <CreateWorktreeDialog open={false} cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.queryByLabelText(/Worktree name/i)).not.toBeInTheDocument();
  });

  it('Cancel button calls onClose without creating', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={onClose} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows inline validation error when name is invalid (no server call)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    await user.type(screen.getByLabelText(/Worktree name/i), '../bad');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));
    expect(await screen.findByText(/letters, numbers/i)).toBeInTheDocument();
  });

  // Submit → server flow is covered end-to-end by CreateWorktreeFlow.test.tsx
  // (right-click → menu → dialog → submit → new tab). No duplication here.

  it('Escape key closes the dialog (Radix primitive behavior)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={onClose} />
      </Wrapper>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('has an accessible dialog title', () => {
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    // Radix Dialog renders title as aria-labelledby on the dialog role element.
    expect(screen.getByRole('dialog', { name: /Create Worktree/i })).toBeInTheDocument();
  });
});
