import { createHeartbeat, type Heartbeat } from '@code-quest/shared';
import { WebSocket } from 'ws';

const DEFAULT_PONG_TIMEOUT_MS = 60_000;
const DEFAULT_INITIAL_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 30_000;
const DEFAULT_RESET_AFTER_MS = 60_000;

export interface DaemonConnectionOptions {
  server: string;
  token: string;
  reconnect?: {
    initialDelayMs?: number;
    maxDelayMs?: number;
    resetAfterMs?: number;
  };
  heartbeat?: {
    intervalMs?: number;
    pongTimeoutMs?: number;
  };
  onConnect?: (ws: WebSocket) => void;
  onDisconnect?: () => void;
  onReconnecting?: () => void;
}

export function createDaemonConnection(opts: DaemonConnectionOptions): { close(): void } {
  const { server, token, reconnect, heartbeat, onConnect, onDisconnect, onReconnecting } = opts;

  const pingInterval = heartbeat?.intervalMs ?? 0;
  const pongTimeout = heartbeat?.pongTimeoutMs ?? DEFAULT_PONG_TIMEOUT_MS;

  const initialDelay = reconnect?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelay = reconnect?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const resetAfter = reconnect?.resetAfterMs ?? DEFAULT_RESET_AFTER_MS;

  let currentDelay = initialDelay;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let connectedAt: number | null = null;
  let ws: WebSocket | null = null;
  let hb: Heartbeat | null = null;

  function connect() {
    if (closed) return;

    ws = new WebSocket(server, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const socket = ws;
    hb = createHeartbeat(socket, { pongTimeoutMs: pongTimeout });

    ws.on('open', () => {
      connectedAt = Date.now();
      if (pingInterval) hb?.start(pingInterval);
      onConnect?.(socket);
    });

    ws.on('close', () => {
      hb?.stop();
      if (closed) return;

      // Reset backoff if connected long enough
      if (connectedAt && Date.now() - connectedAt >= resetAfter) {
        currentDelay = initialDelay;
      }

      connectedAt = null;
      onDisconnect?.();
      scheduleReconnect();
    });

    ws.on('error', () => {
      // error is always followed by close, so reconnect happens there
    });
  }

  function scheduleReconnect() {
    if (closed) return;

    onReconnecting?.();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, currentDelay);

    currentDelay = Math.min(currentDelay * 2, maxDelay);
  }

  function close() {
    closed = true;
    hb?.stop();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  connect();

  return { close };
}
