import type { GitService, GitStatusResult, WatchService } from '@code-quest/schemas';
import { DataSource } from '../data-source.ts';

const GIT_META_RE = /^\.git\/(HEAD|index|packed-refs|refs\/.*)$/;

export class GitDataSource extends DataSource<GitStatusResult> {
  private readonly cwd: string;
  private readonly git: GitService;

  constructor(cwd: string, watchService: WatchService, git: GitService) {
    super(cwd, watchService, (path) => GIT_META_RE.test(path));
    this.cwd = cwd;
    this.git = git;
  }

  async read(): Promise<GitStatusResult> {
    return this.git.status(this.cwd);
  }
}
