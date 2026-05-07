import type { Middleware } from '../ws-transport.ts';

export interface HeartbeatOptions {
  pingIntervalMs?: number;
  idleTimeoutMs?: number;
}

const DEFAULT_PING_INTERVAL_MS = 25_000;
const DEFAULT_IDLE_TIMEOUT_MS = 60_000;
const MIN_IDLE_CHECK_MS = 50;
const MAX_IDLE_CHECK_MS = 5_000;
const CLOSE_CODE_IDLE = 4000;

export function heartbeat(opts?: HeartbeatOptions): Middleware {
  return async (context, next) => {
    await next();

    if (!context.socket) return;
    const socket = context.socket;

    const pingMs = opts?.pingIntervalMs ?? DEFAULT_PING_INTERVAL_MS;
    const idleMs = opts?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    let lastSeen = Date.now();

    socket.onPong(() => {
      lastSeen = Date.now();
    });

    const pingTimer = setInterval(() => {
      if (socket.readyState === socket.OPEN) socket.ping();
    }, pingMs);

    const idleCheckMs = Math.max(MIN_IDLE_CHECK_MS, Math.min(idleMs / 2, MAX_IDLE_CHECK_MS));
    const idleTimer = setInterval(() => {
      if (Date.now() - lastSeen > idleMs && socket.readyState === socket.OPEN) {
        socket.close(CLOSE_CODE_IDLE, 'idle');
      }
    }, idleCheckMs);

    await context.terminate?.();

    clearInterval(pingTimer);
    clearInterval(idleTimer);
  };
}
