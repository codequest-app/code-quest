import type {
  AuthStatus,
  ClientToServerEvents,
  NotificationPayload,
  NotificationResponse,
  ServerToClientEvents,
} from '@code-quest/shared';
import type { ProcessRunner } from '@code-quest/summoner';
import { inject, injectable, optional } from 'inversify';
import type { Server } from 'socket.io';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import { InMemorySettingsStore, type SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { RunnerFactory } from '../types.ts';
import { TYPES } from '../types.ts';
import type { Channel, WireRunnerHooks } from './channel.ts';
import type { ChannelManager } from './channel-manager.ts';
import type {
  HandlerContext,
  PluginCacheEntry,
  TypedServer,
  TypedSocket,
} from './handler-context.ts';
import { register as registerFileHandlers } from './handlers/file-handler.ts';
import { register as registerGitHandlers } from './handlers/git-handler.ts';
import { register as registerMcpHandlers } from './handlers/mcp-handler.ts';
import { register as registerMessageHandlers } from './handlers/message-handler.ts';
import { register as registerMiscHandlers } from './handlers/misc-handler.ts';
import { register as registerPluginHandlers } from './handlers/plugin-handler.ts';
import { register as registerSessionHandlers } from './handlers/session-handler.ts';
import { register as registerSettingsHandlers } from './handlers/settings-handler.ts';
import { buildChannelHooks } from './hooks/channel-hooks.ts';

@injectable()
export class ChatHandler implements HandlerContext {
  // socket.id → set of channelIds this socket is joined to
  socketChannelsMap = new Map<string, Set<string>>();
  // Socket.IO server reference for broadcasting
  io?: TypedServer;
  settingsStore: SettingsStore;
  // In-memory auth state
  authState: AuthStatus = {
    authenticated: false,
  };
  // Cached models from last initialize response (persists across sessions)
  cachedModels: unknown[] | undefined;
  // Global MCP state
  chromeMcpState: { status: 'disconnected' | 'connecting' | 'connected' } = {
    status: 'disconnected',
  };
  // CWD-keyed plugin listing cache
  pluginCache = new Map<string, PluginCacheEntry>();
  readonly PLUGIN_CACHE_TTL = 30_000;

  constructor(
    @inject(TYPES.RunnerFactory) public runnerFactory: RunnerFactory,
    @inject(TYPES.RawEventStore) public rawEventStore: RawEventStore,
    @inject(TYPES.SessionStore) public sessionStore: SessionStore,
    @inject(TYPES.UsageTracker) public usageTracker: UsageTracker,
    @inject(TYPES.ChannelManager) public channelManager: ChannelManager,
    @inject(TYPES.SettingsStore) @optional() settingsStore?: SettingsStore,
  ) {
    this.settingsStore = settingsStore ?? new InMemorySettingsStore();
  }

  get providerConfig() {
    return this.channelManager.providerClientConfig;
  }

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
    io.on('connection', (socket) => this.handleConnection(socket));
  }

  resolveSessionId(channelId: string): Promise<string> {
    return this.channelManager.resolveSessionId(channelId);
  }

  /** Retrieve parsed history events — delegates to ChannelManager. */
  async getSessionHistory(
    channelId: string,
  ): Promise<import('@code-quest/summoner').SocketEvent[]> {
    return this.channelManager.getSessionHistory(channelId);
  }

  /** Get pending control events and responded IDs for replay — delegates to ChannelManager. */
  getPendingReplayEvents(sessionId: string) {
    return this.channelManager.getPendingReplayEvents(sessionId);
  }

  requireRunner(_socket: TypedSocket, channelId: string): ProcessRunner | null {
    const runner = this.channelManager.get(channelId)?.runner ?? null;
    if (!runner) {
      console.warn(`[requireRunner] Runner not found: ${channelId}`);
      return null;
    }
    return runner;
  }

  broadcastSessionState(
    channelId: string,
    state: 'launching' | 'busy' | 'idle' | 'exited' | 'disconnected',
    title?: string,
  ): void {
    const channel = this.channelManager.get(channelId);
    const cache = channel?.sessionState ?? {};

    this.io?.emit('session:states', {
      sessions: [
        {
          channelId,
          state,
          ...(title !== undefined ? { title } : {}),
          ...(cache.model !== undefined ? { modelSetting: cache.model as string } : {}),
          ...(cache.permissionMode !== undefined
            ? { permissionMode: cache.permissionMode as string }
            : {}),
          ...(cache.effort !== undefined ? { effort: cache.effort as string } : {}),
        },
      ],
    });
    if (cache.model || cache.cwd || cache.permissionMode) {
      this.io?.emit('state:update', {
        channelId,
        ...(cache.model !== undefined ? { modelSetting: cache.model as string } : {}),
        ...(cache.cwd !== undefined ? { defaultCwd: cache.cwd as string } : {}),
        ...(cache.permissionMode !== undefined
          ? { initialPermissionMode: cache.permissionMode as string }
          : {}),
        ...(cache.thinkingLevel !== undefined
          ? { thinkingLevel: cache.thinkingLevel as string }
          : {}),
        ...(cache.mcpServers !== undefined ? { mcpServers: cache.mcpServers as [] } : {}),
        ...(cache.tools !== undefined ? { tools: cache.tools as string[] } : {}),
        ...(cache.effort !== undefined ? { effort: cache.effort as string } : {}),
      });
    }
  }

  /**
   * Send a notification with optional action buttons to the client connected to
   * the given session. Returns the client's response (e.g. which button was clicked).
   */
  sendNotification(channelId: string, payload: NotificationPayload): Promise<NotificationResponse> {
    const channel = this.channelManager.get(channelId);
    if (!channel) return Promise.resolve({});
    return channel.sendNotification(payload);
  }

  emitToSession(channelId: string, ...args: Parameters<TypedSocket['emit']>): void {
    const channel = this.channelManager.get(channelId);
    if (!channel) return;
    channel.emit(args[0] as string, ...(args.slice(1) as unknown[]));
  }

  /** Add socket to channel and track in socketChannelsMap. */
  addSocketToChannel(channel: Channel, socket: TypedSocket): void {
    channel.addSocket(socket);
    let channelIds = this.socketChannelsMap.get(socket.id);
    if (!channelIds) {
      channelIds = new Set();
      this.socketChannelsMap.set(socket.id, channelIds);
    }
    channelIds.add(channel.id);
  }

  /** Build WireRunnerHooks — delegates to extracted module. */
  buildChannelHooks(channelId: string): WireRunnerHooks {
    return buildChannelHooks(this, channelId);
  }

  private handleConnection(socket: TypedSocket): void {
    registerSessionHandlers(socket, this);
    registerMessageHandlers(socket, this);
    registerSettingsHandlers(socket, this);
    registerMcpHandlers(socket, this);
    registerFileHandlers(socket, this);
    registerGitHandlers(socket, this);
    registerPluginHandlers(socket, this);
    registerMiscHandlers(socket, this);
  }
}
