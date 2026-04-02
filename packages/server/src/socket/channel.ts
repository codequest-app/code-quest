import type {
  ChannelMetaCache,
  ControlResponse,
  NotificationPayload,
  NotificationResponse,
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
import type { TypedSocket } from './types.ts';
import { pickDefined } from './utils/helpers.ts';

/** Callbacks invoked by Channel when runner events occur. */
export interface ChannelHooks {
  onSocketEvent?: (channel: Channel, event: SocketEvent) => void;
  onServerAction?: (channel: Channel, action: ServerAction) => void;
  onExit?: (channel: Channel, code: number | null) => void;
}

interface PendingRequest {
  resolve: (value: ControlResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Stored listener references for unbindRunner cleanup. */
interface RunnerListenerRefs {
  socketEvent: (event: SocketEvent) => void;
  controlResponse: (event: ControlResponseEvent) => void;
  serverAction: (action: ServerAction) => void;
  exit: (code: number | null) => void;
}

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
  lastError: string | undefined;
  exited = false;

  // ── Processing ──
  private _isProcessing = false;

  /** @deprecated Socket tracking moved to ChannelEmitter. Will be removed along with socket methods. */
  readonly sockets = new Set<TypedSocket>();

  // ── Control requests ──
  private readonly _controlRequestMeta = new Map<string, RequestMeta>();
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private readonly notificationRequests = new Map<
    string,
    (response: NotificationResponse) => void
  >();
  private readonly mcpTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // ── Meta ──
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

  get isBound(): boolean {
    return this._runnerListeners !== null;
  }

  /** @deprecated Socket tracking moved to ChannelEmitter. Will be removed. */
  addSocket(_socket: TypedSocket): void {}
  /** @deprecated Socket tracking moved to ChannelEmitter. Will be removed. */
  removeSocket(_socket: TypedSocket): void {}
  /** @deprecated Socket tracking moved to ChannelEmitter. Will be removed. */
  removeSocketById(_socketId: string): boolean { return false; }

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

  hasNotificationRequest(requestId: string): boolean {
    return this.notificationRequests.has(requestId);
  }

  setMcpTimeout(requestId: string, timer: ReturnType<typeof setTimeout>): void {
    this.mcpTimeouts.set(requestId, timer);
  }

  clearMcpTimeout(requestId: string): void {
    const t = this.mcpTimeouts.get(requestId);
    if (t) clearTimeout(t);
    this.mcpTimeouts.delete(requestId);
  }

  resolveNotificationRequest(requestId: string, response: NotificationResponse): boolean {
    const resolve = this.notificationRequests.get(requestId);
    if (!resolve) return false;
    this.notificationRequests.delete(requestId);
    resolve(response);
    return true;
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

  private _runnerListeners: RunnerListenerRefs | null = null;

  bindRunner(hooks: ChannelHooks = {}): void {
    if (this._runnerListeners) return; // already wired

    const onSocketEvent = (se: SocketEvent) => {
      this.handleInternalEvent(se);
      // Broadcasting is now handled by ChannelEmitter.dispatchEvent()
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

      // Delegate cleanup to hook (broadcastSessionState, session:closed emit)
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

  unbindRunner(): void {
    if (!this._runnerListeners) return;
    const l = this._runnerListeners;
    this.runner.removeListener('socket_event', l.socketEvent);
    this.runner.removeListener('control_response', l.controlResponse);
    this.runner.removeListener('server_action', l.serverAction);
    this.runner.removeListener('exit', l.exit);
    this._runnerListeners = null;
  }

  destroy(): void {
    this.unbindRunner();
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
    this.sockets.clear();
    this.exited = true;
  }
}
