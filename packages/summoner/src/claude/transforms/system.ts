import type { z } from 'zod';
import type { ClientMessage } from '../../types.ts';
import type {
  ProtocolMessage,
  systemApiRetrySchema,
  systemBridgeStateSchema,
  systemCompactBoundarySchema,
  systemHookResponseSchema,
  systemHookStartedSchema,
  systemInitSchema,
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
      status: String(raw.status ?? ''),
      permissionMode: raw.permissionMode,
    },
  };
}

function handleHookStarted(raw: SystemHookStarted): ClientMessage {
  return {
    name: 'system:hook_started',
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
    name: 'system:hook_response',
    payload: {
      hook: {
        hookName: raw.hook_name,
        hookId: raw.hook_id,
        hookEvent: raw.hook_event,
        hookEventName: raw.hook_event_name,
        output: raw.output,
        additionalContext: raw.additional_context,
      },
    },
  };
}

function handleTaskStarted(raw: SystemTaskStarted): ClientMessage {
  return {
    name: 'system:task_started',
    payload: { description: raw.description, taskType: raw.task_type },
  };
}

function handleTaskNotification(raw: SystemTaskNotification): ClientMessage {
  return {
    name: 'system:task_notification',
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
    name: 'system:task_progress',
    payload: {
      taskId: raw.task_id,
      toolUseId: raw.tool_use_id,
      description: raw.description,
      lastToolName: raw.last_tool_name,
      usage: raw.usage,
    },
  };
}

// Skip: extension also ignores these
function handlePostTurnSummary(): null {
  return null;
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
  post_turn_summary: handlePostTurnSummary,
  session_state_changed: handleSessionStateChanged,
  api_retry: handler(handleApiRetry),
  bridge_state: handler(handleBridgeState),
  compact_boundary: handler(handleCompactBoundary),
};

export function transformSystem(raw: ProtocolMessage): ClientMessage | null {
  const subtype = typeof raw.subtype === 'string' ? raw.subtype : undefined;

  if (subtype && subtype in HANDLERS) {
    return HANDLERS[subtype](raw);
  }

  // Other system subtypes → raw
  return {
    name: 'raw:event',
    payload: {
      rawType: `system/${subtype}`,
      data: raw,
    },
  };
}
