import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { Server as SocketIOServer } from 'socket.io';
import type { ChatManager } from './chat/types';
import { TYPES } from './container';
import { HttpServerImpl } from './http/server';
import { SocketHandlerImpl } from './socket/handler';
import type { TerminalManager } from './terminal/types';
import type { Server, ServerConfig, ServerStatus } from './types';

/**
 * Main server implementation
 * Integrates HTTP server, Socket.io, and terminal management.
 * Uses inversify for dependency injection.
 */
@injectable()
export class ServerImpl implements Server {
  private config: ServerConfig = { port: 0 };
  private httpServer: HttpServerImpl | null = null;
  private io: SocketIOServer | null = null;
  private startTime: number = Date.now();

  constructor(
    @inject(TYPES.TerminalManager) private readonly terminalManager: TerminalManager,
    @inject(TYPES.ChatManager) private readonly chatManager: ChatManager,
  ) {}

  /** Set config before calling start(). Inversify creates the instance first. */
  setConfig(config: ServerConfig): void {
    this.config = config;
    this.startTime = Date.now();
  }

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

    // 3. Set up Socket.io handler
    this.socketHandler = new SocketHandlerImpl(this.io, {
      terminalManager: this.terminalManager,
      chatManager: this.chatManager,
    });

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

    this.socketHandler = null;

    // 3. Stop HTTP server
    if (this.httpServer) {
      try {
        await this.httpServer.stop();
      } catch (error) {
        if ((error as any).code !== 'ERR_SERVER_NOT_RUNNING') {
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
    return this.httpServer?.isRunning();
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
