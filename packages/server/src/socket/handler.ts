import 'reflect-metadata';
import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import {
  chatAbortSchema,
  chatAllowToolSchema,
  chatControlRespondSchema,
  chatControlSchema,
  chatCreateSchema,
  chatKillSchema,
  chatSendSchema,
  orchestratorAbortSchema,
  orchestratorCreateSchema,
  orchestratorDispatchSchema,
  orchestratorKillSchema,
  orchestratorRetryWorkerSchema,
  orchestratorSkipWorkerSchema,
  orchestratorSynthesizeSchema,
  terminalCreateSchema,
  terminalKillSchema,
  terminalResizeSchema,
  terminalWriteSchema,
} from '@code-quest/shared';
import { inject, injectable } from 'inversify';
import type { Socket, Server as SocketIOServer } from 'socket.io';
import type { ChatLogger } from '../chat/logger.ts';
import type { ChatManager } from '../chat/types.ts';
import type { GitService } from '../git/types.ts';
import type { OrchestratorSession, OrchestratorSessionFactory } from '../orchestrator/types.ts';
import type { TerminalManager } from '../terminal/types.ts';
import { TYPES } from '../types.symbols.ts';
import type { SocketHandler } from './types.ts';

/**
 * Socket.io handler implementation
 * Handles WebSocket connections and terminal events
 */
@injectable()
export class SocketHandlerImpl implements SocketHandler {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;
  private readonly orchestrators = new Map<string, OrchestratorSession>();
  private readonly loggedSessions = new Set<string>();
  private readonly pendingControlRequests = new Map<
    string,
    { toolName?: string; input?: unknown; toolUseId?: string }
  >();

  constructor(
    @inject(TYPES.TerminalManager)
    private readonly terminalManager: TerminalManager,
    @inject(TYPES.ChatManager)
    private readonly chatManager: ChatManager,
    @inject(TYPES.OrchestratorSessionFactory)
    private readonly createOrchestrator: OrchestratorSessionFactory,
    @inject(TYPES.GitService)
    private readonly gitService: GitService,
    @inject(TYPES.ChatLogger)
    private readonly chatLogger: ChatLogger,
  ) {}

