import { logger } from '../logger.ts';
import type { RemoteRpcWithEvents } from './types.ts';

export class ReconnectableRpc implements RemoteRpcWithEvents {
  private current: RemoteRpcWithEvents | null = null;

  get connected(): boolean {
    return this.current !== null;
  }

  replace(rpc: RemoteRpcWithEvents): void {
    this.current = rpc;
    logger.info('Remote daemon connected');
    rpc.on('disconnect', () => {
      if (this.current === rpc) {
        logger.info('Remote daemon disconnected');
        this.current = null;
      }
    });
  }

  request<R = unknown>(method: string, params: unknown): Promise<R> {
    if (!this.current) return Promise.reject(new Error('No remote daemon connected'));
    return this.current.request(method, params);
  }

  on(event: string, fn: (...args: unknown[]) => void): () => void {
    if (!this.current) {
      logger.debug({ event }, 'ReconnectableRpc.on() called with no active connection');
      return () => {};
    }
    return this.current.on(event, fn);
  }
}
