import type {
  ChannelMetaCache,
  ControlResponse,
  NotificationPayload,
  NotificationResponse,
  PlanCommentData,
  ServerToClientEvents,
  SessionInitPayload,
} from '@code-quest/shared';
import type {
  ControlResponseEvent,
  ProcessRunner,
  ServerAction,
  SocketEvent,
} from '@code-quest/summoner';
import type { TypedSocket } from './handler-context.ts';

/** Default timeout for control requests (ms). */
const DEFAULT_CONTROL_TIMEOUT = 30_000;

/**
 * Maps adapter SocketEvent names to our socket protocol names.
 * Adapter names that differ from our protocol are remapped here.
 */
export type ChannelState = 'launching' | 'active' | 'streaming' | 'cancelling' | 'closed';

const VALID_TRANSITIONS: Record<ChannelState, ChannelState[]> = {
  launching: ['active', 'closed'],
  active: ['streaming', 'closed'],
  streaming: ['active', 'cancelling', 'closed'],
  cancelling: ['active', 'closed'],
  closed: [],
};

export interface PendingRequest {
  resolve: (value: ControlResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface RequestMeta {
  subtype: string;
  toolName?: string;
  toolUseId?: string;
}

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
  private _sessionState: Record<string, unknown> = {};
  private _metaCache: ChannelMetaCache = {};
  planComments: PlanCommentData[] = [];
  terminalLines: string[] = [];
  sessionId: string | null = null;

  get sessionState(): Record<string, unknown> {
    return this._sessionState;
  }

  get metaCache(): ChannelMetaCache {
    return this._metaCache;
  }

  updateSessionState(partial: Record<string, unknown>): void {
    this._sessionState = { ...this._sessionState, ...partial };
  }

  resetSessionState(): void {
    this._sessionState = {};
  }

  updateMetaCache(partial: Partial<ChannelMetaCache>): void {
    this._metaCache = { ...this._metaCache, ...partial };
  }
  lastError: string | undefined;
  exited = false;
  private _state: ChannelState = 'launching';
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
  }

  get isWired(): boolean {
    return this._runnerListeners !== null;
  }

  get state(): ChannelState {
    return this._state;
  }

  transition(next: ChannelState): void {
    const allowed = VALID_TRANSITIONS[this._state];
    if (!allowed.includes(next)) {
      throw new Error(`Invalid Channel state transition: ${this._state} → ${next}`);
    }
    this._state = next;
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
      config: this.sessionState ?? {},
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
      if (event.name === 'control:permission') {
        pendingRequests.push({ requestId: event.payload.requestId as string, event });
      } else if (event.name === 'control:elicitation') {
        pendingRequests.push({ requestId: event.payload.requestId as string, event });
      } else if (event.name === 'control:cancel') {
        respondedRequestIds.add(event.payload.requestId as string);
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
        severity: (payload.severity ?? 'info') as 'error' | 'warning' | 'info',
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
        this.lastError = se.payload.message as string;
      }

      // Update internal state based on event name
      if (se.name === 'session:init') {
        this.sessionId = se.payload.sessionId as string;
        this._sessionState = (se.payload.config ?? {}) as Record<string, unknown>;
        this.updateMetaCache({
          ...(se.payload.model ? { model: se.payload.model as string } : {}),
          ...(se.payload.permissionMode
            ? { permissionMode: se.payload.permissionMode as string }
            : {}),
          ...(se.payload.tools ? { tools: se.payload.tools as string[] } : {}),
          ...(se.payload.fastModeState !== undefined
            ? { fastModeState: se.payload.fastModeState }
            : {}),
          ...(se.payload.mcpServers
            ? { mcpServers: se.payload.mcpServers as Array<{ name: string; status: string }> }
            : {}),
          ...(se.payload.slashCommands
            ? { slashCommands: se.payload.slashCommands as string[] }
            : {}),
        });
      } else if (se.name === 'session:status') {
        if (se.payload.permissionMode !== undefined) {
          this.updateSessionState({ permissionMode: se.payload.permissionMode });
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

      // Transition to closed
      if (this._state !== 'closed') {
        this._state = 'closed';
      }

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
    if (this._state !== 'closed') {
      this._state = 'closed';
    }
  }
}
