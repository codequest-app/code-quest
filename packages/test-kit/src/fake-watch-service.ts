import type { Unsubscribe, WatchCallback, WatchEvent, WatchService } from '@code-quest/schemas';

/**
 * Deterministic WatchService for tests. Call `.simulate(cwd, event)` to fan
 * events out to all subscribers for that cwd. No real FS or chokidar.
 */
export class FakeWatchService implements WatchService {
  private subs = new Map<string, Set<WatchCallback>>();

  subscribe(cwd: string, cb: WatchCallback): Unsubscribe {
    let set = this.subs.get(cwd);
    if (!set) {
      set = new Set();
      this.subs.set(cwd, set);
    }
    set.add(cb);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const s = this.subs.get(cwd);
      if (!s) return;
      s.delete(cb);
      if (s.size === 0) this.subs.delete(cwd);
    };
  }

  subscriberCount(cwd: string): number {
    return this.subs.get(cwd)?.size ?? 0;
  }

  isWatching(cwd: string): boolean {
    return this.subs.has(cwd);
  }

  /** Test helper: synchronously invoke all subscribers for `cwd`. */
  simulate(cwd: string, event: WatchEvent): void {
    const set = this.subs.get(cwd);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(event);
      } catch (err) {
        // Swallow and log — matches real WatchService contract.
        console.error('[FakeWatchService] subscriber threw:', err);
      }
    }
  }
}
