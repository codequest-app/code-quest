import type { OpenspecListResult, WatchService } from '@code-quest/schemas';
import { DataSource } from '../data-source.ts';

export interface OpenspecServiceLike {
  list(cwd: string): Promise<OpenspecListResult>;
}

export class OpenspecDataSource extends DataSource<OpenspecListResult> {
  private readonly cwd: string;
  private readonly openspec: OpenspecServiceLike;

  constructor(cwd: string, watchService: WatchService, openspec: OpenspecServiceLike) {
    super(cwd, watchService, (path) => /^openspec\//.test(path));
    this.cwd = cwd;
    this.openspec = openspec;
  }

  async read(): Promise<OpenspecListResult> {
    return this.openspec.list(this.cwd);
  }
}
