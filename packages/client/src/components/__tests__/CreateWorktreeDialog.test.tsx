import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createProjectsEnv } from '../../test/projects-env';
import { CreateWorktreeDialog } from '../CreateWorktreeDialog';

function makeWrapper() {
  const env = createProjectsEnv();
  env.summoner.git()!.setProjectRoot('/repo');
  return { Wrapper: env.Wrapper };
}

describe('CreateWorktreeDialog (2-tab redesign)', () => {
  it('renders nothing when open=false', () => {
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open={false} cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders 2 tabs: Checkout existing + Create new branch', () => {
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByRole('tab', { name: /checkout existing/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /create new branch/i })).toBeInTheDocument();
  });

  it('Tab A active by default: shows branch dropdown + path input', async () => {
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByLabelText(/^branch$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^path$/i)).toBeInTheDocument();
  });

  it('Tab B fields: new branch name + base branch + path', async () => {
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(screen.getByRole('tab', { name: /create new branch/i }));
    expect(screen.getByLabelText(/new branch name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/base branch/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^path/i)).toBeInTheDocument();
  });

  it('does NOT auto-open chat — creating a worktree no longer spawns a session', () => {
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.queryByRole('checkbox', { name: /open new session here/i })).toBeNull();
  });

  it('command preview reflects Tab B inputs live', async () => {
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(screen.getByRole('tab', { name: /create new branch/i }));
    await user.type(screen.getByLabelText(/new branch name/i), 'feat/x');
    await waitFor(() => {
      expect(
        screen.getByRole('status', { name: 'worktree-command-preview' }).textContent,
      ).toContain('git worktree add -b feat/x');
    });
  });

  it('Cancel closes dialog without creating', async () => {
    const onClose = vi.fn();
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={onClose} />
      </Wrapper>,
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('Escape closes the dialog', async () => {
    const onClose = vi.fn();
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={onClose} />
      </Wrapper>,
    );
    await userEvent.setup({ pointerEventsCheck: 0 }).keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('has an accessible dialog title', () => {
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <CreateWorktreeDialog open cwd="/repo" onClose={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByRole('dialog', { name: /new worktree/i })).toBeInTheDocument();
  });
});
