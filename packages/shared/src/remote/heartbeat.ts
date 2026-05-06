export interface PingPongSocket {
  readonly readyState: number;
  readonly OPEN: number;
  ping(): void;
  terminate(): void;
  on(event: 'pong', listener: () => void): void;
  off(event: 'pong', listener: () => void): void;
}

export interface Heartbeat {
  start(intervalMs: number): void;
  stop(): void;
}

export interface HeartbeatOptions {
  pongTimeoutMs: number;
  onTimeout?: () => void;
}

export function createHeartbeat(ws: PingPongSocket, options: HeartbeatOptions): Heartbeat {
  const { pongTimeoutMs, onTimeout } = options;
  let interval: ReturnType<typeof setInterval> | null = null;
  let pongTimer: ReturnType<typeof setTimeout> | null = null;

  const onPong = () => {
    if (pongTimer) {
      clearTimeout(pongTimer);
      pongTimer = null;
    }
  };

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    if (pongTimer) {
      clearTimeout(pongTimer);
      pongTimer = null;
    }
    ws.off('pong', onPong);
  }

  function start(intervalMs: number) {
    stop();
    ws.on('pong', onPong);

    interval = setInterval(() => {
      if (ws.readyState !== ws.OPEN) {
        stop();
        return;
      }
      ws.ping();
      pongTimer = setTimeout(() => {
        onTimeout?.();
        ws.terminate();
      }, pongTimeoutMs);
    }, intervalMs);
  }

  return { start, stop };
}
