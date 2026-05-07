import type { Server as HttpServer } from 'node:http';
import type {
  Authenticator,
  Transport,
  TransportHandle,
  TypedSocket,
} from '@code-quest/shared/node';
import { Server } from 'socket.io';
import { logger } from '../logger.ts';

interface SocketIoTransportOptions {
  authenticator: Authenticator;
  /** Forwarded to socket.io server constructor. */
  cors?: { origin: string | string[] | boolean };
}

/**
 * SocketIoTransport — adapts the legacy socket.io Server to the project's
 * Transport contract. Each accepted socket.io Socket is forwarded to
 * onConnection listeners as a TypedSocket (it satisfies the minimal surface
 * structurally). Authentication runs in `io.use()` middleware: a null
 * AuthContext rejects the handshake.
 */
export class SocketIoTransport implements Transport {
  private io?: Server;
  private listeners = new Set<(socket: TypedSocket) => void>();

  private readonly opts: SocketIoTransportOptions;
  constructor(opts: SocketIoTransportOptions) {
    this.opts = opts;
  }

  attach(httpServer: HttpServer): TransportHandle {
    const cors = this.opts.cors ?? { origin: '*' };
    const io = new Server(httpServer, { cors });
    this.io = io;

    io.use(async (socket, next) => {
      const ctx = await this.opts.authenticator.authenticate(socket.request);
      if (!ctx) {
        next(new Error('Unauthorized'));
        return;
      }
      next();
    });

    io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Socket connected');
      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'Socket disconnected');
      });
      const typed = socket as unknown as TypedSocket;
      for (const cb of this.listeners) {
        try {
          cb(typed);
        } catch (err) {
          logger.warn({ err }, 'onConnection listener threw');
        }
      }
    });

    return {
      onConnection: (cb) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
      },
      close: async () => {
        this.listeners.clear();
        if (!this.io) return;
        const io = this.io;
        this.io = undefined;
        // Disconnect existing sockets and detach engine handlers from the http
        // server WITHOUT closing the underlying http server (the http server's
        // lifecycle is owned by the caller, not the transport).
        io.disconnectSockets(true);
        io.engine.close();
        io.removeAllListeners();
      },
    };
  }
}
