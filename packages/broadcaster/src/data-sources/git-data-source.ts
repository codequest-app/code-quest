import type { GitService } from '@code-quest/git';
import type { GitStatusResult } from '@code-quest/schemas';
import type { WatchService } from '@code-quest/watch';
import { DataSource, GIT_META_RE } from '../data-source.ts';

export class GitDataSource extends DataSource<GitStatusResult> {
  private readonly git: GitService;

  constructor(cwd: string, watchService: WatchService, git: GitService) {
    super(cwd, watchService, (path) => GIT_META_RE.test(path));
    this.git = git;
  }

  async read(): Promise<GitStatusResult> {
    return this.git.status(this.cwd);
  }
}
