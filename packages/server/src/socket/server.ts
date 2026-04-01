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
import * as session from './handlers/session/index.ts';
import * as settings from './handlers/settings.ts';
import * as speech from './handlers/speech.ts';
import * as terminal from './handlers/terminal.ts';
import * as usage from './handlers/usage.ts';
import type { SessionHistory } from './session-history.ts';
import type { SocketHandler, TypedServer } from './types.ts';

@injectable()
export class SocketServer {
  io?: TypedServer;
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
    this.io = io;
    this.channelManager.register(io);

    const cm = this.channelManager;
    const ss = this.sessionStore;
    const sh = this.sessionHistory;
    const st = this.settingsStore;
    const ut = this.usageTracker;
    const re = this.rawEventStore;

    const commonHandlers: SocketHandler[] = [
      speech.create(cm),
      usage.create(ut),
      plan.create(cm),
      git.create(cm, sh, re),
      terminal.create(cm),
      file.create(cm),
      mcp.create(cm),
      settings.create(cm, st, ut),
      message.create(cm, ss),
      permission.create(),
      app.create(cm, st),
      session.create(cm, ss, st, sh),
    ];

    const providerHandlers: SocketHandler[] =
      cm.provider === 'claude'
        ? [claudeAuth.create(cm), claudeMcpServers.create(cm), claudePlugin.create()]
        : [];

    this.handlers = [...commonHandlers, ...providerHandlers];

    for (const h of this.handlers) h.subscribe?.(this.router);

    io.on('connection', (socket) => {
      for (const h of this.handlers) h.register(socket);
    });
  }
}
