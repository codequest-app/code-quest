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
  it('git:status sends cwd from workspaceFolder', async () => {
    let gitActions!: ReturnType<typeof useGit>;
    const { claude } = await renderWithChannel(
      <GitCaller
        onReady={(git) => {
          gitActions = git;
        }}
      />,
      { workspaceFolder: '/my/project' },
    );

    const emitSpy = vi.spyOn(claude.socket as never, 'emit');

    await act(async () => {
      gitActions.gitStatus();
    });

    expect(emitSpy).toHaveBeenCalledWith(
      'git:status',
      expect.objectContaining({ cwd: '/my/project' }),
      expect.any(Function),
    );
  });

  it('git:checkout sends branch + cwd', async () => {
    let gitActions!: ReturnType<typeof useGit>;
    const { claude } = await renderWithChannel(
      <GitCaller
        onReady={(git) => {
          gitActions = git;
        }}
      />,
      { workspaceFolder: '/workspace' },
    );

    const emitSpy = vi.spyOn(claude.socket as never, 'emit');

    await act(async () => {
      gitActions.gitCheckout('feature-x');
    });

    expect(emitSpy).toHaveBeenCalledWith(
      'git:checkout',
      expect.objectContaining({ branch: 'feature-x', cwd: '/workspace' }),
      expect.any(Function),
    );
  });
});
