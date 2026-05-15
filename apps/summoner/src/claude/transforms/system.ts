import type { ClientMessage } from '@code-quest/schemas';
import type { z } from 'zod';
import { asString } from '../../utils.ts';
import type {
  ProtocolMessage,
  systemApiRetrySchema,
  systemBridgeStateSchema,
  systemCompactBoundarySchema,
  systemHookResponseSchema,
  systemHookStartedSchema,
  systemInitSchema,
  systemMirrorErrorSchema,
  systemStatusSchema,
  systemTaskNotificationSchema,
  systemTaskProgressSchema,
  systemTaskStartedSchema,
} from '../schemas.ts';

type SystemInit = z.infer<typeof systemInitSchema>;
type SystemStatus = z.infer<typeof systemStatusSchema>;
type SystemHookStarted = z.infer<typeof systemHookStartedSchema>;
type SystemHookResponse = z.infer<typeof systemHookResponseSchema>;
type SystemTaskStarted = z.infer<typeof systemTaskStartedSchema>;
type SystemTaskNotification = z.infer<typeof systemTaskNotificationSchema>;
type SystemTaskProgress = z.infer<typeof systemTaskProgressSchema>;
type SystemApiRetry = z.infer<typeof systemApiRetrySchema>;
type SystemBridgeState = z.infer<typeof systemBridgeStateSchema>;
type SystemCompactBoundary = z.infer<typeof systemCompactBoundarySchema>;
type SystemMirrorError = z.infer<typeof systemMirrorErrorSchema>;

function handleInit(raw: SystemInit): ClientMessage {
  return {
    name: 'session:init',
    payload: {
      sessionId: raw.session_id,
      model: raw.model,
      tools: raw.tools,
      permissionMode: raw.permissionMode,
      fastModeState: raw.fast_mode_state,
      slashCommands: raw.slash_commands,
      mcpServers: raw.mcp_servers,
      config: raw,
    },
  };
}

function handleStatus(raw: SystemStatus): ClientMessage {
  return {
    name: 'session:status',
    payload: {
      status: asString(raw.status, ''),
      permissionMode: raw.permissionMode,
    },
  };
}

function handleHookStarted(raw: SystemHookStarted): ClientMessage {
  return {
    name: 'hook:started',
    payload: {
      hook: {
        hookName: raw.hook_name,
        hookId: raw.hook_id,
        hookEvent: raw.hook_event,
      },
    },
  };
}

function handleHookResponse(raw: SystemHookResponse): ClientMessage {
  return {
    name: 'hook:response',
    payload: {
      hook: {
        hookName: raw.hook_name,
        hookId: raw.hook_id,
        hookEvent: raw.hook_event,
        hookEventName: raw.hook_event_name,
        output: raw.output,
        additionalContext:
          typeof raw.additional_context === 'string' ? raw.additional_context : undefined,
      },
    },
  };
}

function handleTaskStarted(raw: SystemTaskStarted): ClientMessage {
  return {
    name: 'task:started',
    payload: {
      description: raw.description ?? '',
      taskType: raw.task_type,
      toolUseId: raw.tool_use_id,
    },
  };
}

function handleTaskNotification(raw: SystemTaskNotification): ClientMessage {
  return {
    name: 'task:notification',
    payload: {
      taskId: raw.task_id,
      toolUseId: raw.tool_use_id,
      status: raw.status,
      outputFile: raw.output_file,
      summary: raw.summary,
      usage: raw.usage,
    },
  };
}

function handleTaskProgress(raw: SystemTaskProgress): ClientMessage {
  return {
    name: 'task:progress',
    payload: {
      taskId: raw.task_id,
      toolUseId: raw.tool_use_id,
      description: raw.description,
      lastToolName: raw.last_tool_name,
      usage: raw.usage,
    },
  };
}

function handlePostTurnSummary(raw: ProtocolMessage): ClientMessage | null {
  const summary = asString(raw.summary, '');
  if (!summary) return null;
  return { name: 'system:post_turn_summary', payload: { summary } };
}

function handleSessionStateChanged(): null {
  return null;
}

function handleApiRetry(raw: SystemApiRetry): ClientMessage {
  return {
    name: 'system:api_retry',
    payload: {
      attempt: raw.attempt,
      maxRetries: raw.max_retries,
      retryDelayMs: raw.retry_delay_ms,
      errorStatus: raw.error_status,
      error: raw.error,
    },
  };
}

function handleBridgeState(raw: SystemBridgeState): ClientMessage {
  return {
    name: 'system:remote_control',
    payload: {
      info: { state: raw.state, detail: raw.detail },
    },
  };
}

function handleMirrorError(raw: SystemMirrorError): ClientMessage {
  return {
    name: 'system:mirror_error',
    payload: {
      error: raw.error,
      sessionId: raw.session_id,
    },
  };
}

function handleCompactBoundary(raw: SystemCompactBoundary): ClientMessage {
  const preserved = raw.compactMetadata?.preservedSegment;
  return {
    name: 'system:compact_boundary',
    payload: {
      ...(preserved != null ? { preservedSegment: Boolean(preserved) } : {}),
    },
  };
}

type SystemHandler = (raw: ProtocolMessage) => ClientMessage | null;

/**
 * Wraps a handler that accepts a narrowed subtype into one that accepts ProtocolMessage.
 * Safe because the dispatch map only calls handlers after matching by subtype,
 * and each ProtocolMessage subtype is a superset of the narrowed schema type.
 */
function handler<T extends ProtocolMessage>(fn: (raw: T) => ClientMessage | null): SystemHandler {
  return fn as SystemHandler;
}

const HANDLERS: Record<string, SystemHandler> = {
  init: handler(handleInit),
  status: handler(handleStatus),
  hook_started: handler(handleHookStarted),
  hook_response: handler(handleHookResponse),
  task_started: handler(handleTaskStarted),
  task_notification: handler(handleTaskNotification),
  task_progress: handler(handleTaskProgress),
  post_turn_summary: handler(handlePostTurnSummary),
  session_state_changed: handler(handleSessionStateChanged),
  api_retry: handler(handleApiRetry),
  bridge_state: handler(handleBridgeState),
  compact_boundary: handler(handleCompactBoundary),
  mirror_error: handler(handleMirrorError),
};

export function transformSystem(raw: ProtocolMessage): ClientMessage | null {
  const subtype = typeof raw.subtype === 'string' ? raw.subtype : undefined;

  const fn = subtype && HANDLERS[subtype];
  if (fn) return fn(raw);

  // Other system subtypes → raw
  return {
    name: 'raw:event',
    payload: {
      rawType: `system/${subtype}`,
      data: raw,
    },
  };
}
