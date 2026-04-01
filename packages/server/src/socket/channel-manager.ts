import type { ControlResponse } from '@code-quest/shared';
import type { LaunchOptions, ProviderAdapter } from '@code-quest/summoner';
import type { RunnerFactory } from '../types.ts';
import { Channel, type WireRunnerHooks } from './channel.ts';
import type { ChannelEventRouter } from './channel-event-router.ts';
import type { RawRecorder } from './raw-recorder.ts';
import type { ChannelSummary } from './schemas.ts';
import {
  pickDefined,
  type SessionBroadcastState,
  type TypedServer,
  type TypedSocket,
} from './types.ts';

export type { ChannelSummary } from './schemas.ts';

export interface CreateChannelOptions {
  launchOptions?: LaunchOptions;
  initOptions?: Record<string, unknown>;
  /** Called after wiring but before spawn — use to add sockets so they receive init events. */
  onBeforeSpawn?: (channel: Channel) => void;
}

export class ChannelManager {
  private channels = new Map<string, Channel>();
  private socketChannelsMap = new Map<string, Set<string>>();
  private hooks: WireRunnerHooks;
  io?: TypedServer;
  cachedModels: unknown[] | undefined;

  constructor(
    private runnerFactory: RunnerFactory,
    private adapter: ProviderAdapter,
    private rawRecorder: RawRecorder,
    router: ChannelEventRouter,
    private resolveSessionId: (channelId: string) => Promise<string>,
  ) {
    this.hooks = {
      onSocketEvent: (ch, se) => router.dispatchEvent(ch.id, ch, se),
      onServerAction: (ch, action) => router.dispatchAction(ch.id, ch, action),
      onExit: (ch, code) => router.dispatchExit(ch.id, ch, code),
    };
  }

  get channelHooks(): WireRunnerHooks {
    return this.hooks;
  }

  register(io: TypedServer): void {
    this.io = io;
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
      if (ch.hasControlRequest(requestId) || ch.notificationRequests.has(requestId)) {
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

    // Ensure session:init has been processed (sessionId needed for persist)
    await channel.sessionIdReady;

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

  getAliveChannels(): ChannelSummary[] {
    const result: ChannelSummary[] = [];
    for (const [id, ch] of this.channels) {
      if (ch.exited) continue;
      result.push({
        channelId: id,
        state: ch.isProcessing ? 'busy' : 'idle',
        title: ch.sessionState?.title,
        model: ch.sessionState?.model,
      });
    }
    return result;
  }

  // ── Socket tracking ──

  addSocketToChannel(channel: Channel, socket: TypedSocket): void {
    channel.addSocket(socket);
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

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel) continue;

      channel.removeSocketById(socketId);

      if (channel.sockets.size === 0) {
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
