import type { NotificationSeverity } from '@code-quest/shared';
import type { z } from 'zod';
import type { AdapterOutput, ClientMessage } from '../../types.ts';
import { asRecord, asString, isRecord } from '../../utils.ts';
import type { controlRequestSchema } from '../schemas.ts';

type ControlRequestMessage = z.infer<typeof controlRequestSchema>;
type RequestContext = { requestId: string; request: ControlRequestMessage['request'] };

type ElicitationInputType = 'url' | 'select' | 'text';
function inputTypeFromMode(mode: string | undefined): ElicitationInputType {
  switch (mode) {
    case 'url':
      return 'url';
    case 'form':
      return 'select';
    default:
      return 'text';
  }
}

function normalizeSeverity(raw: string): NotificationSeverity {
  return raw === 'error' || raw === 'warning' ? raw : 'info';
}

function handleCanUseTool({ requestId, request }: RequestContext): ClientMessage {
  return {
    name: 'control:permission',
    payload: {
      requestId,
      toolName: request.tool_name ?? '',
      toolUseId: request.tool_use_id,
      input: asRecord(request.input),
      suggestions: request.permission_suggestions,
      callbackId: request.callback_id,
      blockedPath: request.blocked_path ?? undefined,
      decisionReason: request.decision_reason,
      agentId: request.agent_id,
    },
  };
}

function handleHookCallback({ requestId, request }: RequestContext): ClientMessage {
  return {
    name: 'control:hook_callback',
    payload: {
      requestId,
      callbackId: request.callback_id ?? '',
      input: asRecord(request.input),
      toolUseId: request.tool_use_id,
    },
  };
}

function handleElicitation({ requestId, request }: RequestContext): ClientMessage {
  const elInput = asRecord(request.input);
  const mode = asString(elInput?.mode, undefined);
  const inputType = inputTypeFromMode(mode);
  const reqSchema = asRecord(elInput?.requested_schema);
  const options = mode === 'form' ? Object.keys(asRecord(reqSchema?.properties) ?? {}) : undefined;
  return {
    name: 'control:elicitation',
    payload: {
      requestId,
      prompt: asString(elInput?.message, ''),
      inputType,
      options,
      url: mode === 'url' ? asString(elInput?.url, undefined) : undefined,
      elicitationId: request.elicitation_id,
      mcpServerName: asString(elInput?.mcp_server_name, undefined) ?? request.mcp_server_name,
      requestedSchema: reqSchema,
    },
  };
}

function handleOpenDiff({ requestId, request }: RequestContext): ClientMessage {
  const diffInput = asRecord(request.input);
  return {
    name: 'control:open_diff',
    payload: {
      requestId,
      originalPath: asString(diffInput?.originalFilePath, ''),
      newPath: asString(diffInput?.newFilePath, ''),
    },
  };
}

function handleMcpMessage({ requestId, request }: RequestContext): ClientMessage {
  const mcpInput = asRecord(request.input);
  const serverName = asString(mcpInput?.server_name ?? request.tool_name, '');
  const mcpMsg = isRecord(mcpInput?.message) ? mcpInput.message : (mcpInput ?? {});

  if (mcpMsg.id == null) {
    return { name: 'mcp:auto_respond', payload: { requestId, response: { mcp_response: {} } } };
  }
  return { name: 'control:mcp', payload: { requestId, serverName, message: mcpMsg } };
}

function handleOpenUrl({ requestId, request }: RequestContext): ClientMessage {
  const urlInput = asRecord(request.input);
  return {
    name: 'action:open_url',
    payload: {
      requestId,
      url: asString(urlInput?.url, ''),
      response: { type: 'open_url_response' },
    },
  };
}

function handleOpenFile({ requestId, request }: RequestContext): ClientMessage {
  const fileInput = asRecord(request.input);
  const filePath = asString(fileInput?.file_path, '');
  const location = asRecord(fileInput?.location);
  return {
    name: 'action:open_file',
    payload: { requestId, filePath, location, response: { type: 'open_file_response' } },
  };
}

function handleShowNotification({ requestId, request }: RequestContext): ClientMessage {
  const notifInput = asRecord(request.input);
  const severity = asString(notifInput?.severity, 'info');
  return {
    name: 'notification:show',
    payload: {
      requestId,
      message: asString(notifInput?.message, ''),
      severity: normalizeSeverity(severity),
      buttons: Array.isArray(notifInput?.buttons) ? notifInput.buttons : undefined,
      onlyIfNotVisible:
        typeof notifInput?.onlyIfNotVisible === 'boolean' ? notifInput.onlyIfNotVisible : undefined,
      response: { type: 'show_notification_response' },
    },
  };
}

function handleForwardToClient({ requestId, request }: RequestContext): ClientMessage {
  return {
    name: 'control:forward',
    payload: {
      requestId,
      subtype: request.subtype ?? '',
      toolName: request.tool_name,
      toolUseId: request.tool_use_id,
      input: request.input,
      suggestions: request.permission_suggestions,
      callbackId: request.callback_id,
    },
  };
}

function handleInitialize(): null {
  return null;
}

function handleGetSettings({ requestId }: RequestContext): ClientMessage {
  return { name: 'settings:get_settings', payload: { requestId } };
}

function handleSetModel({ requestId, request }: RequestContext): ClientMessage {
  return {
    name: 'settings:model_updated',
    payload: { requestId, input: asRecord(request.input) },
  };
}

function handleSetPermissionMode({ requestId, request }: RequestContext): ClientMessage {
  return {
    name: 'settings:permission_mode_updated',
    payload: { requestId, input: asRecord(request.input) },
  };
}

const HANDLERS: Record<string, (ctx: RequestContext) => ClientMessage | null> = {
  can_use_tool: handleCanUseTool,
  hook_callback: handleHookCallback,
  elicitation: handleElicitation,
  open_diff: handleOpenDiff,
  mcp_message: handleMcpMessage,
  open_url: handleOpenUrl,
  open_file: handleOpenFile,
  show_notification: handleShowNotification,
  initialize: handleInitialize,
  get_settings: handleGetSettings,
  set_model: handleSetModel,
  set_permission_mode: handleSetPermissionMode,
};

export function transformControlRequest(raw: ControlRequestMessage): AdapterOutput {
  const request = raw.request;
  const requestId = raw.request_id;
  const subtype = request.subtype;

  const ctx: RequestContext = { requestId, request };
  const handler = subtype ? HANDLERS[subtype] : undefined;
  const result = handler ? handler(ctx) : handleForwardToClient(ctx);

  const messages = result ? [result] : [];
  return { messages, controlResponses: [] };
}
