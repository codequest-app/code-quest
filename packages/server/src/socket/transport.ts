import type { Server as HttpServer } from 'node:http';
import type { TypedSocket } from './types.ts';

/**
 * Per-protocol transport contract.
 *
 * Implementations: SocketIoTransport, WsTransport, future SseTransport, etc.
 * Boot iterates configured transports and attaches each to one shared
 * ChannelEmitter via the handle's `onConnection` callback.
 *
 * Keep this surface minimal. Authentication is delegated to an injected
 * Authenticator. Broadcast is owned by ChannelEmitter, not Transport.
 * Sequence / replay is owned by ResumableSocket, not Transport.
 */
export interface Transport {
  /** Mount on a Node http.Server. Returns a handle for lifecycle + listener registration. */
  attach(httpServer: HttpServer): TransportHandle;
}

export interface TransportHandle {
  /** Subscribe to new accepted connections. Returns an unsubscribe fn. */
  onConnection(listener: (socket: TypedSocket) => void): () => void;
  /** Cleanly close the transport (stop accepting connections, end existing ones). */
  close(): Promise<void>;
}
