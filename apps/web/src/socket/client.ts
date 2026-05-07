import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { io, type Socket } from 'socket.io-client';
import { config } from '../config.ts';
import { WsClient } from './ws-client.ts';
import { WsSocketAdapter } from './ws-socket-adapter.ts';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketLike {
  id: string;
  connected: boolean;
  connect(): void;
  disconnect(): void;
  emit(event: string, ...args: unknown[]): void;
  on(event: string, fn: (...args: unknown[]) => void): void;
  off(event: string, fn: (...args: unknown[]) => void): void;
}

export function createSocket(url?: string): TypedSocket {
  const target = url ?? config.serverUrl;
  if (config.transport === 'ws') {
    const wsUrl = toWsUrl(target);
    const client = new WsClient(wsUrl);
    const adapter: SocketLike = new WsSocketAdapter(client);
    return adapter as unknown as TypedSocket;
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
