import type { GitService, GitStatusResult, WatchService } from '@code-quest/schemas';
import type { Unsubscribe } from '../types.ts';

const GIT_META_RE = /^\.git\/(HEAD|index|packed-refs|refs\/.*)$/;

export class GitDataSource {
  private readonly callbacks = new Set<() => void>();
  private readonly unsub: Unsubscribe;
  private readonly cwd: string;
  private readonly git: GitService;

  constructor(cwd: string, watchService: WatchService, git: GitService) {
    this.cwd = cwd;
    this.git = git;
    this.unsub = watchService.subscribe(cwd, (ev) => {
      if (GIT_META_RE.test(ev.path)) {
        for (const cb of this.callbacks) cb();
      }
    });
  }

  async read(): Promise<GitStatusResult> {
    return this.git.status(this.cwd);
  }

  onChange(cb: () => void): Unsubscribe {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  dispose(): void {
    this.unsub();
  }
}
