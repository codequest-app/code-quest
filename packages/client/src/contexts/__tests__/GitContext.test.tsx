/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { useGit } from '../GitContext';

/** Expose git actions from context for testing */
function GitCaller({ onReady }: { onReady: (git: ReturnType<typeof useGit>) => void }) {
  const git = useGit();
  onReady(git);
  return <span data-testid="git-ready" />;
}

describe('GitContext', () => {
  it('git:status roundtrip returns server response', async () => {
    let gitActions!: ReturnType<typeof useGit>;
    await renderWithChannel(
      <GitCaller
        onReady={(git) => {
          gitActions = git;
        }}
      />,
    );

    let result: any;
    await act(async () => {
      result = await gitActions.gitStatus();
    });

    // Server handler uses ch.cwd; without real git it returns fallback
    expect(result).toEqual(
      expect.objectContaining({ branch: expect.any(String), changedFiles: expect.any(Array) }),
    );
  });

  it('git:checkout roundtrip sends branch to server', async () => {
    let gitActions!: ReturnType<typeof useGit>;
    await renderWithChannel(
      <GitCaller
        onReady={(git) => {
          gitActions = git;
        }}
      />,
    );

    let result: any;
    await act(async () => {
      result = await gitActions.gitCheckout('feature-x');
    });

    // Without real git, checkout fails but roundtrip completes
    expect(result).toEqual(expect.objectContaining({ success: expect.any(Boolean) }));
  });
});
