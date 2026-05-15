import type { OpenspecListResult, WatchService } from '@code-quest/schemas';
import type { Unsubscribe } from '../types.ts';

export interface OpenspecServiceLike {
  list(cwd: string): Promise<OpenspecListResult>;
}

export class OpenspecDataSource {
  private readonly callbacks = new Set<() => void>();
  private readonly unsub: Unsubscribe;
  private readonly cwd: string;
  private readonly openspec: OpenspecServiceLike;

  constructor(cwd: string, watchService: WatchService, openspec: OpenspecServiceLike) {
    this.cwd = cwd;
    this.openspec = openspec;
    this.unsub = watchService.subscribe(cwd, (ev) => {
      if (ev.path.startsWith('openspec/')) {
        for (const cb of this.callbacks) cb();
      }
    });
  }

  async read(): Promise<OpenspecListResult> {
    return this.openspec.list(this.cwd);
  }

  onChange(cb: () => void): Unsubscribe {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  dispose(): void {
    this.unsub();
  }
}
