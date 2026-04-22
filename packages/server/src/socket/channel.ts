import type {
  ChannelMetaCache,
  ClientMessage,
  ControlResponse,
  SessionConfig,
  WorktreeInfo,
} from '@code-quest/shared';
import {
  errorMessageEventSchema,
  sessionInitConfigSchema,
  sessionInitEventSchema,
  sessionStatusEventSchema,
} from '@code-quest/shared';
import type { ProcessRunner, ResolvedControlResponse } from '@code-quest/summoner';
import { detectWorktree } from '@code-quest/summoner';
import type { z } from 'zod';
import { logger } from '../logger.ts';
import { ControlRequestTracker, DEFAULT_CONTROL_TIMEOUT } from './control-request-tracker.ts';
import type { RequestMeta } from './schemas.ts';
import { pickDefined } from './utils/helpers.ts';

/** Callbacks invoked by Channel when runner events occur. */
export interface ChannelHooks {
  onClientMessage?: (channel: Channel, event: ClientMessage) => void;
  onExit?: (channel: Channel, code: number | null) => void;
}

/** Stored listener references for unbindRunner cleanup. */
interface RunnerListenerRefs {
  clientMessage: (message: ClientMessage) => void;
  controlResponse: (response: ResolvedControlResponse) => void;
  exit: (code: number | null) => void;
}

export class Channel {
  // ── Identity ──
  readonly channelId: string;
  readonly runner: ProcessRunner;
  readonly provider: string;
  readonly controlTimeout: number;

  // ── State ──
  private _sessionConfig: SessionConfig = {};
  private _metaCache: ChannelMetaCache = {};
  sessionId: string | null = null;
  cwd: string;
  /** Main repo path (git common-dir parent). Shared across worktrees of the
   *  same repo. Populated once per Channel from gitService.getProjectRoot. */
  projectRoot: string | null = null;
  private _worktree: WorktreeInfo | null = null;
  lastError: string | undefined;
  exited = false;

  // ── UI / Metadata (not CLI config) ──
  titleGenerated = false;
  pendingTitlePrompt: string | undefined;
  title: string | undefined;
  parentId: string | undefined;

  // ── Processing ──
  private _isProcessing = false;

  // ── Control requests ──
  private readonly controlRequests: ControlRequestTracker;
  private readonly mcpTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // ── Meta ──
  terminalLines: string[] = [];

  get worktree(): WorktreeInfo | null {
    return this._worktree;
  }
  set worktree(v: WorktreeInfo | null) {
    this._worktree = v;
    if (v) this.cwd = v.path;
  }

  constructor(
    runner: ProcessRunner,
    channelId: string,
    provider: string,
    cwd: string,
    controlTimeout = DEFAULT_CONTROL_TIMEOUT,
  ) {
    this.channelId = channelId;
    this.runner = runner;
    this.provider = provider;
    this.cwd = cwd;
    this.controlTimeout = controlTimeout;
    this.controlRequests = new ControlRequestTracker(controlTimeout);
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

  /**
   * Build the `settings:update` payload derived from sessionConfig, cwd, and worktree.
   * Returns undefined when no non-empty fields are present (so callers can skip emit).
   * `title` isn't stored on Channel; pass through if the caller has one.
   */
  toSettingsUpdatePayload(): Record<string, unknown> | undefined {
    const ss = this._sessionConfig;
    const settings = pickDefined({
      modelSetting: ss.model,
      defaultCwd: this.cwd,
      worktree: this._worktree ?? undefined,
      initialPermissionMode: ss.permissionMode,
      thinkingLevel: ss.thinkingLevel,
      mcpServers: ss.mcpServers,
      tools: ss.tools,
      effort: ss.effort,
    });
    return Object.keys(settings).length > 0 ? settings : undefined;
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
    this.controlRequests.trackInbound(requestId, meta);
  }

  removeControlRequest(requestId: string): void {
    this.controlRequests.removeInbound(requestId);
  }

  hasControlRequest(requestId: string): boolean {
    return this.controlRequests.hasInbound(requestId);
  }

  getControlRequestMeta(requestId: string): RequestMeta | undefined {
    return this.controlRequests.getInboundMeta(requestId);
  }

  setMcpTimeout(requestId: string, timer: ReturnType<typeof setTimeout>): void {
    this.mcpTimeouts.set(requestId, timer);
  }

  clearMcpTimeout(requestId: string): void {
    const t = this.mcpTimeouts.get(requestId);
    if (t) clearTimeout(t);
    this.mcpTimeouts.delete(requestId);
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

  sendRequest(event: string, payload: Record<string, unknown> = {}): Promise<ControlResponse> {
    const { subtype, input } = this.runner.formatRequest(event, payload);
    return this.controlRequests.sendOutbound(
      (s, p, id) => this.runner.sendControlRequest(s, p, id),
      subtype,
      input,
    );
  }

  private safeApply<S extends z.ZodTypeAny>(
    schema: S,
    payload: unknown,
    label: string,
    apply: (data: z.infer<S>) => void,
  ): void {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ err: parsed.error, channelId: this.channelId }, `Malformed ${label}`);
      return;
    }
    apply(parsed.data);
  }

  private applyErrorMessage(payload: unknown): void {
    this.safeApply(errorMessageEventSchema, payload, 'error:message', ({ message }) => {
      this.lastError = message;
    });
  }

  private applySessionInit(payload: unknown): void {
    this.safeApply(sessionInitEventSchema, payload, 'session:init', (init) => {
      if (init.sessionId) this.sessionId = init.sessionId;
      this.safeApply(
        sessionInitConfigSchema,
        init.config ?? {},
        'session:init config',
        ({ cwd: initCwd, ...initConfig }) => {
          if (initCwd) {
            this.cwd = initCwd;
            const wt = detectWorktree(initCwd);
            if (wt) this.worktree = wt;
          }
          this.updateSessionConfig(initConfig);
        },
      );
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
    });
  }

  private applySessionStatus(payload: unknown): void {
    this.safeApply(sessionStatusEventSchema, payload, 'session:status', ({ permissionMode }) => {
      if (permissionMode !== undefined) this.updateSessionConfig({ permissionMode });
    });
  }

  /** Update channel internal state from runner messages. */
  private handleInternalMessage(clientMessage: ClientMessage): void {
    switch (clientMessage.name) {
      case 'error:message':
        this.applyErrorMessage(clientMessage.payload);
        break;
      case 'session:init':
        this.applySessionInit(clientMessage.payload);
        break;
      case 'session:status':
        this.applySessionStatus(clientMessage.payload);
        break;
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
      this.controlRequests.resolveOutbound(response);
    };

    const onExit = (code: number | null) => {
      this.exited = true;
      this.controlRequests.rejectAllPending(this.lastError ?? `Process exited with code ${code}`);

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
    this.controlRequests.clear();
    for (const timer of this.mcpTimeouts.values()) clearTimeout(timer);
    this.mcpTimeouts.clear();
    this.resetSessionConfig();
    this.exited = true;
  }
}
