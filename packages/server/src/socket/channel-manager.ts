import type { ControlResponse } from '@code-quest/shared';
import type { LaunchOptions, ProviderAdapter } from '@code-quest/summoner';
import type { RunnerFactory } from '../types.ts';
import { Channel, type ChannelHooks } from './channel.ts';
import type { ChannelEmitter } from './channel-emitter.ts';
import type { RawRecorder } from './raw-recorder.ts';
import type { SessionBroadcastState } from './schemas.ts';
import type { TypedServer, TypedSocket } from './types.ts';
import { pickDefined } from './utils/helpers.ts';

interface CreateChannelOptions {
  launchOptions?: LaunchOptions;
  initOptions?: Record<string, unknown>;
  /** Called after wiring but before spawn — use to add sockets so they receive init events. */
  onBeforeSpawn?: (channel: Channel) => void;
}

export class ChannelManager {
  private channels = new Map<string, Channel>();
  private socketChannelsMap = new Map<string, Set<string>>();
  private hooks: ChannelHooks;
  private io?: TypedServer;
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
  ) {
    this.hooks = {
      onSocketEvent: (ch, se) => emitter.dispatchEvent(ch.id, ch, se),
      onServerAction: (ch, action) => emitter.dispatchAction(ch.id, ch, action),
      onExit: (ch, code) => emitter.dispatchExit(ch.id, ch, code),
      emitToChannel: (channelId, event, ...args) => emitter.emit(channelId, event, ...args),
    };
  }

  /** Re-wire a channel if it was unwired (e.g. after all sockets disconnected). */
  ensureWired(channel: Channel): void {
    if (!channel.isWired) {
      channel.wireRunner(this.hooks);
    }
  }

  register(io: TypedServer): void {
    this.io = io;
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

  /** Find channel that owns a pending control/notification request. Returns [channelId, channel]. */
  findByRequestId(requestId: string): [string, Channel] | undefined {
    for (const [id, ch] of this.channels) {
      if (ch.hasControlRequest(requestId) || ch.hasNotificationRequest(requestId)) {
        return [id, ch];
      }
    }
    return undefined;
  }

  /** Get all channel IDs (including exited). */
  getAllChannelIds(): string[] {
    return [...this.channels.keys()];
  }

  async create(
    channelId: string,
    opts?: CreateChannelOptions,
  ): Promise<{ channel: Channel; initResult: ControlResponse }> {
    const runner = this.runnerFactory.create(opts?.launchOptions);
    const channel = new Channel(runner, channelId, this.provider);
    this.channels.set(channelId, channel);

    channel.wireRunner(this.hooks);

    // Record raw I/O
    this.rawRecorder.wire(channel);

    opts?.onBeforeSpawn?.(channel);

    runner.spawn();

    // Initialize and wait for control_response
    const initResult = await channel.sendControlRequest('initialize', opts?.initOptions ?? {});

    return { channel, initResult };
  }

  async join(channelId: string): Promise<{ channel: Channel }> {
    let channel = this.channels.get(channelId);

    if (channel && !channel.exited) {
      return { channel };
    }

    // Lazy resume from DB — resolve sessionId via sessionHistory
    const sessionId = await this.resolveSessionId(channelId);
    if (sessionId === channelId) {
      throw new Error(`Session not found: ${channelId}`);
    }

    const runner = this.runnerFactory.create({ resumeSessionId: sessionId });
    channel = new Channel(runner, channelId, this.provider);
    this.channels.set(channelId, channel);
    channel.wireRunner(this.hooks);
    this.rawRecorder.wire(channel);
    runner.spawn();
    await channel.sendControlRequest('initialize', {});

    return { channel };
  }

  destroy(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    try {
      channel.kill();
    } catch {}
    channel.destroy();
    this.channels.delete(channelId);
  }

  getFirstAlive(): Channel | undefined {
    for (const [, ch] of this.channels) {
      if (!ch.exited) return ch;
    }
    return undefined;
  }

  getAliveChannels(): Array<[string, Channel]> {
    const result: Array<[string, Channel]> = [];
    for (const [id, ch] of this.channels) {
      if (!ch.exited) result.push([id, ch]);
    }
    return result;
  }

  // ── Socket tracking ──

  addSocketToChannel(channel: Channel, socket: TypedSocket): void {
    this.emitter.addSocketToChannel(channel.id, socket);
    let channelIds = this.socketChannelsMap.get(socket.id);
    if (!channelIds) {
      channelIds = new Set();
      this.socketChannelsMap.set(socket.id, channelIds);
    }
    channelIds.add(channel.id);
  }

  removeSocketFromAll(socketId: string): void {
    const channelIds = this.socketChannelsMap.get(socketId);
    if (!channelIds) return;

    this.emitter.removeSocketFromAll(socketId);

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel) continue;

      if (this.emitter.getSocketCount(channelId) === 0) {
        channel.unwireRunner();
      }
    }

    this.socketChannelsMap.delete(socketId);
  }

  // ── Broadcasting ──

  broadcastSettingsUpdate(channelId: string, settings: Record<string, unknown>): void {
    this.io?.emit('settings:update', { channelId, ...settings });
  }

  broadcastSessionCreated(channelId: string): void {
    this.io?.emit('session:created', { channelId });
  }

  broadcastSessionDead(channelId: string): void {
    this.io?.emit('session:dead', { channelId });
  }

  broadcastSessionResume(channelId: string): void {
    this.io?.emit('session:resume', { channelId });
  }

  broadcastModels(models: unknown[]): void {
    this.io?.emit('app:models', { channelId: '', models });
  }

  /** Broadcast session state + settings to all connected clients.
   *  Key mapping (e.g. model → modelSetting) matches shared SessionStateSummary / UpdateStatePayload schemas. */
  broadcastSessionState(channelId: string, state: SessionBroadcastState, title?: string): void {
    const ss = this.channels.get(channelId)?.sessionState ?? {};

    this.io?.emit('session:states', {
      sessions: [
        {
          channelId,
          state,
          ...pickDefined({
            title,
            modelSetting: ss.model,
            permissionMode: ss.permissionMode,
            effort: ss.effort,
          }),
        },
      ],
    });

    const settings = pickDefined({
      modelSetting: ss.model,
      defaultCwd: ss.cwd,
      initialPermissionMode: ss.permissionMode,
      thinkingLevel: ss.thinkingLevel,
      mcpServers: ss.mcpServers,
      tools: ss.tools,
      effort: ss.effort,
    });
    if (Object.keys(settings).length > 0) {
      this.io?.emit('settings:update', { channelId, ...settings });
    }
  }
}
