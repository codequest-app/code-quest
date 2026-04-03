import type { AdapterOutput, ClientMessage } from '../../types.ts';
import { asRecord, isRecord } from '../../utils.ts';

type RequestContext = { requestId: string; request: Record<string, unknown> };

function handleCanUseTool({ requestId, request }: RequestContext): ClientMessage {
  return {
    name: 'control:permission',
    payload: {
      requestId,
      toolName: request.tool_name ?? '',
      toolUseId: request.tool_use_id,
      input: request.input,
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
      callbackId: (request.callback_id as string) ?? '',
      input: request.input,
      toolUseId: request.tool_use_id,
    },
  };
}

function handleElicitation({ requestId, request }: RequestContext): ClientMessage {
  const elInput = asRecord(request.input);
  const mode = typeof elInput?.mode === 'string' ? elInput.mode : undefined;
  const inputType = mode === 'url' ? 'url' : mode === 'form' ? 'select' : 'text';
  const reqSchema = asRecord(elInput?.requested_schema);
  const options = mode === 'form' ? Object.keys(asRecord(reqSchema?.properties) ?? {}) : undefined;
  return {
    name: 'control:elicitation',
    payload: {
      requestId,
      prompt: typeof elInput?.message === 'string' ? elInput.message : '',
      inputType,
      options,
      url: mode === 'url' && typeof elInput?.url === 'string' ? elInput.url : undefined,
      elicitationId: request.elicitation_id,
      mcpServerName:
        (typeof elInput?.mcp_server_name === 'string' ? elInput.mcp_server_name : undefined) ??
        request.mcp_server_name,
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
      originalPath:
        typeof diffInput?.originalFilePath === 'string' ? diffInput.originalFilePath : '',
      newPath: typeof diffInput?.newFilePath === 'string' ? diffInput.newFilePath : '',
    },
  };
}

function handleMcpMessage({ requestId, request }: RequestContext): ClientMessage {
  const mcpInput = asRecord(request.input);
  const serverName = String(mcpInput?.server_name ?? request.tool_name ?? '');
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
      url: typeof urlInput?.url === 'string' ? urlInput.url : '',
      response: { type: 'open_url_response' },
    },
  };
}

function handleOpenFile({ requestId, request }: RequestContext): ClientMessage {
  const fileInput = asRecord(request.input);
  const filePath = typeof fileInput?.file_path === 'string' ? fileInput.file_path : '';
  const location = asRecord(fileInput?.location);
  return {
    name: 'action:open_file',
    payload: { requestId, filePath, location, response: { type: 'open_file_response' } },
  };
}

function handleShowNotification({ requestId, request }: RequestContext): ClientMessage {
  const notifInput = asRecord(request.input);
  const severity = typeof notifInput?.severity === 'string' ? notifInput.severity : 'info';
  return {
    name: 'notification:show',
    payload: {
      requestId,
      message: typeof notifInput?.message === 'string' ? notifInput.message : '',
      severity: severity === 'error' || severity === 'warning' ? severity : 'info',
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
      subtype: (request?.subtype as string) ?? '',
      toolName: request?.tool_name as string | undefined,
      toolUseId: request?.tool_use_id as string | undefined,
      input: request?.input,
      suggestions: request?.permission_suggestions as unknown[] | undefined,
      callbackId: request?.callback_id as string | undefined,
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
  return { name: 'settings:model_updated', payload: { requestId, input: request.input } };
}

function handleSetPermissionMode({ requestId, request }: RequestContext): ClientMessage {
  return { name: 'settings:permission_mode_updated', payload: { requestId, input: request.input } };
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

export function transformControlRequest(raw: Record<string, unknown>): AdapterOutput {
  const request = raw.request as Record<string, unknown> | undefined;
  const requestId = raw.request_id as string;
  const subtype = request?.subtype as string | undefined;

  const ctx: RequestContext = { requestId, request: request ?? {} };
  const handler = subtype ? HANDLERS[subtype] : undefined;
  const result = handler ? handler(ctx) : handleForwardToClient(ctx);

  const messages = result ? [result] : [];
  return { messages, serverActions: [], controlResponses: [] };
}
