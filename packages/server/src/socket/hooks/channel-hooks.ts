import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { WireRunnerHooks } from '../channel.ts';
import type { HandlerContext } from '../handler-context.ts';

const resultPayload = z.object({ errors: z.array(z.string()).optional() }).passthrough();
const fileUpdatedPayload = z
  .object({
    filePath: z.string(),
    oldContent: z.string().nullable().optional(),
    newContent: z.string().nullable().optional(),
  })
  .passthrough();
const requestIdPayload = z.object({ requestId: z.string() }).passthrough();
const permissionPayload = z
  .object({ requestId: z.string(), toolName: z.string(), toolUseId: z.string() })
  .passthrough();
const diffReviewPayload = z.object({ toolId: z.string() }).passthrough();
const rateLimitPayload = z
  .object({
    info: z
      .object({
        status: z.string(),
        rateLimitType: z.string().optional(),
        resetsAt: z.coerce.number().optional(),
        utilization: z.number().optional(),
        overageStatus: z.string().optional(),
        isUsingOverage: z.boolean().optional(),
      })
      .passthrough(),
  })
  .passthrough();
const serverActionInputModel = z.object({ model: z.string() }).passthrough();
const serverActionInputMode = z.object({ mode: z.string() }).passthrough();
const mcpPayload = z
  .object({
    requestId: z.string(),
    message: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

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
          resultPayload.parse(p);
          ch.endProcessing();
          ctx.broadcastSessionState(channelId, 'idle');
          break;
        }
        case 'system:rate_limit': {
          const { info } = rateLimitPayload.parse(p);
          ctx.usageTracker.update(info);
          break;
        }
        case 'system:file_updated': {
          const file = fileUpdatedPayload.parse(p);
          ctx.emitToSession(channelId, 'file:updated', { channelId, ...file });
          break;
        }
        case 'control:cancel': {
          const { requestId } = requestIdPayload.parse(p);
          ch.removeControlRequest(requestId);
          ctx.emitToSession(channelId, 'chat:cancel_request', {
            channelId,
            targetRequestId: requestId,
          });
          break;
        }
        case 'control:permission': {
          const perm = permissionPayload.parse(p);
          ch.trackControlRequest(perm.requestId, {
            subtype: 'can_use_tool',
            toolName: perm.toolName,
            toolUseId: perm.toolUseId,
          });
          break;
        }
        case 'control:elicitation': {
          const { requestId } = requestIdPayload.parse(p);
          ch.trackControlRequest(requestId, { subtype: 'elicitation' });
          break;
        }
        case 'control:diff_review': {
          const { toolId } = diffReviewPayload.parse(p);
          ch.trackControlRequest(toolId, { subtype: 'open_diff' });
          break;
        }
        case 'control:mcp': {
          const mcp = mcpPayload.parse(p);
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
              const { model } = serverActionInputModel.parse(action.input ?? {});
              ch.updateSessionState({ model });
              ch.runner.respondToControlRequest(action.requestId, { subtype: 'success' });
              ctx.broadcastSessionState(channelId, 'busy');
              break;
            }
            case 'set_permission_mode': {
              const { mode } = serverActionInputMode.parse(action.input ?? {});
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
