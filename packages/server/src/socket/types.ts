import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { Server, Socket } from 'socket.io';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

/** Generic socket.io callback — accepts any single result argument. */
export type SocketCallback = (result: Record<string, unknown>) => void;
