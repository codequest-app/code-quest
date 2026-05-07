import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { io, type Socket } from 'socket.io-client';
import { config } from '../config.ts';
import { WsClient } from './ws-client.ts';
import { WsSocketAdapter } from './ws-socket-adapter.ts';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Returns a socket whose API matches socket.io-client's `Socket` (the surface
 * code-quest hooks rely on: connect/disconnect/on/off/emit/connected/id and
 * the special 'connect' / 'connect_error' events).
 *
 * `config.transport` selects the implementation:
 *   - 'socketio' → real socket.io-client (legacy / tests / fallback)
 *   - 'ws'       → WsSocketAdapter wrapping a raw-WebSocket WsClient
 */
export function createSocket(url?: string): TypedSocket {
  const target = url ?? config.serverUrl;
  if (config.transport === 'ws') {
    const wsUrl = toWsUrl(target);
    const client = new WsClient(wsUrl);
    // Cast: WsSocketAdapter implements the socket.io Socket subset code-quest
    // actually consumes (id/connected/connect/disconnect/on/off/emit + the
    // 'connect'/'connect_error' lifecycle events). It deliberately does NOT
    // implement the rest of Socket (timeout/volatile/compress/broadcast/...).
    // A future change should narrow TypedSocket to that subset so the cast
    // becomes structurally valid; until then a codebase grep confirms no
    // consumer touches the omitted methods.
    return new WsSocketAdapter(client) as unknown as TypedSocket;
  }
  return io(target, { autoConnect: false });
}

/** http(s)://host[/path] → ws(s)://host/ws (or /ws appended). */
function toWsUrl(httpUrl: string): string {
  const base = httpUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = new URL('/ws', base || 'http://localhost');
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
