import type { ClientMessage } from '../../types.ts';
import { asRecord } from '../../utils.ts';
import type { ProtocolMessage } from '../schemas.ts';

export function transformSystem(raw: ProtocolMessage): ClientMessage | null {
  const subtype = raw.subtype as string | undefined;

  if (subtype === 'init') {
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

  if (subtype === 'status') {
    return {
      name: 'session:status',
      payload: {
        status: (raw.status as string) ?? '',
        permissionMode: raw.permissionMode,
      },
    };
  }

  if (subtype === 'hook_started') {
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

  if (subtype === 'hook_response') {
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

  if (subtype === 'task_started') {
    return {
      name: 'system:task_started',
      payload: { description: raw.description, taskType: raw.task_type },
    };
  }

  if (subtype === 'task_notification') {
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

  if (subtype === 'task_progress') {
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
  if (subtype === 'post_turn_summary' || subtype === 'session_state_changed') {
    return null;
  }

  if (subtype === 'api_retry') {
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

  if (subtype === 'bridge_state') {
    return {
      name: 'system:remote_control',
      payload: {
        info: { state: raw.state, detail: raw.detail },
      },
    };
  }

  if (subtype === 'compact_boundary') {
    const meta = raw.compactMetadata;
    const preserved = asRecord(meta)?.preservedSegment;
    return {
      name: 'system:compact_boundary',
      payload: {
        ...(preserved != null ? { preservedSegment: Boolean(preserved) } : {}),
      },
    };
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
