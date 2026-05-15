export type Unsubscribe = () => void;

export interface DataSourceLike<T> {
  read(): Promise<T>;
  onChange(cb: () => void): Unsubscribe;
  dispose?(): void;
}

export type BroadcastType = 'files' | 'git' | 'openspec';

export type SnapshotCallback = (type: BroadcastType, data: unknown) => void;

export interface Broadcaster {
  subscribe(cwd: string, subscriberId: string, cb: SnapshotCallback): Unsubscribe;
}
