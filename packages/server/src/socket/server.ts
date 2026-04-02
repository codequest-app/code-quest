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
import * as autoRespond from './handlers/auto-respond.ts';
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

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    const cm = this.channelManager;
    cm.register(io);

    const em = this.emitter;
    const planHandler = plan.create(em);

    // Handlers that only use emitter.on (no register needed)
    usage.create(this.usageTracker, em);
    autoRespond.create(em);
    permission.create(em);
    speech.create(em);
    terminal.create(cm, em);
    mcp.create(em);
    file.create(cm, em);

    settings.create(cm, this.settingsStore, this.usageTracker, em);
    git.create(this.sessionHistory, this.rawEventStore, em);

    message.create(cm, this.sessionStore, planHandler, em);

    app.create(cm, this.settingsStore, em);
    sessionConnect.create(cm, this.settingsStore, this.sessionStore, this.sessionHistory, em);
    sessionCommand.create(cm, this.sessionStore, em);
    sessionFork.create(cm, this.sessionHistory, em);
    sessionQuery.create(cm, this.sessionStore, this.sessionHistory, em);

    if (cm.provider === 'claude') {
      claudeAuth.create(cm, em);
      claudeMcpServers.create(cm, em);
      claudePlugin.create(em);
    }

    io.on('connection', (socket) => {
      em.handleConnection(socket, (id) => cm.get(id));
    });
  }
}
