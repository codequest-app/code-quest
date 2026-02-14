import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { GitServiceImpl } from '../service.ts';

// Mock node:child_process
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { execFile as execFileCb } from 'node:child_process';

const execFileMock = execFileCb as unknown as MockInstance;

function mockExecFileSuccess(stdout = '') {
  execFileMock.mockImplementation(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      cb?: (err: unknown, result: { stdout: string; stderr: string }) => void,
    ) => {
      // promisify calls with 3 or 4 args; handle both
      const callback = typeof _opts === 'function' ? _opts : cb;
      if (callback) {
        (callback as (err: unknown, result: { stdout: string; stderr: string }) => void)(null, {
          stdout,
          stderr: '',
        });
      }
    },
  );
}

function mockExecFileSequence(results: Array<{ stdout?: string; error?: Error }>) {
  let callIndex = 0;
  execFileMock.mockImplementation(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      cb?: (err: unknown, result?: { stdout: string; stderr: string }) => void,
    ) => {
      const callback = typeof _opts === 'function' ? _opts : cb;
      const result = results[callIndex] ?? results[results.length - 1];
      callIndex++;
      if (callback) {
        if (result.error) {
          (callback as (err: unknown) => void)(result.error);
        } else {
          (callback as (err: unknown, result: { stdout: string; stderr: string }) => void)(null, {
            stdout: result.stdout ?? '',
            stderr: '',
          });
        }
      }
    },
  );
}

describe('GitServiceImpl', () => {
  let service: GitServiceImpl;

  beforeEach(() => {
    service = new GitServiceImpl();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should report worktree unsupported when git is not available', async () => {
    mockExecFileSequence([{ error: new Error('git not found') }]);

    await service.init();

    expect(service.isWorktreeSupported()).toBe(false);
    expect(service.getProjectRoot()).toBeNull();
  });

  it('should report worktree supported when git is available', async () => {
    mockExecFileSequence([
      { stdout: '/project/root\n' },
      { stdout: '/project/root  abc1234 [main]\n' },
    ]);

    await service.init();

    expect(service.isWorktreeSupported()).toBe(true);
    expect(service.getProjectRoot()).toBe('/project/root');
  });

  it('should cache init result — second call does not exec again', async () => {
    mockExecFileSequence([{ stdout: '/project/root\n' }, { stdout: '' }]);

    await service.init();
    const callCount = execFileMock.mock.calls.length;

    await service.init();
    expect(execFileMock.mock.calls.length).toBe(callCount);
  });

  it('should create worktree with correct git command', async () => {
    // Init first
    mockExecFileSequence([
      { stdout: '/project/root\n' },
      { stdout: '' },
      { stdout: '' }, // for createWorktree
    ]);

    await service.init();
    const result = await service.createWorktree('test-1');

    expect(result).toBe('/project/root/.worktrees/worker-test-1');

    // Find the createWorktree call
    const createCall = execFileMock.mock.calls.find(
      (call: unknown[]) =>
        Array.isArray(call[1]) &&
        (call[1] as string[]).includes('worktree') &&
        (call[1] as string[]).includes('add'),
    );
    expect(createCall).toBeDefined();
    expect(createCall[1]).toContain('-b');
    expect(createCall[1]).toContain('worker-test-1');
  });

  it('should remove worktree with correct git commands', async () => {
    mockExecFileSequence([
      { stdout: '/project/root\n' },
      { stdout: '' },
      { stdout: '' }, // worktree remove
      { stdout: '' }, // branch delete
    ]);

    await service.init();
    await service.removeWorktree('test-1');

    const removeCall = execFileMock.mock.calls.find(
      (call: unknown[]) =>
        Array.isArray(call[1]) &&
        (call[1] as string[]).includes('worktree') &&
        (call[1] as string[]).includes('remove'),
    );
    expect(removeCall).toBeDefined();

    const branchCall = execFileMock.mock.calls.find(
      (call: unknown[]) =>
        Array.isArray(call[1]) &&
        (call[1] as string[]).includes('branch') &&
        (call[1] as string[]).includes('-d'),
    );
    expect(branchCall).toBeDefined();
  });

  it('should merge worktree branch successfully', async () => {
    mockExecFileSequence([
      { stdout: '/project/root\n' },
      { stdout: '' },
      { stdout: '' }, // merge
    ]);

    await service.init();
    const result = await service.mergeWorktreeBranch('test-1');

    expect(result).toEqual({ success: true, branch: 'worker-test-1' });
  });

  it('should handle merge conflict gracefully', async () => {
    mockExecFileSequence([
      { stdout: '/project/root\n' },
      { stdout: '' },
      { error: new Error('merge conflict') }, // merge fails
      { stdout: '' }, // merge --abort
    ]);

    await service.init();
    const result = await service.mergeWorktreeBranch('test-1');

    expect(result.success).toBe(false);
    expect(result.branch).toBe('worker-test-1');
    expect(result.error).toContain('merge conflict');
  });

  it('should cleanup all specified worktrees', async () => {
    mockExecFileSuccess('');
    // We need init first
    mockExecFileSequence([
      { stdout: '/project/root\n' },
      { stdout: '' },
      // cleanup calls: 2 ids × (remove + branch) = 4
      { stdout: '' },
      { stdout: '' },
      { stdout: '' },
      { stdout: '' },
    ]);

    await service.init();
    await service.cleanupAll(['id-1', 'id-2']);

    const removeCalls = execFileMock.mock.calls.filter(
      (call: unknown[]) =>
        Array.isArray(call[1]) &&
        (call[1] as string[]).includes('worktree') &&
        (call[1] as string[]).includes('remove'),
    );
    expect(removeCalls).toHaveLength(2);
  });

  it('should throw when creating worktree without init', async () => {
    await expect(service.createWorktree('test-1')).rejects.toThrow('not initialized');
  });
});
