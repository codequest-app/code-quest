import type { WatchService } from '@code-quest/schemas';
import type { Unsubscribe } from './types.ts';

export abstract class DataSource<T> {
  private readonly callbacks = new Set<() => void>();
  private readonly unsub: Unsubscribe;

  constructor(cwd: string, watchService: WatchService, filter: (path: string) => boolean) {
    this.unsub = watchService.subscribe(cwd, (ev) => {
      if (!filter(ev.path)) return;
      for (const cb of this.callbacks) cb();
    });
  }

  abstract read(): Promise<T>;

  onChange(cb: () => void): Unsubscribe {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  dispose(): void {
    this.unsub();
  }
}
