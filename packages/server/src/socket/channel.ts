import type {
  ChannelMetaCache,
  ControlResponse,
  NotificationPayload,
  NotificationResponse,
  PlanCommentData,
  ServerToClientEvents,
  SessionInitPayload,
  SocketEvent,
} from '@code-quest/shared';
import type { ControlResponseEvent, ProcessRunner, ServerAction } from '@code-quest/summoner';
import { z } from 'zod';
import type { TypedSocket } from './handler-context.ts';

/** Default timeout for control requests (ms). */
const DEFAULT_CONTROL_TIMEOUT = 30_000;

/**
 * Maps adapter SocketEvent names to our socket protocol names.
 * Adapter names that differ from our protocol are remapped here.
 */
const errorPayload = z.object({ message: z.string() }).passthrough();
const sessionInitPayload = z
  .object({
    sessionId: z.string().optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
    model: z.string().optional(),
    permissionMode: z.string().optional(),
    tools: z.array(z.string()).optional(),
    fastModeState: z.unknown().optional(),
    mcpServers: z
      .array(z.object({ name: z.string(), status: z.string() }).passthrough())
      .optional(),
    slashCommands: z.array(z.string()).optional(),
  })
  .passthrough();
const sessionStatusPayload = z
  .object({
    permissionMode: z.string().optional(),
  })
  .passthrough();
const replayRequestPayload = z.object({ requestId: z.string() }).passthrough();

const sessionStateSchema = z.object({
  model: z.string().optional(),
  permissionMode: z.string().optional(),
  cwd: z.string().optional(),
  effort: z.string().optional(),
  thinkingLevel: z.string().optional(),
  tools: z.array(z.string()).optional(),
  mcpServers: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
  titleGenerated: z.boolean().optional(),
  pendingTitlePrompt: z.string().optional(),
  title: z.string().optional(),
});
export type SessionState = z.infer<typeof sessionStateSchema>;

/** Extract config fields from session:init into SessionState. */
const sessionInitConfigSchema = sessionStateSchema.pick({
  model: true,
  permissionMode: true,
  cwd: true,
  effort: true,
});

