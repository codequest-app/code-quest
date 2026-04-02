import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import { inject, injectable, optional } from 'inversify';
import type { Server } from 'socket.io';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import { InMemorySettingsStore, type SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import { TYPES } from '../types.ts';
import type { ChannelEmitter } from './channel-emitter.ts';
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
    @inject(TYPES.ChannelEventRouter) private emitter: ChannelEmitter,
    @inject(TYPES.SettingsStore) @optional() settingsStore?: SettingsStore,
  ) {
    this.settingsStore = settingsStore ?? new InMemorySettingsStore();
  }

  private handlers: SocketHandler[] = [];

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    const cm = this.channelManager;
    cm.register(io);

    const em = this.emitter;
    const planHandler = plan.create(em);

    // Handlers that only use emitter.on (no register needed)
    usage.create(this.usageTracker, em);
    permission.create(em);

    const commonHandlers: SocketHandler[] = [
      speech.create(cm),
      git.create(this.sessionHistory, this.rawEventStore),
      terminal.create(cm),
      file.create(cm, em),
      mcp.create(cm, em),
      settings.create(cm, this.settingsStore, this.usageTracker, em),
      message.create(cm, this.sessionStore, planHandler, em),
      app.create(cm, this.settingsStore),
      sessionConnect.create(cm, this.settingsStore, this.sessionStore, this.sessionHistory, em),
      sessionCommand.create(cm, this.sessionStore),
      sessionFork.create(cm, this.sessionHistory),
      sessionQuery.create(cm, this.sessionStore, this.sessionHistory),
    ];

    const providerHandlers: SocketHandler[] =
      cm.provider === 'claude'
        ? [claudeAuth.create(cm), claudeMcpServers.create(cm), claudePlugin.create()]
        : [];

    this.handlers = [...commonHandlers, ...providerHandlers];

    io.on('connection', (socket) => {
      em.handleConnection(socket, (id) => cm.get(id));
      for (const h of this.handlers) h.register(socket);
    });
  }
}
