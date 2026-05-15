import type { Broadcaster } from '@code-quest/broadcaster';
import type { AgentTransport } from '@code-quest/schemas';
import { REMOTE_METHODS } from '@code-quest/schemas';
import type { AgentHandler } from './agent-handler.ts';

export class BroadcasterHandler implements AgentHandler {
  private readonly broadcaster: Broadcaster;

  constructor(broadcaster: Broadcaster) {
    this.broadcaster = broadcaster;
  }

  attach(rpc: AgentTransport): void {
    const subscriptions = new Map<string, () => void>();

    rpc.onRequest(REMOTE_METHODS.watch.start, async (params) => {
      const { cwd } = params as { cwd: string };
      if (subscriptions.has(cwd)) return { ok: true };
      const off = this.broadcaster.subscribe(cwd, 'agent', (type, data) => {
        rpc.emit(REMOTE_METHODS.watch.snapshot, { cwd, type, data });
      });
      subscriptions.set(cwd, off);
      return { ok: true };
    });

    rpc.onRequest(REMOTE_METHODS.watch.stop, async (params) => {
      const { cwd } = params as { cwd: string };
      subscriptions.get(cwd)?.();
      subscriptions.delete(cwd);
      return { ok: true };
    });
  }
}
