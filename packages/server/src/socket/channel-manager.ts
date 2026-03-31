import type { ControlResponse } from '@code-quest/shared';
import type {
  LaunchOptions,
  ProtocolEvent,
  ProviderAdapter,
  SocketEvent,
} from '@code-quest/summoner';
import { logger } from '../logger.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { RunnerFactory } from '../types.ts';
import { Channel, type WireRunnerHooks } from './channel.ts';

export interface ChannelSummary {
  channelId: string;
  state: 'busy' | 'idle' | 'exited';
  title?: string;
  model?: string;
}

export interface JoinResult {
  channel: Channel;
  events: SocketEvent[];
}

/** History-relevant socket event names — excludes streaming, control, and transient types. */
const HISTORY_NAMES = new Set([
  'message:assistant',
  'message:user',
  'message:result',
  'session:init',
]);

export class ChannelManager {
  private channels = new Map<string, Channel>();

  constructor(
    private runnerFactory: RunnerFactory,
    private rawEventStore: RawEventStore,
    private sessionStore: SessionStore,
    private adapter: ProviderAdapter,
  ) {}

  get provider(): string {
    return this.adapter.command;
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
    opts?: {
      hooks?: WireRunnerHooks;
      launchOptions?: LaunchOptions;
      initOptions?: Record<string, unknown>;
      /** Called after wiring but before spawn — use to add sockets so they receive init events. */
      onBeforeSpawn?: (channel: Channel) => void;
    },
  ): Promise<{ channel: Channel; initResult: ControlResponse }> {
    const runner = this.runnerFactory.create(opts?.launchOptions);
    const channel = new Channel(runner, channelId, this.provider);
    this.channels.set(channelId, channel);

    channel.wireRunner(opts?.hooks);

    // Record raw I/O
    this.wireRawPersistence(channel);

    opts?.onBeforeSpawn?.(channel);

    runner.spawn();

    // Initialize and wait for control_response
    const initResult = await channel.sendControlRequest('initialize', opts?.initOptions ?? {});

    // Ensure session:init event has been processed (may arrive after control_response)
    if (!channel.sessionId) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          runner.off('socket_event', onEvent);
          reject(new Error('Timed out waiting for session:init'));
        }, 30_000);
        const onEvent = (se: { name: string }) => {
          if (se.name === 'session:init') {
            clearTimeout(timeout);
            runner.off('socket_event', onEvent);
            resolve();
          }
        };
        runner.on('socket_event', onEvent);
      });
    }

    return { channel, initResult };
  }

  async join(channelId: string, opts?: { hooks?: WireRunnerHooks }): Promise<JoinResult> {
    let channel = this.channels.get(channelId);

    if (channel && !channel.exited) {
      const events = await this.getSessionHistory(channelId);
      return { channel, events };
    }

    // Lazy resume from DB
    const record = await this.sessionStore.getById(channelId);
    if (!record?.sessionId) {
      throw new Error(`Session not found: ${channelId}`);
    }

    const runner = this.runnerFactory.create({ resumeSessionId: record.sessionId });
    channel = new Channel(runner, channelId, this.provider);
    this.channels.set(channelId, channel);
    channel.wireRunner(opts?.hooks);
    this.wireRawPersistence(channel);
    runner.spawn();
    await channel.sendControlRequest('initialize', {});

    const events = await this.getSessionHistory(channelId);
    return { channel, events };
  }

  destroy(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    try {
      channel.runner.kill();
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

  // ── Private helpers ──

  async resolveSessionId(channelId: string): Promise<string> {
    const channel = this.channels.get(channelId);
    if (channel?.sessionId) return channel.sessionId;
    const record = await this.sessionStore.getById(channelId);
    return record?.sessionId ?? channelId;
  }

  async getSessionHistory(channelId: string): Promise<SocketEvent[]> {
    const sessionId = await this.resolveSessionId(channelId);
    const all = await this.convertRawToSocketEvents(sessionId);
    return all.filter((e) => HISTORY_NAMES.has(e.name));
  }

  private async convertRawToSocketEvents(sessionId: string): Promise<SocketEvent[]> {
    const rawEntries = await this.rawEventStore.getBySession(sessionId);
    const result: SocketEvent[] = [];

    // Check if stdout contains any user message echoes
    const hasStdoutUserEcho = rawEntries.some((e) => {
      if (e.direction !== 'out') return false;
      try {
        const obj = JSON.parse(e.raw.trim());
        return obj?.type === 'user';
      } catch {
        return false;
      }
    });

    for (const entry of rawEntries) {
      const trimmed = entry.raw.trim();
      if (!trimmed) continue;

      try {
        const obj = JSON.parse(trimmed) as Record<string, unknown>;
        if (typeof obj !== 'object' || obj === null) continue;

        if (entry.direction === 'out' && 'type' in obj) {
          const converted = this.adapter.transform(obj as ProtocolEvent).events;
          result.push(...converted);
        } else if (entry.direction === 'in' && obj.type === 'user') {
          // Skip stdin user messages when stdout already echoes them (avoids duplicates)
          if (hasStdoutUserEcho) continue;
          const msg = obj.message as { content?: unknown[] } | undefined;
          if (msg?.content) {
            result.push({
              name: 'message:user',
              payload: { content: msg.content },
            });
          }
        }
      } catch {}
    }

    return result;
  }

  async getPendingReplayEvents(sessionId: string): Promise<{
    events: SocketEvent[];
    respondedRequestIds: Set<string>;
  }> {
    const rawEntries = await this.rawEventStore.getBySession(sessionId);
    const respondedRequestIds = this.adapter.extractRespondedRequestIds(rawEntries);
    const events = await this.convertRawToSocketEvents(sessionId);
    return { events, respondedRequestIds };
  }

  private wireRawPersistence(channel: Channel): void {
    const { runner } = channel;
    let seqCounter = 0;
    const pendingRawEntries: Array<{
      raw: string;
      direction: 'in' | 'out' | 'err';
      timestamp: number;
      seq: number;
    }> = [];

    const flushPending = (sessionId: string) => {
      for (const pending of pendingRawEntries) {
        this.rawEventStore
          .append({ ...pending, sessionId, promptId: '' })
          .catch((err) => logger.error({ err }, 'Failed to persist buffered raw event'));
      }
      pendingRawEntries.length = 0;
    };

    const recordRaw = (raw: string, direction: 'in' | 'out' | 'err') => {
      const sessionId = channel.sessionId;
      if (!sessionId) {
        pendingRawEntries.push({ raw, direction, timestamp: Date.now(), seq: seqCounter++ });
        return;
      }
      if (pendingRawEntries.length > 0) flushPending(sessionId);
      this.rawEventStore
        .append({
          timestamp: Date.now(),
          sessionId,
          promptId: '',
          raw,
          direction,
          seq: seqCounter++,
        })
        .catch((err) => logger.error({ err }, 'Failed to persist raw event'));
    };

    runner.on('stdout', (line: string) => recordRaw(line, 'out'));
    runner.on('stdin', (raw: string) => recordRaw(raw, 'in'));
    runner.on('stderr', (line: string) => {
      recordRaw(line, 'err');
      channel.lastError = line;
    });
  }
}
