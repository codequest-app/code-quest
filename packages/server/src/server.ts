import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { Server as SocketIOServer } from 'socket.io';
import type { ChatManager } from './chat/types.ts';
import { HttpServerImpl } from './http/server.ts';
import type { SocketHandler } from './socket/types.ts';
import type { TerminalManager } from './terminal/types.ts';
import { TYPES } from './types.symbols.ts';
import type { Server, ServerConfig, ServerStatus } from './types.ts';

/**
 * Main server implementation
 * Integrates HTTP server, Socket.io, and terminal management.
 * Uses inversify for dependency injection.
 */
@injectable()
export class ServerImpl implements Server {
  private httpServer: HttpServerImpl | null = null;
  private io: SocketIOServer | null = null;
  private readonly startTime: number = Date.now();

  constructor(
    @inject(TYPES.ServerConfig) private readonly config: ServerConfig,
    @inject(TYPES.TerminalManager) private readonly terminalManager: TerminalManager,
    @inject(TYPES.ChatManager) private readonly chatManager: ChatManager,
    @inject(TYPES.SocketHandler) private readonly socketHandler: SocketHandler,
  ) {}

  async start(): Promise<void> {
    if (this.httpServer) {
      throw new Error('Server is already running');
    }

    // 1. Create HTTP server
    this.httpServer = new HttpServerImpl({
      port: this.config.port,
      terminalManager: this.terminalManager,
      cors: this.config.cors,
    });

    await this.httpServer.start();

    // 2. Create Socket.io server attached to HTTP server
    const httpServerInstance = this.httpServer.getHttpServer();

    if (!httpServerInstance) {
      throw new Error('Failed to get HTTP server instance');
    }

    this.io = new SocketIOServer(httpServerInstance, {
      cors: this.config.cors
        ? {
            origin: '*',
            methods: ['GET', 'POST'],
          }
        : undefined,
    });

    // 3. Attach Socket.io handler (injected via DI)
    this.socketHandler.attach(this.io);

    console.log(`Server started on port ${this.getPort()}`);
  }

  async stop(): Promise<void> {
    if (!this.httpServer) {
      return;
    }

    console.log('Stopping server...');

    // 1. Cleanup all sessions first
    this.terminalManager.cleanup();
    this.chatManager.cleanup();

    // 2. Close Socket.io connections
    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io?.close(() => {
          console.log('Socket.io server closed');
          resolve();
        });
      });
      this.io = null;
    }

    // 3. Stop HTTP server
    if (this.httpServer) {
      try {
        await this.httpServer.stop();
      } catch (error) {
        const isNotRunning =
          error instanceof Error && 'code' in error && error.code === 'ERR_SERVER_NOT_RUNNING';
        if (!isNotRunning) {
          throw error;
        }
      }
      this.httpServer = null;
    }

    console.log('Server stopped');
  }

  getPort(): number {
    if (!this.httpServer) {
      return 0;
    }
    return this.httpServer.getPort();
  }

  isRunning(): boolean {
    return this.httpServer?.isRunning() ?? false;
  }

  getStatus(): ServerStatus {
    return {
      running: this.isRunning(),
      port: this.getPort(),
      uptime: Date.now() - this.startTime,
      activeSessions: this.terminalManager.listSessions().length,
    };
  }
}
