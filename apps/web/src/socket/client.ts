import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { Socket } from 'socket.io-client';
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

export function createSocket(url?: string): TypedSocket | Promise<TypedSocket> {
  const target = url ?? config.serverUrl;
  if (config.transport === 'ws') {
    const client = new WsClient(toWsUrl(target));
    return new WsSocketAdapter(client) as unknown as TypedSocket;
  }
  return import('socket.io-client').then(({ io }) => io(target, { autoConnect: false }));
}

/** http(s)://host[/path] → ws(s)://host/ws (or /ws appended). */
function toWsUrl(httpUrl: string): string {
  const base = httpUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = new URL('/ws', base || 'http://localhost');
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
