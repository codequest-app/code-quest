import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalGitService } from '@code-quest/git';
import { afterEach, describe } from 'vitest';
import { type ContractSetup, gitServiceContract } from './git-service.contract.ts';

describe.skipIf(!process.env.RUN_INTEGRATION)('local-git-service (integration)', () => {
  const dirsToCleanup: string[] = [];

  afterEach(() => {
    while (dirsToCleanup.length) {
      const d = dirsToCleanup.pop()!;
      try {
        rmSync(d, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  });

  function makeTmpDir(prefix: string): string {
    const d = mkdtempSync(join(tmpdir(), prefix));
    dirsToCleanup.push(d);
    return d;
  }

  gitServiceContract(
    'LocalGitService',
    async (): Promise<ContractSetup> => ({
      service: new LocalGitService(),
      cwd: makeTmpDir('local-git-non-'),
      makeExistingRepo: async () => {
        const d = makeTmpDir('local-git-repo-');
        execFileSync('git', ['init', '-b', 'main'], { cwd: d });
        execFileSync(
          'git',
          ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'init'],
          { cwd: d },
        );
        return d;
      },
    }),
  );
});
