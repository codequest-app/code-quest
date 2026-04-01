import type {
  AuthStatus,
  ClientToServerEvents,
  NotificationPayload,
  NotificationResponse,
  ServerToClientEvents,
  SocketEvent,
} from '@code-quest/shared';
import type { ProcessRunner } from '@code-quest/summoner';
import { inject, injectable, optional } from 'inversify';
import type { Server } from 'socket.io';
import { logger } from '../logger.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import { InMemorySettingsStore, type SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { RunnerFactory } from '../types.ts';
import { TYPES } from '../types.ts';
import type { Channel, WireRunnerHooks } from './channel.ts';
import type { ChannelManager } from './channel-manager.ts';
import { register as registerAuthHandlers } from './claude/auth.ts';
import { register as registerClaudeMcpServers } from './claude/mcp-servers.ts';
import { register as registerPluginHandlers } from './claude/plugin.ts';
import type { HandlerContext } from './context.ts';
import { register as registerConnectionHandlers } from './handlers/connection.ts';
import {
  onRunnerEvent as controlOnRunnerEvent,
  onServerAction as controlOnServerAction,
} from './handlers/control.ts';
import {
  onRunnerEvent as fileOnRunnerEvent,
  onServerAction as fileOnServerAction,
  register as registerFileHandlers,
} from './handlers/file.ts';
import { register as registerGitHandlers } from './handlers/git.ts';
import {
  onRunnerEvent as mcpOnRunnerEvent,
  register as registerMcpHandlers,
} from './handlers/mcp.ts';
import {
  onRunnerEvent as messageOnRunnerEvent,
  register as registerMessageHandlers,
} from './handlers/message.ts';
import { register as registerPlanHandlers } from './handlers/plan.ts';
import { register as registerSessionHandlers } from './handlers/session/index.ts';
import {
  onExit as sessionOnExit,
  onRunnerEvent as sessionOnRunnerEvent,
} from './handlers/session/lifecycle.ts';
import {
  register as registerSettingsHandlers,
  onServerAction as settingsOnServerAction,
} from './handlers/settings.ts';
import { register as registerSpeechHandlers } from './handlers/speech.ts';
import { register as registerTerminalHandlers } from './handlers/terminal.ts';
import { onRunnerEvent as usageOnRunnerEvent } from './handlers/usage.ts';
import {
  pickDefined,
  type SessionBroadcastState,
  type TypedServer,
  type TypedSocket,
} from './types.ts';

@injectable()
export class SocketServer implements HandlerContext {
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

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
    io.on('connection', (socket) => this.handleConnection(socket));
  }

  resolveSessionId(channelId: string): Promise<string> {
    return this.channelManager.resolveSessionId(channelId);
  }

  /** Retrieve parsed history events — delegates to ChannelManager. */
  async getSessionHistory(channelId: string): Promise<SocketEvent[]> {
    return this.channelManager.getSessionHistory(channelId);
  }

  /** Get pending control events and responded IDs for replay — delegates to ChannelManager. */
  getPendingReplayEvents(sessionId: string) {
    return this.channelManager.getPendingReplayEvents(sessionId);
  }

  requireRunner(_socket: TypedSocket, channelId: string): ProcessRunner | null {
    const runner = this.channelManager.get(channelId)?.runner ?? null;
    if (!runner) {
      logger.warn({ channelId }, 'Runner not found');
      return null;
    }
    return runner;
  }

  broadcastSessionState(channelId: string, state: SessionBroadcastState, title?: string): void {
    const cache = this.channelManager.get(channelId)?.sessionState ?? {};

    this.io?.emit('session:states', {
      sessions: [
        {
          channelId,
          state,
          ...pickDefined({
            title,
            modelSetting: cache.model,
            permissionMode: cache.permissionMode,
            effort: cache.effort,
          }),
        },
      ],
    });

    const settings = pickDefined({
      modelSetting: cache.model,
      defaultCwd: cache.cwd,
      initialPermissionMode: cache.permissionMode,
      thinkingLevel: cache.thinkingLevel,
      mcpServers: cache.mcpServers,
      tools: cache.tools,
      effort: cache.effort,
    });
    if (Object.keys(settings).length > 0) {
      this.io?.emit('settings:update', { channelId, ...settings });
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

  buildChannelHooks(channelId: string): WireRunnerHooks {
    return {
      onSocketEvent: (ch, se) => {
        messageOnRunnerEvent(this, channelId, ch, se) ||
          sessionOnRunnerEvent(this, channelId, ch, se) ||
          fileOnRunnerEvent(this, channelId, ch, se) ||
          mcpOnRunnerEvent(this, channelId, ch, se) ||
          usageOnRunnerEvent(this, channelId, ch, se) ||
          controlOnRunnerEvent(this, channelId, ch, se);
      },

      onServerAction: (ch, action) => {
        fileOnServerAction(this, channelId, ch, action) ||
          settingsOnServerAction(this, channelId, ch, action) ||
          controlOnServerAction(this, channelId, ch, action);
      },

      onExit: (ch, code) => {
        sessionOnExit(this, channelId, ch, code);
      },
    };
  }

  private handleConnection(socket: TypedSocket): void {
    registerConnectionHandlers(socket, this);
    registerAuthHandlers(socket, this);
    registerSessionHandlers(socket, this);
    registerMessageHandlers(socket, this);
    registerSettingsHandlers(socket, this);
    registerMcpHandlers(socket, this);
    registerClaudeMcpServers(socket, this);
    registerFileHandlers(socket, this);
    registerTerminalHandlers(socket, this);
    registerGitHandlers(socket, this);
    registerPluginHandlers(socket, this);
    registerPlanHandlers(socket, this);
    registerSpeechHandlers(socket, this);
  }
}
