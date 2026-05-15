import { REMOTE_METHODS } from '@code-quest/schemas';
import type { RemoteRpcWithEvents } from './types.ts';

type SnapshotCallback = (type: string, data: unknown) => void;
type Unsubscribe = () => void;

interface WatchSnapshot {
  cwd: string;
  type: string;
  data: unknown;
}

export class RemoteBroadcaster {
  private readonly rpc: RemoteRpcWithEvents;
  private readonly subscribers = new Map<string, Map<string, SnapshotCallback>>();
  private offSnapshot: Unsubscribe | null = null;

  constructor(rpc: RemoteRpcWithEvents) {
    this.rpc = rpc;
  }

  subscribe(cwd: string, subscriberId: string, cb: SnapshotCallback): Unsubscribe {
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

  dispose(): void {
    this.offSnapshot?.();
    this.offSnapshot = null;
    this.subscribers.clear();
  }

  private ensureSnapshotListener(): void {
    if (this.offSnapshot) return;
    this.offSnapshot = this.rpc.on(REMOTE_METHODS.watch.snapshot, (...args: unknown[]) => {
      const payload = args[0] as WatchSnapshot;
      const subs = this.subscribers.get(payload.cwd);
      if (!subs) return;
      for (const cb of subs.values()) {
        cb(payload.type, payload.data);
      }
    });
  }
}
