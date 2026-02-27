import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { io, type Socket } from 'socket.io-client';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(url?: string): TypedSocket {
  return io(url ?? import.meta.env.VITE_SERVER_URL, {
    autoConnect: false,
  });
}
