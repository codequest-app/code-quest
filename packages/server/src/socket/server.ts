import { readFile } from 'node:fs/promises';
import {
  type AuthStatus,
  type ClientToServerEvents,
  controlGenerateTitleResponseSchema,
  diffReviewPayloadSchema,
  fileUpdatedPayloadSchema,
  mcpPayloadSchema,
  type NotificationPayload,
  type NotificationResponse,
  permissionPayloadSchema,
  rateLimitPayloadSchema,
  requestIdPayloadSchema,
  type ServerToClientEvents,
  type SocketEvent,
  serverActionModelSchema,
  serverActionModeSchema,
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
import { register as registerFileHandlers } from './handlers/file.ts';
import { register as registerGitHandlers } from './handlers/git.ts';
import { register as registerMcpHandlers } from './handlers/mcp.ts';
import { register as registerMessageHandlers } from './handlers/message.ts';
import { register as registerPlanHandlers } from './handlers/plan.ts';
import { register as registerSessionHandlers } from './handlers/session/index.ts';
import { register as registerSettingsHandlers } from './handlers/settings.ts';
import { register as registerSpeechHandlers } from './handlers/speech.ts';
import { register as registerTerminalHandlers } from './handlers/terminal.ts';
import { jsonRpcError, MCP_MESSAGE_TIMEOUT } from './schemas.ts';
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
    const readFileOrEmpty = (path: string) => readFile(path, 'utf-8').catch(() => '');

    return {
      onSocketEvent: (ch, se) => {
        const p = se.payload;

        if (se.name === 'message:result') {
          ch.endProcessing();
          this.broadcastSessionState(channelId, 'idle');
          const pendingPrompt = ch.sessionState.pendingTitlePrompt;
          if (pendingPrompt) {
            ch.updateSessionState({ pendingTitlePrompt: undefined });
            ch.sendControlRequest('generate_session_title', { description: pendingPrompt })
              .then((res) => {
                const { title } = controlGenerateTitleResponseSchema.parse(res.response);
                this.sessionStore
                  .rename(channelId, title)
                  .catch((e) => logger.warn({ err: e }, 'Failed to persist session title'));
                this.broadcastSessionState(channelId, 'idle', title);
              })
              .catch((e) => logger.error({ err: e }, 'Failed to generate session title'));
          }
          return;
        }

        switch (se.name) {
          case 'session:init':
            this.broadcastSessionState(channelId, 'busy');
            break;
          case 'system:rate_limit': {
            const { info } = rateLimitPayloadSchema.parse(p);
            this.usageTracker.update(info);
            break;
          }
          case 'system:file_updated': {
            const { filePath, oldContent, newContent } = fileUpdatedPayloadSchema.parse(p);
            this.emitToSession(channelId, 'file:updated', {
              channelId,
              filePath,
              oldContent,
              newContent,
            });
            break;
          }
          case 'control:cancel': {
            const { requestId } = requestIdPayloadSchema.parse(p);
            ch.removeControlRequest(requestId);
            this.emitToSession(channelId, 'chat:cancel_request', {
              channelId,
              targetRequestId: requestId,
            });
            break;
          }
          case 'control:permission': {
            const { requestId, toolName, toolUseId } = permissionPayloadSchema.parse(p);
            ch.trackControlRequest(requestId, { subtype: 'can_use_tool', toolName, toolUseId });
            break;
          }
          case 'control:elicitation': {
            const { requestId } = requestIdPayloadSchema.parse(p);
            ch.trackControlRequest(requestId, { subtype: 'elicitation' });
            break;
          }
          case 'control:diff_review': {
            const { toolId } = diffReviewPayloadSchema.parse(p);
            ch.trackControlRequest(toolId, { subtype: 'open_diff' });
            break;
          }
          case 'control:mcp': {
            const { requestId, message: mcpMsg } = mcpPayloadSchema.parse(p);
            const hasClient = ch.sockets.size > 0;
            const mcpId = mcpMsg?.id;
            if (!hasClient) {
              ch.runner.respondToControlRequest(requestId, jsonRpcError(mcpId, 'no client'));
              break;
            }
            const mcpTimeout = setTimeout(() => {
              ch.removeControlRequest(requestId);
              ch.runner.respondToControlRequest(requestId, jsonRpcError(mcpId, 'timeout'));
            }, MCP_MESSAGE_TIMEOUT);
            ch.trackControlRequest(requestId, { subtype: 'mcp_message' });
            ch.mcpTimeouts.set(requestId, mcpTimeout);
            break;
          }
        }
      },

      onServerAction: (ch, action) => {
        switch (action.action) {
          case 'auto_respond': {
            switch (action.subtype) {
              case 'get_settings': {
                const state = ch.sessionState;
                const overrides = pickDefined({
                  model: state.model,
                  permissionMode: state.permissionMode,
                });
                void this.settingsStore
                  .getMany(ch.provider, ['model', 'permissionMode'])
                  .then((stored) => {
                    ch.runner.respondToControlRequest(action.requestId, {
                      ...stored,
                      ...overrides,
                    });
                  })
                  .catch(() => {
                    ch.runner.respondToControlRequest(action.requestId, overrides);
                  });
                break;
              }
              case 'set_model': {
                const { model } = serverActionModelSchema.parse(action.input ?? {});
                ch.updateSessionState({ model });
                ch.runner.respondToControlRequest(action.requestId, { subtype: 'success' });
                this.broadcastSessionState(channelId, 'busy');
                break;
              }
              case 'set_permission_mode': {
                const { mode } = serverActionModeSchema.parse(action.input ?? {});
                ch.updateSessionState({ permissionMode: mode });
                ch.runner.respondToControlRequest(action.requestId, { subtype: 'success' });
                this.broadcastSessionState(channelId, 'busy');
                break;
              }
              default:
                ch.runner.respondToControlRequest(action.requestId, action.response);
                break;
            }
            break;
          }
          case 'read_diff': {
            void Promise.all([
              readFileOrEmpty(action.originalPath),
              readFileOrEmpty(action.newPath),
            ]).then(([oldContent, newContent]) => {
              ch.trackControlRequest(action.requestId, { subtype: 'open_diff' });
              this.emitToSession(channelId, 'control:diff_review', {
                channelId,
                requestId: action.requestId,
                toolId: action.requestId,
                filePath: action.originalPath || action.newPath,
                oldContent,
                newContent,
              });
            });
            break;
          }
          case 'forward_to_client': {
            ch.trackControlRequest(action.requestId, {
              subtype: action.subtype,
              toolName: action.toolName,
              toolUseId: action.toolUseId,
            });
            this.emitToSession(channelId, 'raw:event', {
              channelId,
              rawType: `control_request/${action.subtype}`,
              data: {
                requestId: action.requestId,
                subtype: action.subtype,
                toolName: action.toolName,
                toolUseId: action.toolUseId,
                input: action.input,
                suggestions: action.suggestions,
                callbackId: action.callbackId,
              },
            });
            break;
          }
        }
      },

      onExit: (ch, _code) => {
        this.broadcastSessionState(channelId, 'exited');
        ch.resetSessionState();
        this.emitToSession(channelId, 'session:closed', {
          channelId,
          ...(ch.lastError ? { error: ch.lastError } : {}),
        });
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
