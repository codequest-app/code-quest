import type { AuthStatus, ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { inject, injectable, optional } from 'inversify';
import type { Server } from 'socket.io';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import { InMemorySettingsStore, type SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import { TYPES } from '../types.ts';
import type { WireRunnerHooks } from './channel.ts';
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
import type { SessionHistory } from './session-history.ts';
import type { TypedServer, TypedSocket } from './types.ts';

@injectable()
export class SocketServer implements HandlerContext {
  io?: TypedServer;
  settingsStore: SettingsStore;
  authState: AuthStatus = { authenticated: false };
  cachedModels: unknown[] | undefined;

  constructor(
    @inject(TYPES.RawEventStore) public rawEventStore: RawEventStore,
    @inject(TYPES.SessionStore) public sessionStore: SessionStore,
    @inject(TYPES.UsageTracker) public usageTracker: UsageTracker,
    @inject(TYPES.ChannelManager) public channelManager: ChannelManager,
    @inject(TYPES.SessionHistory) public sessionHistory: SessionHistory,
    @inject(TYPES.SettingsStore) @optional() settingsStore?: SettingsStore,
  ) {
    this.settingsStore = settingsStore ?? new InMemorySettingsStore();
  }

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
    this.channelManager.register(io);
    io.on('connection', (socket) => this.handleConnection(socket));
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
