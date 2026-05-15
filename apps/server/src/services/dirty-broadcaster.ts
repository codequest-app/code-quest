import { TopicEmitter } from '@code-quest/schemas';
import type { Unsubscribe, WatchEvent, WatchService } from '@code-quest/summoner';

const DEBOUNCE_MS = 200;

interface PerCwd {
  buffer: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
  unsubFromWatch: Unsubscribe;
}

/**
 * Generic per-cwd dirty broadcaster. Owns its slice of WatchService
 * lifecycle (one subscribe per cwd, reused across N subscribers via
 * TopicEmitter refcount; released when the last subscriber leaves) plus
 * a 200 ms debounce buffer that coalesces bursty events into one batch.
 *
 * Domain-specific flavor comes from two callbacks passed at construction:
 *   - `matcher(path)` decides which events belong to this domain
 *   - `transform(paths)` shapes the published payload (identity for "fs"
 *     which emits the paths array; `() => undefined` for "git"/"openspec"
 *     which emit a void signal).
 *
 * Subscriber keying `(cwd, subscriberId)` is refcounted — re-subscribing
 * under the same id (e.g. the same socket.id from both the fs:watch
 * handler and ChannelManager) collapses to one delivery per event; both
 * unsubscribes must fire before the entry is released. This is the
 * TopicEmitter contract; this class just threads it through.
 */
export class DirtyBroadcaster<P> {
  private readonly emitter = new TopicEmitter<string, P>();
  private readonly perCwd = new Map<string, PerCwd>();

  private readonly watchService: WatchService;
  private readonly matcher: (path: string) => boolean;
  private readonly transform: (paths: string[]) => P;
  constructor(
    watchService: WatchService,
    matcher: (path: string) => boolean,
    transform: (paths: string[]) => P,
  ) {
    this.watchService = watchService;
    this.matcher = matcher;
    this.transform = transform;
  }

  subscribe(cwd: string, subscriberId: string, cb: (payload: P) => void): Unsubscribe {
    const off = this.emitter.subscribe(cwd, subscriberId, cb);
    if (!this.perCwd.has(cwd)) {
      const state: PerCwd = {
        buffer: new Set(),
        timer: null,
        unsubFromWatch: this.watchService.subscribe(cwd, (ev) => this.onEvent(cwd, ev)),
      };
      this.perCwd.set(cwd, state);
    }
    return () => {
      off();
      if (!this.emitter.hasSubscribers(cwd)) this.releaseCwd(cwd);
    };
  }

  private releaseCwd(cwd: string): void {
    const state = this.perCwd.get(cwd);
    if (!state) return;
    if (state.timer) clearTimeout(state.timer);
    state.unsubFromWatch();
    this.perCwd.delete(cwd);
  }

  private onEvent(cwd: string, ev: WatchEvent): void {
    if (!this.matcher(ev.path)) return;
    const state = this.perCwd.get(cwd);
    if (!state) return;
    state.buffer.add(ev.path);
    if (state.timer) return;
    state.timer = setTimeout(() => this.flush(cwd), DEBOUNCE_MS);
  }

  private flush(cwd: string): void {
    const state = this.perCwd.get(cwd);
    if (!state) return;
    state.timer = null;
    if (state.buffer.size === 0) return;
    const paths = [...state.buffer];
    state.buffer.clear();
    this.emitter.publish(cwd, this.transform(paths));
  }
}
