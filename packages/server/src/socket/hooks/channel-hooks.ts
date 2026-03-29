import type { WireRunnerHooks } from '../channel.ts';
import type { HandlerContext } from '../handler-context.ts';

/**
 * Build WireRunnerHooks with ChatHandler-specific business logic.
 * Extracted from ChatHandler so it can be tested and composed independently.
 */
export function buildChannelHooks(ctx: HandlerContext, channelId: string): WireRunnerHooks {
  let lastResultErrors: string[] | undefined;

  const readFileOrEmpty = (path: string) =>
    import('node:fs/promises').then((fs) => fs.readFile(path, 'utf-8')).catch(() => '');

  return {
    onSocketEvent: (ch, se) => {
      const p = se.payload as Record<string, unknown>;
      switch (se.name) {
        case 'session:init': {
          ctx.broadcastSessionState(channelId, 'busy');
          // session:init is emitted explicitly by launch/join handlers
          break;
        }
        case 'message:result': {
          const errors = p.errors as string[] | undefined;
          if (errors?.length) lastResultErrors = errors;
          ctx.broadcastSessionState(channelId, 'idle');
          break;
        }
        case 'system:rate_limit':
          ctx.usageTracker.update(p.info as Parameters<typeof ctx.usageTracker.update>[0]);
          break;
        case 'system:file_updated':
          ctx.emitToSession(channelId, 'file_updated', {
            channelId,
            filePath: p.filePath as string,
            oldContent: p.oldContent as string | null | undefined,
            newContent: p.newContent as string | null | undefined,
          });
          break;
        case 'control:cancel':
          ch.removeControlRequest(p.requestId as string);
          ctx.emitToSession(channelId, 'cancel_request', {
            channelId,
            targetRequestId: p.requestId as string,
          });
          break;
        case 'control:permission':
          ch.trackControlRequest(p.requestId as string, {
            subtype: 'can_use_tool',
            toolName: p.toolName as string,
            toolUseId: p.toolUseId as string,
          });
          break;
        case 'control:elicitation':
          ch.trackControlRequest(p.requestId as string, { subtype: 'elicitation' });
          break;
        case 'control:diff_review':
          ch.trackControlRequest(p.toolId as string, { subtype: 'open_diff' });
          break;
        case 'control:mcp': {
          const requestId = p.requestId as string;
          const hasClient = ch.sockets.size > 0;
          if (!hasClient) {
            ch.runner.respondToControlRequest(requestId, {
              jsonrpc: '2.0',
              error: { code: -32603, message: 'no client' },
              id: (p.message as Record<string, unknown>)?.id ?? null,
            });
            break;
          }
          const mcpTimeout = setTimeout(() => {
            ch.removeControlRequest(requestId);
            ch.runner.respondToControlRequest(requestId, {
              jsonrpc: '2.0',
              error: { code: -32603, message: 'timeout' },
              id: (p.message as Record<string, unknown>)?.id ?? null,
            });
          }, 10_000);
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
              const settings = {
                ...ctx.settingsStore.getAll(),
                ...(state.model !== undefined ? { model: state.model } : {}),
                ...(state.permissionMode !== undefined
                  ? { permissionMode: state.permissionMode }
                  : {}),
              };
              ch.runner.respondToControlRequest(action.requestId, settings);
              break;
            }
            case 'set_model': {
              const model = ((action.input as Record<string, unknown>)?.model as string) ?? '';
              ch.updateSessionState({ model });
              ch.runner.respondToControlRequest(action.requestId, { subtype: 'success' });
              ctx.broadcastSessionState(channelId, 'busy');
              break;
            }
            case 'set_permission_mode': {
              const mode = ((action.input as Record<string, unknown>)?.mode as string) ?? '';
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

    onExit: (ch, code) => {
      const rejectMsg = lastResultErrors?.[0] ?? `Process closed with exit code ${code}`;
      for (const [, pending] of ch.pendingRequests) {
        clearTimeout(pending.timer);
        pending.reject(new Error(rejectMsg));
      }
      ch.pendingRequests.clear();
      ctx.broadcastSessionState(channelId, 'exited');
      ch.resetSessionState();
      ctx.emitToSession(channelId, 'session:closed', {
        channelId,
        ...(ch.lastError ? { error: ch.lastError } : {}),
      });
    },
  };
}
