import type {
  ChannelMetaCache,
  ControlResponse,
  NotificationPayload,
  NotificationResponse,
  PlanCommentData,
  SessionInitPayload,
  SocketEvent,
} from '@code-quest/shared';
import type { ControlResponseEvent, ProcessRunner, ServerAction } from '@code-quest/summoner';
import { z } from 'zod';
import {
  errorMessageEventSchema,
  type RequestMeta,
  type SessionState,
  sessionInitConfigSchema,
  sessionInitEventSchema,
  sessionStatusEventSchema,
} from './schemas.ts';
import {
  type PendingRequest,
  pickDefined,
  type RunnerListeners,
  type TypedSocket,
  type WireRunnerHooks,
} from './types.ts';

export type { WireRunnerHooks } from './types.ts';

/** Default timeout for control requests (ms). */
const DEFAULT_CONTROL_TIMEOUT = 30_000;

export class Channel {
  // ── Identity ──
  readonly id: string;
  readonly runner: ProcessRunner;
  readonly provider: string;
  readonly controlTimeout: number;

  // ── State ──
  private _sessionState: SessionState = {};
  private _metaCache: ChannelMetaCache = {};
  sessionId: string | null = null;
  private _resolveSessionId: (() => void) | null = null;
  readonly sessionIdReady: Promise<void>;
  lastError: string | undefined;
  exited = false;

  // ── Processing ──
  private _isProcessing = false;
  private _messageSeq = 0;

  // ── Sockets ──
  readonly sockets = new Set<TypedSocket>();

  // ── Control requests ──
  private readonly _controlRequestMeta = new Map<string, RequestMeta>();
  readonly pendingRequests = new Map<string, PendingRequest>();
  readonly notificationRequests = new Map<string, (response: NotificationResponse) => void>();
  readonly mcpTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // ── Meta ──
  planComments: PlanCommentData[] = [];
  terminalLines: string[] = [];

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

  // ── State accessors ──

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

  // ── Processing ──

  get isProcessing(): boolean {
    return this._isProcessing;
  }

  startProcessing(): void {
    this._isProcessing = true;
  }

  endProcessing(): void {
    this._isProcessing = false;
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

  removeSocketById(socketId: string): boolean {
    for (const sock of this.sockets) {
      if (sock.id === socketId) {
        this.sockets.delete(sock);
        return true;
      }
    }
    return false;
  }

  // ── Control request tracking ──

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
      ...pickDefined({
        model: meta.model,
        tools: meta.tools,
        permissionMode: meta.permissionMode,
        fastModeState: meta.fastModeState,
        mcpServers: meta.mcpServers,
        slashCommands: meta.slashCommands,
      }),
      config: { ...this.sessionState },
    };
  }

  nextSeq(): number {
    return ++this._messageSeq;
  }

  // ── Runner wrappers ──

  sendMessage(text: string): void {
    this.runner.sendMessage(text);
  }

  respondToRequest(requestId: string, response: Record<string, unknown>): void {
    this.runner.respondToControlRequest(requestId, response);
  }

  abort(): void {
    this.runner.abort();
  }

  write(data: string): void {
    this.runner.write(data);
  }

  kill(): void {
    this.runner.kill();
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

  /** Update channel internal state from runner events. */
  private handleInternalEvent(se: SocketEvent): void {
    if (se.name === 'error:message') {
      const { message } = errorMessageEventSchema.parse(se.payload);
      this.lastError = message;
    } else if (se.name === 'session:init') {
      const init = sessionInitEventSchema.parse(se.payload);
      if (init.sessionId) {
        this.sessionId = init.sessionId;
        this._resolveSessionId?.();
        this._resolveSessionId = null;
      }
      this.updateSessionState(sessionInitConfigSchema.parse(init.config ?? {}));
      this.updateMetaCache(
        pickDefined({
          model: init.model,
          tools: init.tools,
          permissionMode: init.permissionMode,
          fastModeState: init.fastModeState,
          mcpServers: init.mcpServers,
          slashCommands: init.slashCommands,
        }),
      );
    } else if (se.name === 'session:status') {
      const status = sessionStatusEventSchema.parse(se.payload);
      if (status.permissionMode !== undefined) {
        this.updateSessionState({ permissionMode: status.permissionMode });
      }
    }
  }

  private _runnerListeners: RunnerListeners | null = null;

  wireRunner(hooks: WireRunnerHooks = {}): void {
    if (this._runnerListeners) return; // already wired

    const onSocketEvent = (se: SocketEvent) => {
      this.handleInternalEvent(se);

      // Broadcast directly — except session:init which is emitted explicitly
      // by launch/join handlers with the final merged metaCache
      if (se.name !== 'session:init') {
        this.emit(se.name, { channelId: this.id, ...se.payload });
      }

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

      // Delegate cleanup to hook — SocketServer owns business logic
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
