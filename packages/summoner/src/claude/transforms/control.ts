import type { ServerAction, SocketEvent } from '../../types.ts';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

interface ControlResult {
  events: SocketEvent[];
  serverActions: ServerAction[];
  controlResponses: [];
}

export function transformControlRequest(event: Record<string, unknown>): ControlResult {
  const request = event.request as Record<string, unknown> | undefined;
  const requestId = event.request_id as string;
  const events: SocketEvent[] = [];
  const serverActions: ServerAction[] = [];

  switch (request?.subtype) {
    case 'can_use_tool':
      events.push({
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
      });
      break;

    case 'hook_callback':
      events.push({
        name: 'control:hook_callback',
        payload: {
          requestId,
          callbackId: (request.callback_id as string) ?? '',
          input: request.input,
          toolUseId: request.tool_use_id,
        },
      });
      break;

    case 'elicitation': {
      const elInput = isRecord(request.input) ? request.input : undefined;
      const mode = typeof elInput?.mode === 'string' ? elInput.mode : undefined;
      const inputType = mode === 'url' ? 'url' : mode === 'form' ? 'select' : 'text';
      const reqSchema = isRecord(elInput?.requested_schema) ? elInput.requested_schema : undefined;
      const options =
        mode === 'form'
          ? Object.keys((isRecord(reqSchema?.properties) ? reqSchema.properties : undefined) ?? {})
          : undefined;
      events.push({
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
      });
      break;
    }

    case 'open_diff': {
      const diffInput = isRecord(request.input) ? request.input : undefined;
      serverActions.push({
        action: 'read_diff',
        requestId,
        originalPath:
          typeof diffInput?.originalFilePath === 'string' ? diffInput.originalFilePath : '',
        newPath: typeof diffInput?.newFilePath === 'string' ? diffInput.newFilePath : '',
      });
      break;
    }

    case 'mcp_message': {
      const mcpInput = isRecord(request.input) ? request.input : undefined;
      const serverName = String(mcpInput?.server_name ?? request.tool_name ?? '');
      const mcpMsg = isRecord(mcpInput?.message) ? mcpInput.message : (mcpInput ?? {});

      if (mcpMsg.id == null) {
        serverActions.push({
          action: 'auto_respond',
          requestId,
          subtype: 'mcp_notification',
          response: { mcp_response: {} },
        });
      } else {
        events.push({
          name: 'control:mcp',
          payload: { requestId, serverName, message: mcpMsg },
        });
      }
      break;
    }

    case 'open_url': {
      const urlInput = isRecord(request.input) ? request.input : undefined;
      events.push({
        name: 'action:open_url',
        payload: { url: typeof urlInput?.url === 'string' ? urlInput.url : '' },
      });
      serverActions.push({
        action: 'auto_respond',
        requestId,
        subtype: 'open_url',
        response: { type: 'open_url_response' },
      });
      break;
    }

    case 'open_file': {
      const fileInput = isRecord(request.input) ? request.input : undefined;
      const filePath = typeof fileInput?.file_path === 'string' ? fileInput.file_path : '';
      const location = isRecord(fileInput?.location) ? fileInput.location : undefined;
      events.push({
        name: 'action:open_file',
        payload: { filePath, location },
      });
      serverActions.push({
        action: 'auto_respond',
        requestId,
        subtype: 'open_file',
        response: { type: 'open_file_response' },
      });
      break;
    }

    case 'show_notification': {
      const notifInput = isRecord(request.input) ? request.input : undefined;
      const severity = typeof notifInput?.severity === 'string' ? notifInput.severity : 'info';
      events.push({
        name: 'notification:show',
        payload: {
          message: typeof notifInput?.message === 'string' ? notifInput.message : '',
          severity: severity === 'error' || severity === 'warning' ? severity : 'info',
          buttons: Array.isArray(notifInput?.buttons) ? notifInput.buttons : undefined,
          onlyIfNotVisible:
            typeof notifInput?.onlyIfNotVisible === 'boolean'
              ? notifInput.onlyIfNotVisible
              : undefined,
        },
      });
      serverActions.push({
        action: 'auto_respond',
        requestId,
        subtype: 'show_notification',
        response: { type: 'show_notification_response' },
      });
      break;
    }

    case 'initialize':
      break;

    case 'get_settings':
    case 'set_model':
    case 'set_permission_mode':
      serverActions.push({
        action: 'auto_respond',
        requestId,
        subtype: request.subtype as string,
        response: {},
        input: request.input,
      });
      break;

    default:
      serverActions.push({
        action: 'forward_to_client',
        requestId,
        subtype: (request?.subtype as string) ?? '',
        toolName: request?.tool_name as string | undefined,
        toolUseId: request?.tool_use_id as string | undefined,
        input: request?.input,
        suggestions: request?.permission_suggestions as unknown[] | undefined,
        callbackId: request?.callback_id as string | undefined,
      });
      break;
  }

  return { events, serverActions, controlResponses: [] };
}
