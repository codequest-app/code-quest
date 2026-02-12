import type { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  SocketHandler,
  SocketHandlerConfig,
  ClientToServerEvents,
  ServerToClientEvents,
} from './types';
import { OrchestratorSessionImpl } from '../orchestrator/session';
import type { OrchestratorSession } from '../orchestrator/types';

/**
 * Socket.io handler implementation
 * Handles WebSocket connections and terminal events
 */
export class SocketHandlerImpl implements SocketHandler {
  private readonly io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private readonly config: SocketHandlerConfig;
  private readonly orchestrators = new Map<string, OrchestratorSessionImpl>();

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

    // Handle chat:create
    socket.on('chat:create', (options) => {
      try {
        const session = this.config.chatManager.createSession(options);

        session.onEvent((event) => {
          socket.emit('chat:event', session.id, event);
        });

        session.onComplete((stats) => {
          socket.emit('chat:complete', session.id, stats);
        });

        session.onError((message) => {
          socket.emit('chat:error', session.id, message);
        });

        session.onExit(() => {
          socket.emit('chat:exit', session.id);
        });

        socket.emit('chat:created', session.id, session.provider);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error creating chat session:', message);
        socket.emit('terminal:error', `Failed to create chat: ${message}`);
      }
    });

    // Handle chat:send
    socket.on('chat:send', (sessionId, message) => {
      const session = this.config.chatManager.getSession(sessionId);
      if (!session) {
        socket.emit('chat:error', sessionId, 'Session not found');
        return;
      }
      session.sendMessage(message);
    });

    // Handle chat:respond (permission prompt response)
    socket.on('chat:respond', (sessionId, response) => {
      const session = this.config.chatManager.getSession(sessionId);
      if (!session) {
        socket.emit('chat:error', sessionId, 'Session not found');
        return;
      }
      session.respond(response);
    });

    // Handle chat:abort
    socket.on('chat:abort', (sessionId) => {
      const session = this.config.chatManager.getSession(sessionId);
      if (!session) {
        socket.emit('chat:error', sessionId, 'Session not found');
        return;
      }
      session.abort();
    });

    // Handle chat:kill
    socket.on('chat:kill', (sessionId) => {
      this.config.chatManager.removeSession(sessionId);
    });

    // Handle orchestrator:create
    socket.on('orchestrator:create', (options) => {
      try {
        const orch = new OrchestratorSessionImpl({
          chatManager: this.config.chatManager,
          provider: options.provider,
        });

        this.orchestrators.set(orch.id, orch);

        // Wire up coordinator chat events through existing chat:event channel
        const coordSession = this.config.chatManager.getSession(orch.coordinatorId);
        if (coordSession) {
          coordSession.onEvent((event) => {
            socket.emit('chat:event', coordSession.id, event);
          });
          coordSession.onComplete((stats) => {
            socket.emit('chat:complete', coordSession.id, stats);
          });
          coordSession.onError((message) => {
            socket.emit('chat:error', coordSession.id, message);
          });
        }

        // Wire up orchestrator-specific events
        orch.onStatusChange((status) => {
          socket.emit('orchestrator:status', orch.id, status);
          if (status === 'workers-complete') {
            socket.emit('orchestrator:all-complete', orch.id, orch.getWorkerResults());
          }
        });

        orch.onWorkerEvent((workerId, event) => {
          socket.emit('orchestrator:worker-event', orch.id, workerId, event);
        });

        orch.onWorkerComplete((workerId, result) => {
          socket.emit('orchestrator:worker-complete', orch.id, workerId, result);
        });

        orch.onError((message) => {
          socket.emit('orchestrator:error', orch.id, message);
        });

        socket.emit('orchestrator:created', orch.id, orch.coordinatorId, options.provider);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        socket.emit('orchestrator:error', '', `Failed to create orchestrator: ${message}`);
      }
    });

    // Handle orchestrator:dispatch
    socket.on('orchestrator:dispatch', (orchId, tasks) => {
      const orch = this.orchestrators.get(orchId);
      if (!orch) {
        socket.emit('orchestrator:error', orchId, 'Orchestrator not found');
        return;
      }
      orch.dispatch(tasks);
      socket.emit('orchestrator:dispatched', orchId, orch.workers);
    });

    // Handle orchestrator:synthesize
    socket.on('orchestrator:synthesize', (orchId) => {
      const orch = this.orchestrators.get(orchId);
      if (!orch) {
        socket.emit('orchestrator:error', orchId, 'Orchestrator not found');
        return;
      }
      orch.synthesize();
    });

    // Handle orchestrator:abort
    socket.on('orchestrator:abort', (orchId) => {
      const orch = this.orchestrators.get(orchId);
      if (!orch) {
        socket.emit('orchestrator:error', orchId, 'Orchestrator not found');
        return;
      }
      orch.abort();
    });

    // Handle orchestrator:kill
    socket.on('orchestrator:kill', (orchId) => {
      const orch = this.orchestrators.get(orchId);
      if (!orch) {
        socket.emit('orchestrator:error', orchId, 'Orchestrator not found');
        return;
      }
      orch.kill();
      this.orchestrators.delete(orchId);
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