  attach(io: SocketIOServer): void {
    this.io = io as SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id}`);

    // Send system capabilities
    socket.emit('system:capabilities', {
      worktree: this.gitService.isWorktreeSupported(),
    });

    // Handle terminal:create
    socket.on('terminal:create', (options) => {
      const parsed = terminalCreateSchema.safeParse(options);
      if (!parsed.success) {
        socket.emit('terminal:error', `Validation error: ${parsed.error.message}`);
        return;
      }

      try {
        const session = this.terminalManager.createSession(parsed.data);

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
      const parsed = terminalWriteSchema.safeParse({ sessionId, data });
      if (!parsed.success) {
        socket.emit('terminal:error', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.terminalManager.getSession(parsed.data.sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${parsed.data.sessionId}`);
        return;
      }

      session.write(parsed.data.data);
    });

    // Handle terminal:resize
    socket.on('terminal:resize', (sessionId, cols, rows) => {
      const parsed = terminalResizeSchema.safeParse({ sessionId, cols, rows });
      if (!parsed.success) {
        socket.emit('terminal:error', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.terminalManager.getSession(parsed.data.sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${parsed.data.sessionId}`);
        return;
      }

      session.resize({ cols: parsed.data.cols, rows: parsed.data.rows });
    });

    // Handle terminal:kill
    socket.on('terminal:kill', (sessionId) => {
      const parsed = terminalKillSchema.safeParse({ sessionId });
      if (!parsed.success) {
        socket.emit('terminal:error', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.terminalManager.getSession(parsed.data.sessionId);

      if (!session) {
        socket.emit('terminal:error', `Session not found: ${parsed.data.sessionId}`);
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
      const parsed = chatCreateSchema.safeParse(options);
      if (!parsed.success) {
        socket.emit('chat:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      try {
        const session = this.chatManager.createSession(parsed.data);

        this.chatLogger.createSession(session.id, {
          provider: session.provider,
          command: session.command,
          args: session.baseArgs,
          cwd: session.cwd,
          mode: session.mode,
        });

        this.chatLogger.log(session.id, {
          dir: 'out',
          type: 'session_created',
          data: { provider: session.provider },
        });

        this.attachLogger(session.id, session, socket);

        session.onEvent((event) => {
          socket.emit('chat:event', session.id, event);
          if (event.type === 'control_request') {
            const data = event.data as {
              requestId: string;
              toolName?: string;
              input?: unknown;
              toolUseId?: string;
            };
            this.pendingControlRequests.set(data.requestId, {
              toolName: data.toolName,
              input: data.input,
              toolUseId: data.toolUseId,
            });
            socket.emit('chat:control-request', session.id, event.data);
          }
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
        socket.emit('chat:error', '', `Failed to create chat: ${message}`);
      }
    });

    // Handle chat:send
    socket.on('chat:send', (sessionId, message) => {
      const parsed = chatSendSchema.safeParse({ sessionId, message });
      if (!parsed.success) {
        socket.emit('chat:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.chatManager.getSession(parsed.data.sessionId);
      if (!session) {
        socket.emit('chat:error', parsed.data.sessionId, 'Session not found');
        return;
      }
      this.attachLogger(parsed.data.sessionId, session, socket);
      this.chatLogger.log(parsed.data.sessionId, {
        dir: 'in',
        type: 'user_message',
        data: { message: parsed.data.message },
      });
      session.sendMessage(parsed.data.message);
    });

    // Handle chat:allow-tool (permission: allow a tool for next spawn)
    socket.on('chat:allow-tool', (sessionId, toolName) => {
      const parsed = chatAllowToolSchema.safeParse({ sessionId, toolName });
      if (!parsed.success) {
        socket.emit('chat:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.chatManager.getSession(parsed.data.sessionId);
      if (!session) {
        socket.emit('chat:error', parsed.data.sessionId, 'Session not found');
        return;
      }
      this.chatLogger.log(parsed.data.sessionId, {
        dir: 'in',
        type: 'allow_tool',
        data: { toolName: parsed.data.toolName },
      });
      session.addAllowedTool(parsed.data.toolName);
    });

    // Handle chat:abort
    socket.on('chat:abort', (sessionId) => {
      const parsed = chatAbortSchema.safeParse({ sessionId });
      if (!parsed.success) {
        socket.emit('chat:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.chatManager.getSession(parsed.data.sessionId);
      if (!session) {
        socket.emit('chat:error', parsed.data.sessionId, 'Session not found');
        return;
      }
      this.chatLogger.log(parsed.data.sessionId, { dir: 'in', type: 'abort', data: {} });
      session.abort();
    });

    // Handle chat:kill
    socket.on('chat:kill', (sessionId) => {
      const parsed = chatKillSchema.safeParse({ sessionId });
      if (!parsed.success) {
        socket.emit('chat:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      this.chatLogger.log(parsed.data.sessionId, { dir: 'in', type: 'kill', data: {} });
      this.chatLogger.close(parsed.data.sessionId);
      this.chatManager.removeSession(parsed.data.sessionId);
    });

    // Handle chat:control (Extension→CLI control request)
    socket.on('chat:control', (sessionId, subtype, params) => {
      const parsed = chatControlSchema.safeParse({ sessionId, subtype, params });
      if (!parsed.success) {
        socket.emit('chat:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.chatManager.getSession(parsed.data.sessionId);
      if (!session) {
        socket.emit('chat:error', parsed.data.sessionId, 'Session not found');
        return;
      }
      this.chatLogger.log(parsed.data.sessionId, {
        dir: 'in',
        type: 'control_request_sent',
        data: { subtype: parsed.data.subtype, params: parsed.data.params },
      });
      session.sendControlRequestAsync(parsed.data.subtype, parsed.data.params);
    });

    // Handle chat:control-respond (respond to CLI→Extension control request)
    socket.on('chat:control-respond', (sessionId, requestId, response) => {
      const parsed = chatControlRespondSchema.safeParse({ sessionId, requestId, response });
      if (!parsed.success) {
        socket.emit('chat:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const session = this.chatManager.getSession(parsed.data.sessionId);
      if (!session) {
        socket.emit('chat:error', parsed.data.sessionId, 'Session not found');
        return;
      }
      const originalRequest = this.pendingControlRequests.get(parsed.data.requestId);
      this.pendingControlRequests.delete(parsed.data.requestId);
      this.chatLogger.log(parsed.data.sessionId, {
        dir: 'in',
        type: 'control_response',
        data: {
          requestId: parsed.data.requestId,
          response: parsed.data.response,
          ...originalRequest,
        },
      });
      session.respondToControlRequest(parsed.data.requestId, parsed.data.response);
    });

    // Handle orchestrator:create
    socket.on('orchestrator:create', (options) => {
      const parsed = orchestratorCreateSchema.safeParse(options);
      if (!parsed.success) {
        socket.emit('orchestrator:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      try {
        const orch = this.createOrchestrator({ provider: parsed.data.provider });

        this.orchestrators.set(orch.id, orch);

        this.chatLogger.log(orch.id, {
          dir: 'out',
          type: 'orchestrator_created',
          data: { coordinatorId: orch.coordinatorId, provider: parsed.data.provider },
        });

        // Wire up coordinator chat events through existing chat:event channel
        const coordSession = this.chatManager.getSession(orch.coordinatorId);
        if (coordSession) {
          this.attachLogger(coordSession.id, coordSession, socket);
          coordSession.onEvent((event) => {
            socket.emit('chat:event', coordSession.id, event);
            if (event.type === 'control_request') {
              const data = event.data as { requestId: string; toolName?: string; input?: unknown };
              this.pendingControlRequests.set(data.requestId, {
                toolName: data.toolName,
                input: data.input,
              });
              socket.emit('chat:control-request', coordSession.id, event.data);
            }
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
          this.chatLogger.log(orch.id, { dir: 'out', type: 'status_change', data: { status } });
          socket.emit('orchestrator:status', orch.id, status);
          if (status === 'workers-complete') {
            socket.emit('orchestrator:all-complete', orch.id, orch.getWorkerResults());
          }
        });

        orch.onWorkerEvent((workerId, event) => {
          this.chatLogger.log(workerId, { dir: 'out', type: event.type, data: event });
          socket.emit('orchestrator:worker-event', orch.id, workerId, event);
        });

        orch.onWorkerComplete((workerId, result) => {
          const type = result.error ? 'error' : 'complete';
          this.chatLogger.log(workerId, { dir: 'out', type, data: result });
          this.chatLogger.close(workerId);
          socket.emit('orchestrator:worker-complete', orch.id, workerId, result);
        });

        orch.onMergeError((workerId, error) => {
          this.chatLogger.log(orch.id, {
            dir: 'out',
            type: 'merge_error',
            data: { workerId, error },
          });
          socket.emit('orchestrator:merge-error', orch.id, workerId, error);
        });

        orch.onError((message) => {
          socket.emit('orchestrator:error', orch.id, message);
        });

        orch.onWorkerWorktree((workerId, worktreePath, branch) => {
          socket.emit('session:worktree', workerId, worktreePath, branch);
        });

        orch.onWorkersUpdated((workers) => {
          this.chatLogger.log(orch.id, { dir: 'out', type: 'workers_updated', data: { workers } });
          socket.emit('orchestrator:workers-updated', orch.id, workers);
        });

        orch.onWorkerControlRequest((workerId, request) => {
          socket.emit('chat:control-request', workerId, request);
        });

        socket.emit('orchestrator:created', orch.id, orch.coordinatorId, parsed.data.provider);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        socket.emit('orchestrator:error', '', `Failed to create orchestrator: ${message}`);
      }
    });

    // Handle orchestrator:dispatch
    socket.on('orchestrator:dispatch', async (orchId, tasks) => {
      const parsed = orchestratorDispatchSchema.safeParse({ orchId, tasks });
      if (!parsed.success) {
        socket.emit('orchestrator:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const orch = this.orchestrators.get(parsed.data.orchId);
      if (!orch) {
        socket.emit('orchestrator:error', parsed.data.orchId, 'Orchestrator not found');
        return;
      }
      await orch.dispatch(parsed.data.tasks);
      socket.emit('orchestrator:dispatched', parsed.data.orchId, orch.workers);
    });

    // Handle orchestrator:synthesize
    socket.on('orchestrator:synthesize', (orchId) => {
      const parsed = orchestratorSynthesizeSchema.safeParse({ orchId });
      if (!parsed.success) {
        socket.emit('orchestrator:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const orch = this.orchestrators.get(parsed.data.orchId);
      if (!orch) {
        socket.emit('orchestrator:error', parsed.data.orchId, 'Orchestrator not found');
        return;
      }
      orch.synthesize();
    });

    // Handle orchestrator:abort
    socket.on('orchestrator:abort', (orchId) => {
      const parsed = orchestratorAbortSchema.safeParse({ orchId });
      if (!parsed.success) {
        socket.emit('orchestrator:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const orch = this.orchestrators.get(parsed.data.orchId);
      if (!orch) {
        socket.emit('orchestrator:error', parsed.data.orchId, 'Orchestrator not found');
        return;
      }
      this.chatLogger.log(parsed.data.orchId, { dir: 'in', type: 'abort', data: {} });
      orch.abort();
    });

    // Handle orchestrator:kill
    socket.on('orchestrator:kill', (orchId) => {
      const parsed = orchestratorKillSchema.safeParse({ orchId });
      if (!parsed.success) {
        socket.emit('orchestrator:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const orch = this.orchestrators.get(parsed.data.orchId);
      if (!orch) {
        socket.emit('orchestrator:error', parsed.data.orchId, 'Orchestrator not found');
        return;
      }
      this.chatLogger.log(parsed.data.orchId, { dir: 'in', type: 'kill', data: {} });
      this.chatLogger.close(parsed.data.orchId);
      orch.kill();
      this.orchestrators.delete(parsed.data.orchId);
    });

    // Handle orchestrator:retry-worker
    socket.on('orchestrator:retry-worker', (orchId, workerId) => {
      const parsed = orchestratorRetryWorkerSchema.safeParse({ orchId, workerId });
      if (!parsed.success) {
        socket.emit('orchestrator:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const orch = this.orchestrators.get(parsed.data.orchId);
      if (!orch) {
        socket.emit('orchestrator:error', parsed.data.orchId, 'Orchestrator not found');
        return;
      }
      orch.retryWorker(parsed.data.workerId);
    });

    // Handle orchestrator:skip-worker
    socket.on('orchestrator:skip-worker', (orchId, workerId) => {
      const parsed = orchestratorSkipWorkerSchema.safeParse({ orchId, workerId });
      if (!parsed.success) {
        socket.emit('orchestrator:error', '', `Validation error: ${parsed.error.message}`);
        return;
      }

      const orch = this.orchestrators.get(parsed.data.orchId);
      if (!orch) {
        socket.emit('orchestrator:error', parsed.data.orchId, 'Orchestrator not found');
        return;
      }
      orch.skipWorker(parsed.data.workerId);
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

  private attachLogger(
    sessionId: string,
    session: ReturnType<ChatManager['getSession']>,
    socket: Socket,
  ): void {
    if (!session || this.loggedSessions.has(sessionId)) return;
    this.loggedSessions.add(sessionId);

    session.onEvent((event) => {
      this.chatLogger.log(sessionId, { dir: 'out', type: event.type, data: event });
    });

    session.onComplete((stats) => {
      this.chatLogger.log(sessionId, { dir: 'out', type: 'complete', data: stats });
    });

    session.onError((message) => {
      this.chatLogger.log(sessionId, { dir: 'out', type: 'error', data: { message } });
    });

    session.onExit(() => {
      this.chatLogger.log(sessionId, { dir: 'out', type: 'exit', data: {} });
      this.chatLogger.close(sessionId);
      this.loggedSessions.delete(sessionId);
    });

    session.onControlRequest((request) => {
      socket.emit('chat:control-request', sessionId, request);
    });

    session.onControlResponse((response) => {
      socket.emit('chat:control-response', sessionId, response);
    });
  }
}
