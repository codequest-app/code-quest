import type { SocketEvent } from '../../types.ts';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function transformSystemEvent(event: Record<string, unknown>): SocketEvent | null {
  const subtype = event.subtype as string | undefined;

  if (subtype === 'init') {
    return {
      name: 'session:init',
      payload: {
        sessionId: event.session_id,
        model: event.model,
        tools: event.tools,
        permissionMode: event.permissionMode,
        fastModeState: event.fast_mode_state,
        slashCommands: event.slash_commands,
        mcpServers: event.mcp_servers,
        config: event,
      },
    };
  }

  if (subtype === 'status') {
    return {
      name: 'session:status',
      payload: {
        status: (event.status as string) ?? '',
        permissionMode: event.permissionMode,
      },
    };
  }

  if (subtype === 'hook_started') {
    return {
      name: 'system:hook_started',
      payload: {
        hook: {
          hookName: event.hook_name,
          hookId: event.hook_id,
          hookEvent: event.hook_event,
        },
      },
    };
  }

  if (subtype === 'hook_response') {
    return {
      name: 'system:hook_response',
      payload: {
        hook: {
          hookName: event.hook_name,
          hookId: event.hook_id,
          hookEvent: event.hook_event,
          hookEventName: event.hook_event_name,
          output: event.output,
          additionalContext: event.additional_context,
        },
      },
    };
  }

  if (subtype === 'task_started') {
    return {
      name: 'system:task_started',
      payload: { description: event.description, taskType: event.task_type },
    };
  }

  if (subtype === 'task_notification') {
    return {
      name: 'system:task_notification',
      payload: {
        taskId: event.task_id,
        toolUseId: event.tool_use_id,
        status: event.status,
        outputFile: event.output_file,
        summary: event.summary,
        usage: event.usage,
      },
    };
  }

  if (subtype === 'task_progress') {
    return {
      name: 'system:task_progress',
      payload: {
        taskId: event.task_id,
        toolUseId: event.tool_use_id,
        description: event.description,
        lastToolName: event.last_tool_name,
        usage: event.usage,
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
        attempt: event.attempt,
        maxRetries: event.max_retries,
        retryDelayMs: event.retry_delay_ms,
        errorStatus: event.error_status,
        error: event.error,
      },
    };
  }

  if (subtype === 'bridge_state') {
    return {
      name: 'system:remote_control',
      payload: {
        info: { state: event.state, detail: event.detail },
      },
    };
  }

  if (subtype === 'compact_boundary') {
    const meta = event.compactMetadata;
    const preserved = isRecord(meta) ? meta.preservedSegment : undefined;
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
      data: event,
    },
  };
}
