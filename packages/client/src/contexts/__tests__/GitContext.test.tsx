import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { useGit } from '../GitContext';

/** Fake component that exposes git actions for testing */
function GitCaller({ onReady }: { onReady: (git: ReturnType<typeof useGit>) => void }) {
  const git = useGit();
  onReady(git);
  return <span data-testid="git-ready" />;
}

describe('GitContext', () => {
  it('git:status emits without cwd (server uses ch.workspaceFolder)', async () => {
    let gitActions!: ReturnType<typeof useGit>;
    const { claude } = await renderWithChannel(
      <GitCaller
        onReady={(git) => {
          gitActions = git;
        }}
      />,
    );

    const emitSpy = vi.spyOn(claude.socket as never, 'emit');

    await act(async () => {
      gitActions.gitStatus();
    });

    expect(emitSpy).toHaveBeenCalledWith(
      'git:status',
      expect.objectContaining({}),
      expect.any(Function),
    );
    // cwd should NOT be in payload
    const payload = emitSpy.mock.calls.find((c) => c[0] === 'git:status')?.[1] as Record<
      string,
      unknown
    >;
    expect(payload.cwd).toBeUndefined();
  });

  it('git:checkout sends branch without cwd', async () => {
    let gitActions!: ReturnType<typeof useGit>;
    const { claude } = await renderWithChannel(
      <GitCaller
        onReady={(git) => {
          gitActions = git;
        }}
      />,
    );

    const emitSpy = vi.spyOn(claude.socket as never, 'emit');

    await act(async () => {
      gitActions.gitCheckout('feature-x');
    });

    expect(emitSpy).toHaveBeenCalledWith(
      'git:checkout',
      expect.objectContaining({ branch: 'feature-x' }),
      expect.any(Function),
    );
    const payload = emitSpy.mock.calls.find((c) => c[0] === 'git:checkout')?.[1] as Record<
      string,
      unknown
    >;
    expect(payload.cwd).toBeUndefined();
  });
});
