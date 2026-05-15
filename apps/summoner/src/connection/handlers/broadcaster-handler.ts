import type { Broadcaster } from '@code-quest/broadcaster';
import type { AgentTransport } from '@code-quest/schemas';
import { REMOTE_METHODS, watchStartPayloadSchema } from '@code-quest/schemas';
import type { AgentHandler } from '../agent-handler.ts';

export class BroadcasterHandler implements AgentHandler {
  private readonly broadcaster: Broadcaster;
  private readonly connectionId: string;
  private subscriptions = new Map<string, () => void>();

  constructor(broadcaster: Broadcaster) {
    this.broadcaster = broadcaster;
    this.connectionId = Math.random().toString(36).slice(2);
  }

  attach(rpc: AgentTransport): void {
    for (const off of this.subscriptions.values()) off();
    this.subscriptions.clear();

    rpc.onRequest(REMOTE_METHODS.watch.start, async (params) => {
      const { cwd } = watchStartPayloadSchema.parse(params);
      if (this.subscriptions.has(cwd)) return { ok: true };
      const off = this.broadcaster.subscribe(cwd, this.connectionId, (type, data) => {
        rpc.emit(REMOTE_METHODS.watch.snapshot, { cwd, type, data });
      });
      this.subscriptions.set(cwd, off);
      return { ok: true };
    });

    rpc.onRequest(REMOTE_METHODS.watch.stop, async (params) => {
      const { cwd } = watchStartPayloadSchema.parse(params);
      this.subscriptions.get(cwd)?.();
      this.subscriptions.delete(cwd);
      return { ok: true };
    });
  }

  dispose(): void {
    for (const off of this.subscriptions.values()) off();
    this.subscriptions.clear();
  }
}
