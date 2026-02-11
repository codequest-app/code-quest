import type { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  SocketHandler,
  SocketHandlerConfig,
  ClientToServerEvents,
  ServerToClientEvents,
} from './types';

/**
 * Socket.io handler implementation
 * Handles WebSocket connections and terminal events
 */
export class SocketHandlerImpl implements SocketHandler {
  private readonly io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private readonly config: SocketHandlerConfig;

  constructor(io: SocketIOServer, config: SocketHandlerConfig) {
    this.io = io;
    this.config = config;

    // Set up connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id}`);

    // Handle terminal:create
    socket.on('terminal:create', (options) => {
      try {
        const session = this.config.terminalManager.createSession(options);

        // Set up data handler
        session.onData((data) => {
          socket.emit('terminal:data', session.id, data);
        });

        // Set up exit handler
        session.onExit((exitCode) => {
          socket.emit('terminal:exit', session.id, exitCode);
        });

        // Emit created event
        socket.emit('terminal:created', session.id, session.pid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error creating terminal:', message);
        socket.emit('terminal:error', `Failed to create terminal: ${message}`);
      }
    });

    // Handle terminal:write
    socket.on('terminal:write', (sessionId, data) => {
      const session = this.config.terminalManager.getSession(sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${sessionId}`);
        return;
      }

      session.write(data);
    });

    // Handle terminal:resize
    socket.on('terminal:resize', (sessionId, cols, rows) => {
      const session = this.config.terminalManager.getSession(sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${sessionId}`);
        return;
      }

      session.resize({ cols, rows });
    });

    // Handle terminal:kill
    socket.on('terminal:kill', (sessionId) => {
      const session = this.config.terminalManager.getSession(sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${sessionId}`);
        return;
      }

      session.kill();
    });

    // Handle terminal:list
    socket.on('terminal:list', () => {
      const sessionIds = this.config.terminalManager.listSessions();
      socket.emit('terminal:list', sessionIds);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  handleDisconnection(socket: Socket): void {
    console.log(`Client disconnected: ${socket.id}`);
    // Sessions survive disconnects - they must be explicitly killed
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}
