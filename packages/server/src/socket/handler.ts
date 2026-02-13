import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { Socket, Server as SocketIOServer } from 'socket.io';
import type { ChatManager } from '../chat/types.ts';
import type { OrchestratorSession, OrchestratorSessionFactory } from '../orchestrator/types.ts';
import type { TerminalManager } from '../terminal/types.ts';
import { TYPES } from '../types.symbols.ts';
import type { ClientToServerEvents, ServerToClientEvents, SocketHandler } from './types.ts';

/**
 * Socket.io handler implementation
 * Handles WebSocket connections and terminal events
 */
@injectable()
export class SocketHandlerImpl implements SocketHandler {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;
  private readonly orchestrators = new Map<string, OrchestratorSession>();

  constructor(
    @inject(TYPES.TerminalManager)
    private readonly terminalManager: TerminalManager,
    @inject(TYPES.ChatManager)
    private readonly chatManager: ChatManager,
    @inject(TYPES.OrchestratorSessionFactory)
    private readonly createOrchestrator: OrchestratorSessionFactory,
  ) {}

  attach(io: SocketIOServer): void {
    this.io = io as SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id}`);

    // Handle terminal:create
    socket.on('terminal:create', (options) => {
      try {
        const session = this.terminalManager.createSession(options);

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
      const session = this.terminalManager.getSession(sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${sessionId}`);
        return;
      }

      session.write(data);
    });

    // Handle terminal:resize
    socket.on('terminal:resize', (sessionId, cols, rows) => {
      const session = this.terminalManager.getSession(sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${sessionId}`);
        return;
      }

      session.resize({ cols, rows });
    });

    // Handle terminal:kill
    socket.on('terminal:kill', (sessionId) => {
      const session = this.terminalManager.getSession(sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${sessionId}`);
        return;
      }

      session.kill();
    });

    // Handle terminal:list
    socket.on('terminal:list', () => {
      const sessionIds = this.terminalManager.listSessions();
      socket.emit('terminal:list', sessionIds);
    });

    // Handle chat:create
    socket.on('chat:create', (options) => {
      try {
        const session = this.chatManager.createSession(options);

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
      const session = this.chatManager.getSession(sessionId);
      if (!session) {
        socket.emit('chat:error', sessionId, 'Session not found');
        return;
      }
      session.sendMessage(message);
    });

    // Handle chat:allow-tool (permission: allow a tool for next spawn)
    socket.on('chat:allow-tool', (sessionId, toolName) => {
      const session = this.chatManager.getSession(sessionId);
      if (!session) {
        socket.emit('chat:error', sessionId, 'Session not found');
        return;
      }
      session.addAllowedTool(toolName);
    });

    // Handle chat:abort
    socket.on('chat:abort', (sessionId) => {
      const session = this.chatManager.getSession(sessionId);
      if (!session) {
        socket.emit('chat:error', sessionId, 'Session not found');
        return;
      }
      session.abort();
    });

    // Handle chat:kill
    socket.on('chat:kill', (sessionId) => {
      this.chatManager.removeSession(sessionId);
    });

    // Handle orchestrator:create
    socket.on('orchestrator:create', (options) => {
      try {
        const orch = this.createOrchestrator({ provider: options.provider });

        this.orchestrators.set(orch.id, orch);

        // Wire up coordinator chat events through existing chat:event channel
        const coordSession = this.chatManager.getSession(orch.coordinatorId);
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
}
