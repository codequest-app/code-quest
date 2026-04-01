import type { AuthStatus, ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { inject, injectable, optional } from 'inversify';
import type { Server } from 'socket.io';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import { InMemorySettingsStore, type SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import { TYPES } from '../types.ts';
import type { ChannelEventRouter } from './channel-event-router.ts';
import type { ChannelManager } from './channel-manager.ts';
import * as claudeAuth from './claude/auth.ts';
import * as claudeMcpServers from './claude/mcp-servers.ts';
import * as claudePlugin from './claude/plugin.ts';
import type { HandlerContext } from './context.ts';
import * as app from './handlers/app.ts';
import * as file from './handlers/file.ts';
import * as git from './handlers/git.ts';
import * as mcp from './handlers/mcp.ts';
import * as message from './handlers/message.ts';
import * as permission from './handlers/permission.ts';
import * as plan from './handlers/plan.ts';
import * as session from './handlers/session/index.ts';
import * as settings from './handlers/settings.ts';
import * as speech from './handlers/speech.ts';
import * as terminal from './handlers/terminal.ts';
import * as usage from './handlers/usage.ts';
import type { SessionHistory } from './session-history.ts';
import type { SocketHandler, TypedServer, TypedSocket } from './types.ts';

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
    @inject(TYPES.ChannelEventRouter) private router: ChannelEventRouter,
    @inject(TYPES.SettingsStore) @optional() settingsStore?: SettingsStore,
  ) {
    this.settingsStore = settingsStore ?? new InMemorySettingsStore();
  }

  private handlers: SocketHandler[] = [];

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
    this.channelManager.register(io);

    this.handlers = [
      speech.create(this),
      usage.create(this),
      plan.create(this),
      git.create(this),
      terminal.create(this),
      file.create(this),
      mcp.create(this),
      settings.create(this),
      message.create(this),
      permission.create(this),
      app.create(this),
      session.create(this),
      claudeAuth.create(this),
      claudeMcpServers.create(this),
      claudePlugin.create(this),
    ];

    for (const h of this.handlers) h.subscribe?.(this.router);

    io.on('connection', (socket) => {
      for (const h of this.handlers) h.register(socket);
    });
  }
}
