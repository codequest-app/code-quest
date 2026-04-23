import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { FilesystemService, GitService } from '@code-quest/summoner';
import { inject, injectable } from 'inversify';
import type { Server } from 'socket.io';
import type { ProjectAutoUpserter } from '../services/project-auto-upserter.ts';
import type { ProjectStore } from '../services/project-store.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import { type HandlerContext, TYPES } from '../types.ts';
import type { ChannelEmitter } from './channel-emitter.ts';
import type { ChannelManager } from './channel-manager.ts';

import * as claudeAuth from './claude/auth.ts';
import * as claudeMcpServers from './claude/mcp-servers.ts';
import * as claudePlugin from './claude/plugin.ts';
import * as app from './handlers/app.ts';
import * as autoRespond from './handlers/auto-respond.ts';
import * as explorer from './handlers/explorer.ts';
import * as file from './handlers/file.ts';
import * as git from './handlers/git.ts';
import * as mcp from './handlers/mcp.ts';
import * as message from './handlers/message.ts';
import * as permission from './handlers/permission.ts';
import * as plan from './handlers/plan.ts';
import * as projects from './handlers/projects.ts';
import * as sessionCommand from './handlers/session/command.ts';
import * as sessionConnect from './handlers/session/connect.ts';
import * as sessionFork from './handlers/session/fork.ts';
import * as sessionQuery from './handlers/session/query.ts';
import * as settings from './handlers/settings.ts';
import * as speech from './handlers/speech.ts';
import * as terminal from './handlers/terminal.ts';
import * as usage from './handlers/usage.ts';
import * as worktree from './handlers/worktree.ts';
import type { SessionHistory } from './session-history.ts';

@injectable()
export class SocketServer {
  constructor(
    @inject(TYPES.RawEventService) private rawEventService: RawEventService,
    @inject(TYPES.SessionStore) private sessionStore: SessionStore,
    @inject(TYPES.ProjectStore) private projectStore: ProjectStore,
    @inject(TYPES.ProjectAutoUpserter) private projectAutoUpserter: ProjectAutoUpserter,
    @inject(TYPES.UsageTracker) private usageTracker: UsageTracker,
    @inject(TYPES.ChannelManager) private channelManager: ChannelManager,
    @inject(TYPES.SessionHistory) private sessionHistory: SessionHistory,
    @inject(TYPES.ChannelEventRouter) private emitter: ChannelEmitter,
    @inject(TYPES.FilesystemService) private filesystemService: FilesystemService,
    @inject(TYPES.GitService) private gitService: GitService,
    @inject(TYPES.SettingsStore) private settingsStore: SettingsStore,
  ) {}

  register(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    const cm = this.channelManager;
    cm.register(io);

    const em = this.emitter;
    const planHandler = plan.create({ emitter: em });

    const ctx: HandlerContext = {
      emitter: em,
      channelManager: cm,
      sessionStore: this.sessionStore,
      projectStore: this.projectStore,
      projectAutoUpserter: this.projectAutoUpserter,
      settingsStore: this.settingsStore,
      usageTracker: this.usageTracker,
      sessionHistory: this.sessionHistory,
      rawEventService: this.rawEventService,
      filesystemService: this.filesystemService,
      gitService: this.gitService,
      planHandler,
    };

    // Handlers that only use emitter.on (no register needed)
    usage.create(ctx);
    autoRespond.create(ctx);
    permission.create(ctx);
    speech.create(ctx);
    worktree.create(ctx);
    terminal.create(ctx);
    mcp.create(ctx);
    file.create(ctx);
    explorer.create(ctx);
    projects.create(ctx);

    settings.create(ctx);
    git.create(ctx);

    message.create(ctx);

    app.create(ctx);
    sessionConnect.create(ctx);
    sessionCommand.create(ctx);
    sessionFork.create(ctx);
    sessionQuery.create(ctx);

    if (cm.provider === 'claude') {
      claudeAuth.create(ctx);
      claudeMcpServers.create(ctx);
      claudePlugin.create(ctx);
    }

    io.on('connection', (socket) => {
      em.handleConnection(socket, (id) => cm.get(id));
    });
  }
}
