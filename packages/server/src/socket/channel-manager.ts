import { resolve } from 'node:path';
import type { ControlResponse, SessionBroadcastState, WorktreeInfo } from '@code-quest/shared';
import { EVENTS } from '@code-quest/shared';
import type { LaunchOptions, ProviderAdapter } from '@code-quest/summoner';
import { logger } from '../logger.ts';
import type { RunnerFactory } from '../types.ts';
import { Channel, type ChannelHooks } from './channel.ts';
import type { ChannelEmitter } from './channel-emitter.ts';
import type { RawRecorder } from './raw-recorder.ts';
import type { TypedServer, TypedSocket } from './types.ts';
import { pickDefined } from './utils/helpers.ts';

interface CreateChannelOptions {
  launchOptions?: LaunchOptions;
  initOptions?: Record<string, unknown>;
  cwd: string;
  worktree?: WorktreeInfo;
  /** Called after wiring but before spawn — use to add sockets so they receive init events. */
  onBeforeSpawn?: (channel: Channel) => void;
}

export class ChannelManager {
  private channels = new Map<string, Channel>();
  private hooks: ChannelHooks;
  private _cachedModels: unknown[] | undefined;

  get cachedModels(): unknown[] | undefined {
    return this._cachedModels;
  }

  set cachedModels(models: unknown[] | undefined) {
    this._cachedModels = models;
  }

  constructor(
    private runnerFactory: RunnerFactory,
    private adapter: ProviderAdapter,
    private rawRecorder: RawRecorder,
    private emitter: ChannelEmitter,
    private resolveSessionId: (channelId: string) => Promise<string>,
    private resolveCwd: (channelId: string) => Promise<string>,
  ) {
    this.hooks = {
      onClientMessage: (ch, message) =>
        emitter.dispatchRunnerMessage(ch, message.name, message.payload),
      onExit: (ch, code) => emitter.dispatch('channel:exit', ch, { code }),
    };
  }

  /** Re-wire a channel if it was unwired (e.g. after all sockets disconnected). */
  ensureBound(channel: Channel): void {
    if (!channel.isBound) {
      channel.bindRunner(this.hooks);
    }
  }

  register(io: TypedServer): void {
    this.emitter.register(io);
  }

  get provider(): string {
    return this.adapter.command;
  }

  get runnerCommand(): string {
    return this.runnerFactory.command;
  }

  get runnerArgs(): string[] {
    return this.runnerFactory.args;
  }

  get providerClientConfig() {
    return this.adapter.clientConfig;
  }

  get(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  /** Find channel that owns a pending control request. Returns [channelId, channel]. */
  findByRequestId(requestId: string): [string, Channel] | undefined {
    for (const [id, ch] of this.channels) {
      if (ch.hasControlRequest(requestId)) {
        return [id, ch];
      }
    }
    return undefined;
  }

  private setupChannel(
    channelId: string,
    runner: ReturnType<RunnerFactory['create']>,
    cwd: string,
  ): Channel {
    const channel = new Channel(runner, channelId, this.provider, cwd);
    this.channels.set(channelId, channel);
    channel.bindRunner(this.hooks);
    this.rawRecorder.wire(channel);
    return channel;
  }

  async create(
    channelId: string,
    opts: CreateChannelOptions,
  ): Promise<{ channel: Channel; initResult: ControlResponse }> {
    const rawCwd = opts.worktree?.path ?? opts.cwd;
    const cwd = resolve(rawCwd);
    const runner = this.runnerFactory.create(opts.launchOptions, { cwd });
    const channel = this.setupChannel(channelId, runner, cwd);

    if (opts.worktree) channel.worktree = opts.worktree;

    opts.onBeforeSpawn?.(channel);
    runner.spawn();

    // Initialize and wait for control_response
    const initResult = await channel.sendRequest('session:initialize', opts.initOptions ?? {});

    return { channel, initResult };
  }

  async join(channelId: string): Promise<{ channel: Channel }> {
    const existing = this.channels.get(channelId);
    if (existing && !existing.exited) {
      return { channel: existing };
    }

    // Lazy resume from DB
    const sessionId = await this.resolveSessionId(channelId);
    if (sessionId === channelId) {
      throw new Error(`Session not found: ${channelId}`);
    }

    const cwd = await this.resolveCwd(channelId);

    const runner = this.runnerFactory.create({ resumeSessionId: sessionId }, { cwd });
    const channel = this.setupChannel(channelId, runner, cwd);
    runner.spawn();
    await channel.sendRequest('session:initialize');

    return { channel };
  }

  destroy(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    try {
      channel.kill();
    } catch (err) {
      // kill() may throw if process already exited — safe to ignore
      logger.debug(err, 'kill() failed during channel removal');
    }
    channel.destroy();
    this.channels.delete(channelId);
  }

  getAliveChannels(): Array<[string, Channel]> {
    return [...this.channels].filter(([, ch]) => !ch.exited);
  }

  getFirstAlive(): Channel | undefined {
    return this.getAliveChannels()[0]?.[1];
  }

  /** sessionIds of alive channels that have already received `system:init`.
   *  Callers needing this (e.g. `session:list excludeLive`) shouldn't have
   *  to reach into `Channel[]` and re-filter. */
  getAliveSessionIds(): string[] {
    return this.getAliveChannels().flatMap(([, ch]) => (ch.sessionId ? [ch.sessionId] : []));
  }

  findAliveBySessionId(sessionId: string): Channel | undefined {
    for (const ch of this.channels.values()) {
      if (!ch.exited && ch.sessionId === sessionId) return ch;
    }
    return undefined;
  }

  // ── Socket tracking ──

  addSocketToChannel(channel: Channel, socket: TypedSocket): void {
    this.emitter.addSocketToChannel(channel.channelId, socket);
  }

  removeSocketFromAll(socketId: string): void {
    const channelIds = this.emitter.removeSocketFromAll(socketId);
    if (!channelIds) return;

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel) continue;

      if (this.emitter.getSocketCount(channelId) === 0) {
        channel.unbindRunner();
      }
    }
  }

  /** Broadcast session state + settings to all connected clients.
   *  Key mapping (e.g. model → modelSetting) matches shared SessionConfigSummary / UpdateStatePayload schemas. */
  broadcastSessionState(channelId: string, state: SessionBroadcastState, title?: string): void {
    const ch = this.channels.get(channelId);
    const ss = ch?.sessionConfig ?? {};

    this.emitter.broadcastAll(EVENTS.session.states, {
      sessions: [
        {
          channelId,
          state,
          ...pickDefined({
            cwd: ch?.cwd,
            projectRoot: ch?.projectRoot ?? undefined,
            title,
            modelSetting: ss.model,
            permissionMode: ss.permissionMode,
            effort: ss.effort,
          }),
        },
      ],
    });

    const settings = ch?.toSettingsUpdatePayload();
    if (settings) {
      this.emitter.broadcastAll(EVENTS.settings.update, { channelId, ...settings });
    }
  }
}
