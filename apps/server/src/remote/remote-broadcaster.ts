import { REMOTE_METHODS } from '@code-quest/schemas';

type Unsubscribe = () => void;

interface RemoteRpc {
  request(method: string, params: unknown): Promise<unknown>;
  on(event: string, fn: (...args: unknown[]) => void): Unsubscribe;
}

interface WatchSnapshot {
  cwd: string;
  type: string;
  data: unknown;
}

export class RemoteBroadcaster<T> {
  private readonly rpc: RemoteRpc;
  private readonly type: string;
  private readonly subscribers = new Map<string, Map<string, (data: T) => void>>();
  private offSnapshot: Unsubscribe | null = null;

  constructor(rpc: RemoteRpc, type: string) {
    this.rpc = rpc;
    this.type = type;
  }

  subscribe(cwd: string, subscriberId: string, cb: (data: T) => void): Unsubscribe {
    let cwdSubs = this.subscribers.get(cwd);
    const isFirst = !cwdSubs || cwdSubs.size === 0;

    if (!cwdSubs) {
      cwdSubs = new Map();
      this.subscribers.set(cwd, cwdSubs);
    }
    cwdSubs.set(subscriberId, cb);

    if (isFirst) {
      this.ensureSnapshotListener();
      void this.rpc.request(REMOTE_METHODS.watch.start, { cwd });
    }

    return () => {
      const subs = this.subscribers.get(cwd);
      if (!subs) return;
      subs.delete(subscriberId);
      if (subs.size === 0) {
        this.subscribers.delete(cwd);
        void this.rpc.request(REMOTE_METHODS.watch.stop, { cwd });
      }
    };
  }

  private ensureSnapshotListener(): void {
    if (this.offSnapshot) return;
    this.offSnapshot = this.rpc.on(REMOTE_METHODS.watch.snapshot, (...args: unknown[]) => {
      const payload = args[0] as WatchSnapshot;
      if (payload.type !== this.type) return;
      const subs = this.subscribers.get(payload.cwd);
      if (!subs) return;
      for (const cb of subs.values()) {
        cb(payload.data as T);
      }
    });
  }
}
