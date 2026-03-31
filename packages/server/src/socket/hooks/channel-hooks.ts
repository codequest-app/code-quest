import { readFile } from 'node:fs/promises';
import {
  controlGenerateTitleResponseSchema,
  diffReviewPayloadSchema,
  fileUpdatedPayloadSchema,
  mcpPayloadSchema,
  permissionPayloadSchema,
  rateLimitPayloadSchema,
  requestIdPayloadSchema,
  resultPayloadSchema,
  serverActionModelSchema,
  serverActionModeSchema,
} from '@code-quest/shared';
import type { WireRunnerHooks } from '../channel.ts';
import type { HandlerContext } from '../handler-context.ts';

/** Timeout for MCP JSON-RPC message relay (ms). */
const MCP_MESSAGE_TIMEOUT = 10_000;

function jsonRpcError(id: unknown, message: string): Record<string, unknown> {
  return { jsonrpc: '2.0', error: { code: -32603, message }, id: id ?? null };
}

/**
 * Build WireRunnerHooks with ChatHandler-specific business logic.
 * Extracted from ChatHandler so it can be tested and composed independently.
 */
export function buildChannelHooks(ctx: HandlerContext, channelId: string): WireRunnerHooks {
  const readFileOrEmpty = (path: string) => readFile(path, 'utf-8').catch(() => '');

  return {
    onSocketEvent: (ch, se) => {
      const p = se.payload;
      switch (se.name) {
        case 'session:init': {
          ctx.broadcastSessionState(channelId, 'busy');
          // session:init is emitted explicitly by launch/join handlers
          break;
        }
        case 'message:result': {
          resultPayloadSchema.parse(p);
          ch.endProcessing();
          ctx.broadcastSessionState(channelId, 'idle');

          // Generate title after first message completes (CLI is idle now)
          const pendingPrompt = ch.sessionState.pendingTitlePrompt as string | undefined;
          if (pendingPrompt) {
            ch.updateSessionState({ pendingTitlePrompt: undefined });
            ch.sendControlRequest('generate_session_title', { description: pendingPrompt })
              .then((res) => {
                const parsed = controlGenerateTitleResponseSchema.safeParse(res.response);
                if (parsed.success) {
                  ctx.sessionStore
                    .rename(channelId, parsed.data.title)
                    .catch((e) => console.warn('Failed to persist session title:', e));
                  ctx.broadcastSessionState(channelId, 'idle', parsed.data.title);
                }
              })
              .catch((e) => console.warn('Failed to generate session title:', e));
          }
          break;
        }
        case 'system:rate_limit': {
          const { info } = rateLimitPayloadSchema.parse(p);
          ctx.usageTracker.update(info);
          break;
        }
        case 'system:file_updated': {
          const { filePath, oldContent, newContent } = fileUpdatedPayloadSchema.parse(p);
          ctx.emitToSession(channelId, 'file:updated', {
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
          ctx.emitToSession(channelId, 'chat:cancel_request', {
            channelId,
            targetRequestId: requestId,
          });
          break;
        }
        case 'control:permission': {
          const perm = permissionPayloadSchema.parse(p);
          ch.trackControlRequest(perm.requestId, {
            subtype: 'can_use_tool',
            toolName: perm.toolName,
            toolUseId: perm.toolUseId,
          });
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
          const mcp = mcpPayloadSchema.parse(p);
          const hasClient = ch.sockets.size > 0;
          const mcpId = mcp.message?.id;
          if (!hasClient) {
            ch.runner.respondToControlRequest(mcp.requestId, jsonRpcError(mcpId, 'no client'));
            break;
          }
          const mcpTimeout = setTimeout(() => {
            ch.removeControlRequest(mcp.requestId);
            ch.runner.respondToControlRequest(mcp.requestId, jsonRpcError(mcpId, 'timeout'));
          }, MCP_MESSAGE_TIMEOUT);
          ch.trackControlRequest(mcp.requestId, { subtype: 'mcp_message' });
          ch.mcpTimeouts.set(mcp.requestId, mcpTimeout);
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
              void ctx.settingsStore
                .getMany(ch.provider, ['model', 'permissionMode'])
                .then((stored) => {
                  const settings = {
                    ...stored,
                    ...(state.model !== undefined ? { model: state.model } : {}),
                    ...(state.permissionMode !== undefined
                      ? { permissionMode: state.permissionMode }
                      : {}),
                  };
                  ch.runner.respondToControlRequest(action.requestId, settings);
                })
                .catch(() => {
                  // Fallback: respond with sessionState only
                  ch.runner.respondToControlRequest(action.requestId, {
                    ...(state.model !== undefined ? { model: state.model } : {}),
                    ...(state.permissionMode !== undefined
                      ? { permissionMode: state.permissionMode }
                      : {}),
                  });
                });
              break;
            }
            case 'set_model': {
              const { model } = serverActionModelSchema.parse(action.input ?? {});
              ch.updateSessionState({ model });
              ch.runner.respondToControlRequest(action.requestId, { subtype: 'success' });
              ctx.broadcastSessionState(channelId, 'busy');
              break;
            }
            case 'set_permission_mode': {
              const { mode } = serverActionModeSchema.parse(action.input ?? {});
              ch.updateSessionState({ permissionMode: mode });
              ch.runner.respondToControlRequest(action.requestId, { subtype: 'success' });
              ctx.broadcastSessionState(channelId, 'busy');
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
            ctx.emitToSession(channelId, 'control:diff_review', {
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
          ctx.emitToSession(channelId, 'raw:event', {
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
      ctx.broadcastSessionState(channelId, 'exited');
      ch.resetSessionState();
      ctx.emitToSession(channelId, 'session:closed', {
        channelId,
        ...(ch.lastError ? { error: ch.lastError } : {}),
      });
    },
  };
}
