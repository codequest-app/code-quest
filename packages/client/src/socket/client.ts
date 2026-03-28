import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { io, type Socket } from 'socket.io-client';
import { config } from '../config';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(url?: string): TypedSocket {
  return io(url ?? config.serverUrl, {
    autoConnect: false,
  });
}
