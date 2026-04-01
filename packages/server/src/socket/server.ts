import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
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
import * as app from './handlers/app.ts';
import * as file from './handlers/file.ts';
import * as git from './handlers/git.ts';
import * as mcp from './handlers/mcp.ts';
import * as message from './handlers/message.ts';
import * as permission from './handlers/permission.ts';
import * as plan from './handlers/plan.ts';
import * as sessionCommand from './handlers/session/command.ts';
import * as sessionConnect from './handlers/session/connect.ts';
import * as sessionFork from './handlers/session/fork.ts';
import * as sessionQuery from './handlers/session/query.ts';
import * as settings from './handlers/settings.ts';
import * as speech from './handlers/speech.ts';
import * as terminal from './handlers/terminal.ts';
import * as usage from './handlers/usage.ts';
import type { SessionHistory } from './session-history.ts';
import type { SocketHandler } from './types.ts';

@injectable()
export class SocketServer {
  settingsStore: SettingsStore;

  constructor(
    @inject(TYPES.RawEventStore) private rawEventStore: RawEventStore,
    @inject(TYPES.SessionStore) private sessionStore: SessionStore,
    @inject(TYPES.UsageTracker) private usageTracker: UsageTracker,
    @inject(TYPES.ChannelManager) private channelManager: ChannelManager,
    @inject(TYPES.SessionHistory) private sessionHistory: SessionHistory,
    @inject(TYPES.ChannelEventRouter) private router: ChannelEventRouter,
    @inject(TYPES.SettingsStore) @optional() settingsStore?: SettingsStore,
  ) {
    this.settingsStore = settingsStore ?? new InMemorySettingsStore();
  }

  private handlers: SocketHandler[] = [];

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.channelManager.register(io);

    const {
      channelManager,
      sessionStore,
      sessionHistory,
      settingsStore,
      usageTracker,
      rawEventStore,
    } = this;

    const planHandler = plan.create(channelManager);

    const commonHandlers: SocketHandler[] = [
      speech.create(channelManager),
      usage.create(usageTracker),
      planHandler,
      git.create(channelManager, sessionHistory, rawEventStore),
      terminal.create(channelManager),
      file.create(channelManager),
      mcp.create(channelManager),
      settings.create(channelManager, settingsStore, usageTracker),
      message.create(channelManager, sessionStore, planHandler),
      permission.create(),
      app.create(channelManager, settingsStore),
      sessionConnect.create(channelManager, settingsStore, sessionStore, sessionHistory),
      sessionCommand.create(channelManager, sessionStore),
      sessionFork.create(channelManager, sessionHistory),
      sessionQuery.create(channelManager, sessionStore, sessionHistory),
    ];

    const providerHandlers: SocketHandler[] =
      channelManager.provider === 'claude'
        ? [
            claudeAuth.create(channelManager),
            claudeMcpServers.create(channelManager),
            claudePlugin.create(),
          ]
        : [];

    this.handlers = [...commonHandlers, ...providerHandlers];

    for (const h of this.handlers) h.subscribe?.(this.router);

    io.on('connection', (socket) => {
      for (const h of this.handlers) h.register(socket);
    });
  }
}
