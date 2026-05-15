import type { RpcChannel } from './rpc-channel.ts';
import type { Middleware, WsTransport } from './ws-transport.ts';

export interface ConnectionLoopOptions {
  middleware?: Middleware[];
  reconnect?: {
    initialDelayMs?: number;
    maxDelayMs?: number;
    resetAfterMs?: number;
  };
  createAgent: (rpc: RpcChannel) => unknown;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: () => void;
  onError?: (err: unknown) => void;
}

const DEFAULT_INITIAL_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 30_000;
const DEFAULT_RESET_AFTER_MS = 60_000;
const BACKOFF_MULTIPLIER = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createConnectionLoop(
  transport: WsTransport,
  url: string,
  options: ConnectionLoopOptions,
): { close: () => void } {
  const {
    middleware = [],
    reconnect,
    createAgent,
    onConnect,
    onDisconnect,
    onReconnecting,
    onError,
  } = options;

  const initialDelay = reconnect?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelay = reconnect?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const resetAfter = reconnect?.resetAfterMs ?? DEFAULT_RESET_AFTER_MS;

  let closed = false;
  let currentClose: (() => void) | null = null;

  function waitForDisconnect(rpc: RpcChannel): Promise<void> {
    return new Promise<void>((resolve) => {
      const unsub = rpc.on('disconnect', () => {
        unsub();
        resolve();
      });
    });
  }

  async function connectAndWait(): Promise<number> {
    const { rpc, close } = await transport.connect(url, middleware);
    currentClose = close;

    if (closed) {
      close();
      return 0;
    }

    createAgent(rpc);
    onConnect?.();

    const connectedAt = Date.now();
    await waitForDisconnect(rpc);
    return Date.now() - connectedAt;
  }

  async function loop() {
    let currentDelay = initialDelay;

    while (!closed) {
      try {
        const connectedMs = await connectAndWait();
        if (closed) break;
        if (connectedMs >= resetAfter) currentDelay = initialDelay;
        onDisconnect?.();
      } catch (err) {
        if (onError) onError(err);
        else console.error('[connection-loop] unhandled error', err);
      }

      if (closed) break;
      onReconnecting?.();
      await sleep(currentDelay);
      currentDelay = Math.min(currentDelay * BACKOFF_MULTIPLIER, maxDelay);
    }
  }

  void loop();

  return {
    close() {
      closed = true;
      if (currentClose) {
        currentClose();
        currentClose = null;
      }
    },
  };
}