export interface PendingRequest {
  resolve: (value: ControlResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const requestMetaSchema = z.object({
  subtype: z.string(),
  toolName: z.string().optional(),
  toolUseId: z.string().optional(),
});
export type RequestMeta = z.infer<typeof requestMetaSchema>;

export interface WireRunnerHooks {
  onSocketEvent?: (channel: Channel, event: SocketEvent) => void;
  onServerAction?: (channel: Channel, action: ServerAction) => void;
  onExit?: (channel: Channel, code: number | null) => void;
}

export class Channel {
  readonly id: string;
  readonly runner: ProcessRunner;
  readonly provider: string;
  readonly sockets = new Set<TypedSocket>();
  private readonly _controlRequestMeta = new Map<string, RequestMeta>();
  readonly notificationRequests = new Map<string, (response: NotificationResponse) => void>();
  readonly pendingRequests = new Map<string, PendingRequest>();
  readonly mcpTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private _messageSeq = 0;
  private _sessionState: SessionState = {};
  private _metaCache: ChannelMetaCache = {};
  planComments: PlanCommentData[] = [];
  terminalLines: string[] = [];
  sessionId: string | null = null;
  private _resolveSessionId: (() => void) | null = null;
  readonly sessionIdReady: Promise<void>;

  get sessionState(): SessionState {
    return this._sessionState;
  }

  get metaCache(): ChannelMetaCache {
    return this._metaCache;
  }

  updateSessionState(partial: Partial<SessionState>): void {
    this._sessionState = { ...this._sessionState, ...partial };
  }

  resetSessionState(): void {
    this._sessionState = {};
  }

  updateMetaCache(partial: Partial<ChannelMetaCache>): void {
    this._metaCache = { ...this._metaCache, ...partial };
  }
  lastError: string | undefined;
  private _isProcessing = false;

  get isProcessing(): boolean {
    return this._isProcessing;
  }

  startProcessing(): void {
    this._isProcessing = true;
  }

  endProcessing(): void {
    this._isProcessing = false;
  }
  exited = false;
  readonly controlTimeout: number;

  constructor(
    runner: ProcessRunner,
    id: string,
    provider: string,
    controlTimeout = DEFAULT_CONTROL_TIMEOUT,
  ) {
    this.id = id;
    this.runner = runner;
    this.provider = provider;
    this.controlTimeout = controlTimeout;
    this.sessionIdReady = new Promise((resolve) => {
      this._resolveSessionId = resolve;
    });
  }

  get isWired(): boolean {
    return this._runnerListeners !== null;
  }

  addSocket(socket: TypedSocket): void {
    this.sockets.add(socket);
  }

  removeSocket(socket: TypedSocket): void {
    this.sockets.delete(socket);
  }

  // ── Control request tracking (unified from controlRequests Set + pendingRequestMeta Map) ──

  trackControlRequest(requestId: string, meta: RequestMeta): void {
    this._controlRequestMeta.set(requestId, meta);
  }

  removeControlRequest(requestId: string): void {
    this._controlRequestMeta.delete(requestId);
  }

  hasControlRequest(requestId: string): boolean {
    return this._controlRequestMeta.has(requestId);
  }

  getControlRequestMeta(requestId: string): RequestMeta | undefined {
    return this._controlRequestMeta.get(requestId);
  }

  emit(event: string, ...args: unknown[]): void {
    this.emitToSockets(null, event, ...args);
  }

  emitToOthers(exclude: TypedSocket, event: string, ...args: unknown[]): void {
    this.emitToSockets(exclude, event, ...args);
  }

  private emitToSockets(exclude: TypedSocket | null, event: string, ...args: unknown[]): void {
    for (const sock of this.sockets) {
      if (!exclude || sock.id !== exclude.id) {
        (sock.emit as (...a: unknown[]) => void)(event, ...args);
      }
    }
  }

  buildSessionInitPayload(): SessionInitPayload {
    const meta = this.metaCache;
    return {
      channelId: this.id,
      sessionId: this.sessionId ?? '',
      ...(meta.model ? { model: meta.model } : {}),
      ...(meta.tools ? { tools: meta.tools } : {}),
      ...(meta.permissionMode ? { permissionMode: meta.permissionMode } : {}),
      ...(meta.fastModeState !== undefined ? { fastModeState: meta.fastModeState } : {}),
      ...(meta.mcpServers ? { mcpServers: meta.mcpServers } : {}),
      ...(meta.slashCommands ? { slashCommands: meta.slashCommands } : {}),
      config: { ...this.sessionState },
    };
  }

  async replayPendingControlRequests(
    socket: TypedSocket,
    getPendingEvents: (sessionId: string) => Promise<{
      events: SocketEvent[];
      respondedRequestIds: Set<string>;
    }>,
    sessionId: string,
  ): Promise<void> {
    const { events, respondedRequestIds } = await getPendingEvents(sessionId);

    const pendingRequests: Array<{ requestId: string; event: SocketEvent }> = [];

    for (const event of events) {
      if (event.name === 'control:permission' || event.name === 'control:elicitation') {
        const { requestId } = replayRequestPayload.parse(event.payload);
        pendingRequests.push({ requestId, event });
      } else if (event.name === 'control:cancel') {
        const { requestId } = replayRequestPayload.parse(event.payload);
        respondedRequestIds.add(requestId);
      }
    }

    // Replay pending (not yet responded/cancelled) via named events
    for (const { requestId, event } of pendingRequests) {
      if (respondedRequestIds.has(requestId)) continue;

      const eventName = event.name as keyof ServerToClientEvents;
      (socket.emit as (event: string, ...args: unknown[]) => void)(eventName, {
        channelId: this.id,
        ...event.payload,
      });
    }
  }

  nextSeq(): number {
    return ++this._messageSeq;
  }

  sendNotification(payload: NotificationPayload): Promise<NotificationResponse> {
    const socket = this.sockets.size > 0 ? this.sockets.values().next().value : undefined;
    if (!socket) return Promise.resolve({});
    const requestId = crypto.randomUUID();
    return new Promise<NotificationResponse>((resolve) => {
      this.notificationRequests.set(requestId, resolve);
      socket.emit('notification:show', {
        channelId: this.id,
        message: payload.message,
        severity: z.enum(['error', 'warning', 'info']).catch('info').parse(payload.severity),
        buttons: payload.buttons?.map((b) => b.label),
      });
    });
  }

  resolveControlResponse(event: ControlResponseEvent): void {
    const pending = this.pendingRequests.get(event.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingRequests.delete(event.requestId);

    pending.resolve({
      success: event.success,
      response: event.response,
      error: event.error,
    });
  }

  sendControlRequest(subtype: string, params?: Record<string, unknown>): Promise<ControlResponse> {
    const requestId = crypto.randomUUID();
    return new Promise<ControlResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Control request '${subtype}' timed out`));
      }, this.controlTimeout);

      this.pendingRequests.set(requestId, { resolve, reject, timer });
      this.runner.sendControlRequest(subtype, params, requestId);
    });
  }

  private _runnerListeners: {
    socketEvent: (event: SocketEvent) => void;
    controlResponse: (event: ControlResponseEvent) => void;
    serverAction: (action: ServerAction) => void;
    exit: (code: number | null) => void;
  } | null = null;

  wireRunner(hooks: WireRunnerHooks = {}): void {
    if (this._runnerListeners) return; // already wired

    const onSocketEvent = (se: SocketEvent) => {
      // Track last error for exit rejection messages
      if (se.name === 'error:message') {
        const { message } = errorPayload.parse(se.payload);
        this.lastError = message;
      }

      // Update internal state based on event name
      if (se.name === 'session:init') {
        const init = sessionInitPayload.parse(se.payload);
        if (init.sessionId) {
          this.sessionId = init.sessionId;
          this._resolveSessionId?.();
          this._resolveSessionId = null;
        }
        this.updateSessionState(sessionInitConfigSchema.parse(init.config ?? {}));
        this.updateMetaCache({
          ...(init.model ? { model: init.model } : {}),
          ...(init.permissionMode ? { permissionMode: init.permissionMode } : {}),
          ...(init.tools ? { tools: init.tools } : {}),
          ...(init.fastModeState !== undefined ? { fastModeState: init.fastModeState } : {}),
          ...(init.mcpServers ? { mcpServers: init.mcpServers } : {}),
          ...(init.slashCommands ? { slashCommands: init.slashCommands } : {}),
        });
      } else if (se.name === 'session:status') {
        const status = sessionStatusPayload.parse(se.payload);
        if (status.permissionMode !== undefined) {
          this.updateSessionState({ permissionMode: status.permissionMode });
        }
      }

      // Broadcast directly — except session:init which is emitted explicitly
      // by launch/join handlers with the final merged metaCache
      if (se.name !== 'session:init') {
        this.emit(se.name, { channelId: this.id, ...se.payload });
      }

      // Invoke hook for ChatHandler-owned logic
      hooks.onSocketEvent?.(this, se);
    };

    const onControlResponse = (event: ControlResponseEvent) => {
      this.resolveControlResponse(event);
    };

    const onServerAction = (action: ServerAction) => {
      hooks.onServerAction?.(this, action);
    };

    const onExit = (code: number | null) => {
      this.exited = true;

      // Reject all pending control requests — process is gone
      for (const [id, pending] of this.pendingRequests) {
        clearTimeout(pending.timer);
        pending.reject(new Error(this.lastError ?? `Process exited with code ${code}`));
        this.pendingRequests.delete(id);
      }

      // Delegate cleanup to hook — ChatHandler owns business logic
      // (custom rejection messages, broadcastSessionState, session:closed emit)
      hooks.onExit?.(this, code);
    };

    this._runnerListeners = {
      socketEvent: onSocketEvent,
      controlResponse: onControlResponse,
      serverAction: onServerAction,
      exit: onExit,
    };

    this.runner.on('socket_event', onSocketEvent);
    this.runner.on('control_response', onControlResponse);
    this.runner.on('server_action', onServerAction);
    this.runner.on('exit', onExit);
  }

  unwireRunner(): void {
    if (!this._runnerListeners) return;
    const l = this._runnerListeners;
    this.runner.removeListener('socket_event', l.socketEvent);
    this.runner.removeListener('control_response', l.controlResponse);
    this.runner.removeListener('server_action', l.serverAction);
    this.runner.removeListener('exit', l.exit);
    this._runnerListeners = null;
  }

  destroy(): void {
    this.unwireRunner();
    this._controlRequestMeta.clear();
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Channel destroyed'));
    }
    this.pendingRequests.clear();
    for (const resolve of this.notificationRequests.values()) {
      resolve({});
    }
    this.notificationRequests.clear();
    for (const timer of this.mcpTimeouts.values()) clearTimeout(timer);
    this.mcpTimeouts.clear();
    this.resetSessionState();
    this.planComments = [];
    this.sockets.clear();
    this.exited = true;
  }
}
