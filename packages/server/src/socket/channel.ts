import { resolve } from 'node:path';
import type {
  ChannelMetaCache,
  ClientMessage,
  ControlResponse,
  NotificationResponse,
} from '@code-quest/shared';
import type { ProcessRunner, ResolvedControlResponse } from '@code-quest/summoner';
import {
  errorMessageEventSchema,
  type RequestMeta,
  type SessionConfig,
  sessionInitConfigSchema,
  sessionInitEventSchema,
  sessionStatusEventSchema,
} from './schemas.ts';
import { pickDefined } from './utils/helpers.ts';

/** Callbacks invoked by Channel when runner events occur. */
export interface ChannelHooks {
  onClientMessage?: (channel: Channel, event: ClientMessage) => void;
  onExit?: (channel: Channel, code: number | null) => void;
}

interface PendingRequest {
  resolve: (value: ControlResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Stored listener references for unbindRunner cleanup. */
interface RunnerListenerRefs {
  clientMessage: (message: ClientMessage) => void;
  controlResponse: (response: ResolvedControlResponse) => void;
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
  private _sessionConfig: SessionConfig = {};
  private _metaCache: ChannelMetaCache = {};
  private _sessionId: string | null = null;
  private _workspaceFolder: string | undefined;
  private _worktree: { name: string; path: string } | null = null;
  private _lastError: string | undefined;
  private _exited = false;

  // ── UI / Metadata (not CLI config) ──
  private _titleGenerated = false;
  private _pendingTitlePrompt: string | undefined;
  private _title: string | undefined;
  private _parentId: string | undefined;

  // ── Processing ──
  private _isProcessing = false;

  // ── Control requests ──
  private readonly _controlRequestMeta = new Map<string, RequestMeta>();
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private readonly notificationRequests = new Map<
    string,
    (response: NotificationResponse) => void
  >();
  private readonly mcpTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // ── Meta ──
  private _terminalLines: string[] = [];

  get sessionId(): string | null {
    return this._sessionId;
  }
  set sessionId(v: string | null) {
    this._sessionId = v;
  }

  get workspaceFolder(): string {
    return this._workspaceFolder ?? process.cwd();
  }
  set workspaceFolder(v: string | undefined) {
    this._workspaceFolder = v ? resolve(v) : undefined;
  }

  get worktree(): { name: string; path: string } | null {
    return this._worktree;
  }
  set worktree(v: { name: string; path: string } | null) {
    this._worktree = v;
    if (v) this.workspaceFolder = v.path;
  }

  get lastError(): string | undefined {
    return this._lastError;
  }
  set lastError(v: string | undefined) {
    this._lastError = v;
  }

  get exited(): boolean {
    return this._exited;
  }
  set exited(v: boolean) {
    this._exited = v;
  }

  get titleGenerated(): boolean {
    return this._titleGenerated;
  }
  set titleGenerated(v: boolean) {
    this._titleGenerated = v;
  }

  get pendingTitlePrompt(): string | undefined {
    return this._pendingTitlePrompt;
  }
  set pendingTitlePrompt(v: string | undefined) {
    this._pendingTitlePrompt = v;
  }

  get title(): string | undefined {
    return this._title;
  }
  set title(v: string | undefined) {
    this._title = v;
  }

  get parentId(): string | undefined {
    return this._parentId;
  }
  set parentId(v: string | undefined) {
    this._parentId = v;
  }

  get terminalLines(): string[] {
    return this._terminalLines;
  }
  set terminalLines(v: string[]) {
    this._terminalLines = v;
  }

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

  get sessionConfig(): SessionConfig {
    return this._sessionConfig;
  }

  get metaCache(): ChannelMetaCache {
    return this._metaCache;
  }

  updateSessionConfig(partial: Partial<SessionConfig>): void {
    this._sessionConfig = { ...this._sessionConfig, ...partial };
  }

  resetSessionConfig(): void {
    this._sessionConfig = {};
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

  resolveControlResponse(response: ResolvedControlResponse): void {
    const pending = this.pendingRequests.get(response.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingRequests.delete(response.requestId);

    pending.resolve({
      success: response.success,
      response: response.response,
      error: response.error,
    });
  }

  sendRequest(event: string, payload: Record<string, unknown> = {}): Promise<ControlResponse> {
    const { subtype, input } = this.runner.formatRequest(event, payload);
    return this.sendControlRequest(subtype, input);
  }

  private sendControlRequest(
    subtype: string,
    params?: Record<string, unknown>,
  ): Promise<ControlResponse> {
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

  /** Update channel internal state from runner messages. */
  private handleInternalMessage(clientMessage: ClientMessage): void {
    if (clientMessage.name === 'error:message') {
      const { message } = errorMessageEventSchema.parse(clientMessage.payload);
      this.lastError = message;
    } else if (clientMessage.name === 'session:init') {
      const init = sessionInitEventSchema.parse(clientMessage.payload);
      if (init.sessionId) {
        this.sessionId = init.sessionId;
      }
      const { cwd: initCwd, ...initConfig } = sessionInitConfigSchema.parse(init.config ?? {});
      if (initCwd) {
        this.workspaceFolder = initCwd;
      }
      this.updateSessionConfig(initConfig);
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
    } else if (clientMessage.name === 'session:status') {
      const status = sessionStatusEventSchema.parse(clientMessage.payload);
      if (status.permissionMode !== undefined) {
        this.updateSessionConfig({ permissionMode: status.permissionMode });
      }
    }
  }

  private _runnerListeners: RunnerListenerRefs | null = null;

  bindRunner(hooks: ChannelHooks = {}): void {
    if (this._runnerListeners) return; // already wired

    const onClientMessage = (message: ClientMessage) => {
      this.handleInternalMessage(message);
      hooks.onClientMessage?.(this, message);
    };

    const onControlResponse = (response: ResolvedControlResponse) => {
      this.resolveControlResponse(response);
    };

    const onExit = (code: number | null) => {
      this.exited = true;

      // Reject all pending control requests — process is gone
      for (const [id, pending] of this.pendingRequests) {
        clearTimeout(pending.timer);
        pending.reject(new Error(this.lastError ?? `Process exited with code ${code}`));
        this.pendingRequests.delete(id);
      }

      // Delegate cleanup to hook (broadcastSessionConfig, session:closed emit)
      hooks.onExit?.(this, code);
    };

    this._runnerListeners = {
      clientMessage: onClientMessage,
      controlResponse: onControlResponse,
      exit: onExit,
    };

    this.runner.on('client_message', onClientMessage);
    this.runner.on('control_response', onControlResponse);
    this.runner.on('exit', onExit);
  }

  unbindRunner(): void {
    if (!this._runnerListeners) return;
    const l = this._runnerListeners;
    this.runner.removeListener('client_message', l.clientMessage);
    this.runner.removeListener('control_response', l.controlResponse);
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
    this.resetSessionConfig();
    this.exited = true;
  }
}
