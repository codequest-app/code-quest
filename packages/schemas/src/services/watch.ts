export interface WatchEvent {
  type: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
}

export type WatchCallback = (event: WatchEvent) => void;
export type Unsubscribe = () => void;

export interface WatchService {
  subscribe(cwd: string, cb: WatchCallback): Unsubscribe;
}
