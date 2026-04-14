import { createFakeServer, createTestContainer } from '@code-quest/server/test';
import type { CreateWorktreeResponse } from '@code-quest/shared';
import { FakeGitService } from '@code-quest/summoner/test';
import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../test/fake-summoner';
import { renderWithWorkspace } from '../../test/render-with-workspace';

describe('WorkspaceLayout worktree grouping', () => {
  it('opens a new tab inside the SAME project when worktree:create spawns a session under /<project>/.claude/worktrees/<name>', async () => {
    // FakeGitService: any cwd under /projects/app (including worktrees) reports
    // projectRoot === /projects/app, so server + client group them together.
    const fakeGit = new FakeGitService();
    fakeGit.setProjectRoot('/projects/app');
    const container = createTestContainer({ gitService: fakeGit });
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);
    const { addProject } = await renderWithWorkspace({ summoner });

    const project = await addProject({ path: '/projects', dirName: 'app' });
    await project.launchSession();

    // Sanity: one tab initially.
    expect(screen.getAllByLabelText(/^Close /)).toHaveLength(1);

    const socket = summoner.socket;
    let resp: CreateWorktreeResponse | null = null;
    await act(async () => {
      resp = await new Promise<CreateWorktreeResponse>((resolve) => {
        socket.emit(
          'worktree:create',
          { cwd: '/projects/app', name: 'feat-a' },
          (r: CreateWorktreeResponse) => resolve(r),
        );
      });
    });
    expect(resp!.ok).toBe(true);

    // A second tab (the worktree session) appears inside the same project.
    await waitFor(() => {
      expect(screen.getAllByLabelText(/^Close /)).toHaveLength(2);
    });
  });
});
