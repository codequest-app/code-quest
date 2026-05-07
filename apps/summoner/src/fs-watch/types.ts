/** Low-level FS event shape produced by WatchService. Paths are relative to the watched cwd. */
export interface WatchEvent {
  type: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
}

export type WatchCallback = (event: WatchEvent) => void;
export type Unsubscribe = () => void;

export interface WatchService {
  /**
   * Subscribe to FS events under `cwd`. Returns an unsubscribe function;
   * when the last subscriber unsubscribes, the underlying watcher closes.
   *
   * Implementations MUST ignore standard noisy paths (node_modules, .git/objects,
   * build artifacts). Subscribers receive paths **relative to cwd**.
   *
   * If the platform reports a watch-limit error, the implementation MUST log
   * once and swallow; the returned Unsubscribe remains safe to call.
   */
  subscribe(cwd: string, cb: WatchCallback): Unsubscribe;
}
