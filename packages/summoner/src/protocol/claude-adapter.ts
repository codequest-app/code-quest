import type { ContentBlock } from '@code-quest/shared';
import type { ControlResponseEvent } from '../types.ts';
import { ClaudeProtocol } from './claude.ts';
import type { ProtocolEvent } from './claude-schemas.ts';
import type {
  AdapterOutput,
  AutoResponse,
  LaunchOptions,
  ParseResult,
  ProviderAdapter,
  SocketEvent,
} from './provider-adapter.ts';
import type { ServerAction } from './server-action.ts';

interface ConvertResult {
  events: SocketEvent[];
  serverActions: ServerAction[];
  controlResponses: ControlResponseEvent[];
}

const EMPTY: ConvertResult = { events: [], serverActions: [], controlResponses: [] };

export class ClaudeAdapter implements ProviderAdapter {
  private readonly protocol = new ClaudeProtocol();

  get command(): string {
    return this.protocol.command;
  }

  buildArgs(options?: LaunchOptions): string[] {
    return this.protocol.buildArgs(options);
  }

  parseLine(line: string): ParseResult {
    return this.protocol.parseLine(line);
  }

  /** Subtypes that need server-side enrichment before responding to CLI */
  private static readonly SERVER_ENRICHED_SUBTYPES = new Set([
    'get_settings',
    'set_model',
    'set_permission_mode',
  ]);

  transform(event: ProtocolEvent): AdapterOutput {
    const { events, serverActions, controlResponses } = this.convertEvent(event);

    const autoResponses: AutoResponse[] = [];
    const remainingServerActions = [];
    for (const sa of serverActions) {
      if (sa.action === 'auto_respond' && !ClaudeAdapter.SERVER_ENRICHED_SUBTYPES.has(sa.subtype)) {
        autoResponses.push({
          requestId: sa.requestId,
          subtype: sa.subtype,
          response: sa.response,
          input: sa.input,
        });
      } else {
        remainingServerActions.push(sa);
      }
    }

    return {
      events,
      autoResponses,
      controlResponses,
      serverActions: remainingServerActions,
    };
  }

  formatMessage(text: string): string {
    return this.protocol.formatUserMessage(text);
  }

  formatControlRequest(
    subtype: string,
    input?: Record<string, unknown>,
    requestId?: string,
  ): string {
    return this.protocol.formatControlRequest(subtype, input, requestId);
  }

  formatControlResponse(requestId: string, response: Record<string, unknown>): string {
    return this.protocol.formatControlResponse(requestId, response);
  }

  extractRespondedRequestIds(rawEntries: Array<{ direction: string; raw: string }>): Set<string> {
    const ids = new Set<string>();
    for (const entry of rawEntries) {
      if (entry.direction !== 'in') continue;
      try {
        const obj = JSON.parse(entry.raw.trim()) as Record<string, unknown>;
        const resp = obj.response as Record<string, unknown> | undefined;
        if (resp?.request_id) ids.add(resp.request_id as string);
      } catch {
        // ignore
      }
    }
    return ids;
  }

  static readonly THINKING_LEVEL_TOKENS: Record<string, number> = {
    off: 0,
  };

  // ── Core dispatch ──

  private convertEvent(event: ProtocolEvent): ConvertResult {
    if (event.type === 'keep_alive') return EMPTY;

    if (event.type === 'control_response') {
      const resp = event.response as Record<string, unknown>;
      return {
        events: [],
        serverActions: [],
        controlResponses: [
          {
            requestId: resp.request_id as string,
            success: (resp as { subtype: string }).subtype === 'success',
            response: resp.response as Record<string, unknown> | undefined,
            error: resp.error as string | undefined,
          },
        ],
      };
    }

    if (event.type === 'control_cancel_request') {
      return {
        events: [{ name: 'control:cancel', payload: { requestId: event.request_id } }],
        serverActions: [],
        controlResponses: [],
      };
    }

    if (event.type === 'control_request') {
      return this.convertControlRequest(event);
    }

    // All other types produce only SocketEvents, no ServerActions
    const se = this.convertOtherEvent(event);
    if (se === null) return EMPTY;
    const events = Array.isArray(se) ? se : [se];
    return { events, serverActions: [], controlResponses: [] };
  }

  // ── Non-control events → SocketEvent ──

  private convertOtherEvent(event: ProtocolEvent): SocketEvent | SocketEvent[] | null {
    if (event.type === 'system') return this.convertSystemEvent(event);
    if (event.type === 'assistant') return this.convertAssistantEvent(event);
    if (event.type === 'user') return this.convertUserEvent(event);
    if (event.type === 'result') return this.convertResultEvent(event);
    if (event.type === 'stream_event') return this.convertStreamEvent(event);

    if (event.type === 'rate_limit_event') {
      const rli = event.rate_limit_info as Record<string, unknown> | undefined;
      return {
        name: 'system:rate_limit',
        payload: {
          info: {
            status: (rli?.status as string) ?? '',
            rateLimitType: rli?.rateLimitType as string | undefined,
            resetsAt: rli?.resetsAt as string | undefined,
            utilization: rli?.utilization as Record<string, unknown> | undefined,
            overageStatus: rli?.overageStatus as string | undefined,
            isUsingOverage: rli?.isUsingOverage as boolean | undefined,
          },
        },
      };
    }

    if ((event.type as string) === 'file_updated') {
      const fe = event as unknown as {
        filePath: string;
        oldContent?: string | null;
        newContent?: string | null;
      };
      return {
        name: 'system:file_updated',
        payload: { filePath: fe.filePath, oldContent: fe.oldContent, newContent: fe.newContent },
      };
    }

    if (event.type === 'streamlined_text') {
      return { name: 'stream:text', payload: { text: (event as { text: string }).text } };
    }

    if (event.type === 'streamlined_tool_use_summary') {
      return {
        name: 'stream:tool_summary',
        payload: { toolSummary: (event as { tool_summary: string }).tool_summary },
      };
    }

    if (event.type === 'error') {
      return {
        name: 'error:message',
        payload: {
          message:
            (event as { error?: { message?: string }; message?: string }).error?.message ??
            (event as { message?: string }).message ??
            'Unknown error',
        },
      };
    }

    if ((event.type as string) === 'experiment_gates') {
      return {
        name: 'system:experiment_gates',
        payload: { gates: (event as unknown as { gates: Record<string, unknown> }).gates },
      };
    }

    if ((event.type as string) === 'available_models') {
      return {
        name: 'system:available_models',
        payload: { models: (event as unknown as { models: unknown[] }).models },
      };
    }

    if ((event.type as string) === 'notification') {
      return {
        name: 'notification:toast',
        payload: { message: (event as unknown as { message: string }).message },
      };
    }

    if ((event.type as string) === 'auth_status') {
      const authEvt = event as unknown as {
        isAuthenticating?: boolean;
        output?: unknown[];
        account?: Record<string, unknown>;
      };
      return {
        name: 'notification:auth_status',
        payload: {
          status: authEvt.isAuthenticating ? 'authenticating' : 'authenticated',
          output: Array.isArray(authEvt.output) ? authEvt.output.join('\n') : undefined,
          account: authEvt.account,
        },
      };
    }

    if ((event.type as string) === 'auth_url') {
      const authEvent = event as unknown as { url: string; method?: string };
      return {
        name: 'notification:auth_url',
        payload: { url: authEvent.url, method: authEvent.method ?? 'oauth' },
      };
    }

    if ((event.type as string) === 'raw_event') {
      const re = event as unknown as { rawType: string; data: Record<string, unknown> };
      return { name: 'raw:event', payload: { rawType: re.rawType, data: re.data } };
    }

    // Unknown/unhandled → raw:event
    return {
      name: 'raw:event',
      payload: { rawType: event.type, data: event as unknown as Record<string, unknown> },
    };
  }

  // ── System events ──

  private convertSystemEvent(
    event: Extract<ProtocolEvent, { type: 'system' }>,
  ): SocketEvent | null {
    if (event.subtype === 'init') {
      const {
        type: _t,
        subtype: _s,
        session_id,
        mcp_servers,
        ...rest
      } = event as Record<string, unknown>;
      return {
        name: 'session:init',
        payload: {
          sessionId: session_id as string,
          model: rest.model as string | undefined,
          tools: rest.tools as string[] | undefined,
          permissionMode: rest.permissionMode as string | undefined,
          fastModeState: rest.fast_mode_state,
          slashCommands: rest.slash_commands as string[] | undefined,
          mcpServers: mcp_servers as Array<{ name: string; status: string }> | undefined,
          config: rest as Record<string, unknown>,
        },
      };
    }

    if (event.subtype === 'status') {
      const statusEvent = event as unknown as { status?: string; permissionMode?: string };
      return {
        name: 'session:status',
        payload: {
          status: statusEvent.status ?? '',
          permissionMode: statusEvent.permissionMode,
        },
      };
    }

    if (event.subtype === 'hook_started') {
      const e = event as unknown as { hook_name: string; hook_id: string; hook_event: string };
      return {
        name: 'system:hook_started',
        payload: { hook: { hookName: e.hook_name, hookId: e.hook_id, hookEvent: e.hook_event } },
      };
    }

    if (event.subtype === 'hook_response') {
      const e = event as unknown as {
        hook_name: string;
        hook_id: string;
        hook_event: string;
        hook_event_name?: string;
        output?: string;
        additional_context?: string;
      };
      return {
        name: 'system:hook_response',
        payload: {
          hook: {
            hookName: e.hook_name,
            hookId: e.hook_id,
            hookEvent: e.hook_event,
            hookEventName: e.hook_event_name,
            output: e.output,
            additionalContext: e.additional_context,
          },
        },
      };
    }

    if (event.subtype === 'task_started') {
      const e = event as unknown as { description: string; task_type?: string };
      return {
        name: 'system:task_started',
        payload: { description: e.description, taskType: e.task_type },
      };
    }

    if (event.subtype === 'task_notification') {
      const e = event as unknown as {
        task_id: string;
        tool_use_id?: string;
        status?: string;
        output_file?: string;
        summary?: string;
        usage?: Record<string, unknown>;
      };
      return {
        name: 'system:task_notification',
        payload: {
          taskId: e.task_id,
          toolUseId: e.tool_use_id,
          status: e.status,
          outputFile: e.output_file,
          summary: e.summary,
          usage: e.usage,
        },
      };
    }

    if (event.subtype === 'task_progress') {
      const e = event as unknown as {
        task_id: string;
        tool_use_id?: string;
        description?: string;
        last_tool_name?: string;
        usage?: Record<string, unknown>;
      };
      return {
        name: 'system:task_progress',
        payload: {
          taskId: e.task_id,
          toolUseId: e.tool_use_id,
          description: e.description,
          lastToolName: e.last_tool_name,
          usage: e.usage,
        },
      };
    }

    // Skip: extension also ignores these
    if (event.subtype === 'post_turn_summary' || event.subtype === 'session_state_changed') {
      return null;
    }

    if (event.subtype === 'api_retry') {
      const e = event as unknown as {
        attempt: number;
        max_retries: number;
        retry_delay_ms?: number;
        error_status?: number;
        error?: string;
      };
      return {
        name: 'system:api_retry',
        payload: {
          attempt: e.attempt,
          maxRetries: e.max_retries,
          retryDelayMs: e.retry_delay_ms,
          errorStatus: e.error_status,
          error: e.error,
        },
      };
    }

    if (event.subtype === 'bridge_state') {
      const e = event as unknown as { state: string; detail?: string };
      return {
        name: 'system:remote_control',
        payload: {
          info: { state: e.state as 'ready' | 'disconnected' | 'error', detail: e.detail },
        },
      };
    }

    if (event.subtype === 'compact_boundary') {
      const meta = (event as unknown as { compactMetadata?: { preservedSegment?: boolean } })
        .compactMetadata;
      return {
        name: 'system:compact_boundary',
        payload: {
          ...(meta?.preservedSegment != null
            ? { preservedSegment: Boolean(meta.preservedSegment) }
            : {}),
        },
      };
    }

    // Other system subtypes → raw
    return {
      name: 'raw:event',
      payload: {
        rawType: `system/${event.subtype}`,
        data: event as unknown as Record<string, unknown>,
      },
    };
  }

  // ── Assistant events ──

  private convertAssistantEvent(
    event: Extract<ProtocolEvent, { type: 'assistant' }>,
  ): SocketEvent | null {
    const parentToolUseId = (event as unknown as { parent_tool_use_id?: string })
      .parent_tool_use_id;
    const content = event.message?.content;
    if (!Array.isArray(content)) return null;

    const blocks: ContentBlock[] = [];
    for (const block of content) {
      const b = block as Record<string, unknown>;
      switch (b.type) {
        case 'text':
          blocks.push({ type: 'text', text: (b.text as string) ?? '' });
          break;
        case 'thinking':
          blocks.push({ type: 'thinking', thinking: (b.thinking as string) ?? '' });
          break;
        case 'tool_use':
          blocks.push({
            type: 'tool_use',
            toolId: (b.id as string) ?? '',
            toolName: (b.name as string) ?? '',
            input: b.input,
          });
          break;
      }
    }

    return {
      name: 'message:assistant',
      payload: { content: blocks, ...(parentToolUseId ? { parentToolUseId } : {}) },
    };
  }

  // ── User events ──

  private convertUserEvent(event: Extract<ProtocolEvent, { type: 'user' }>): SocketEvent | null {
    const parentToolUseId = (event as unknown as { parent_tool_use_id?: string })
      .parent_tool_use_id;
    const content = event.message?.content;
    if (!Array.isArray(content)) return null;

    const blocks: ContentBlock[] = [];
    for (const block of content) {
      const b = block as Record<string, unknown>;
      switch (b.type) {
        case 'text':
          blocks.push({ type: 'text', text: (b.text as string) ?? '' });
          break;
        case 'tool_result':
          blocks.push({
            type: 'tool_result',
            toolUseId: (b.tool_use_id as string) ?? '',
            toolName: b.name as string | undefined,
            content: b.content,
          });
          break;
      }
    }

    return {
      name: 'message:user',
      payload: { content: blocks, ...(parentToolUseId ? { parentToolUseId } : {}) },
    };
  }

  // ── Result events ──

  private convertResultEvent(
    event: Extract<ProtocolEvent, { type: 'result' }>,
  ): SocketEvent | SocketEvent[] {
    const obj = event as Record<string, unknown>;
    const usage = obj.usage as Record<string, unknown> | undefined;
    const resultPayload = {
      stats: {
        totalCostUsd: obj.total_cost_usd as number | undefined,
        durationMs: obj.duration_ms as number | undefined,
        inputTokens: usage?.input_tokens as number | undefined,
        outputTokens: usage?.output_tokens as number | undefined,
        cacheReadInputTokens: usage?.cache_read_input_tokens as number | undefined,
        cacheCreationInputTokens: usage?.cache_creation_input_tokens as number | undefined,
        numTurns: obj.num_turns as number | undefined,
        modelUsage: obj.modelUsage as Record<string, unknown> | undefined,
      },
      errors: obj.errors as string[] | undefined,
      isError: obj.is_error as boolean | undefined,
      subtype: obj.subtype as string | undefined,
    };

    const resultEvent: SocketEvent = { name: 'message:result', payload: resultPayload };

    const errors = obj.errors as string[] | undefined;
    if (obj.is_error && Array.isArray(errors) && errors.length > 0) {
      return [resultEvent, { name: 'error:message', payload: { message: errors.join('; ') } }];
    }

    return resultEvent;
  }

  // ── Stream events ──

  private convertStreamEvent(
    event: Extract<ProtocolEvent, { type: 'stream_event' }>,
  ): SocketEvent | null {
    const se = (event as unknown as { event: Record<string, unknown> }).event;
    if (!se) return null;

    const parentToolUseId = (event as unknown as { parent_tool_use_id?: string })
      .parent_tool_use_id;

    switch (se.type) {
      case 'content_block_delta': {
        const delta = se.delta as Record<string, unknown> | undefined;
        if (!delta) return null;

        switch (delta.type) {
          case 'text_delta':
            return {
              name: 'stream:chunk',
              payload: {
                chunk: { kind: 'text', content: (delta.text as string) ?? '' },
                ...(parentToolUseId ? { parentToolUseId } : {}),
              },
            };
          case 'thinking_delta':
            return {
              name: 'stream:chunk',
              payload: {
                chunk: { kind: 'thinking', content: (delta.thinking as string) ?? '' },
                ...(parentToolUseId ? { parentToolUseId } : {}),
              },
            };
          case 'input_json_delta':
            return {
              name: 'stream:chunk',
              payload: {
                chunk: { kind: 'input_json', content: (delta.partial_json as string) ?? '' },
                ...(parentToolUseId ? { parentToolUseId } : {}),
              },
            };
          case 'citations_delta':
            return {
              name: 'stream:chunk',
              payload: {
                chunk: {
                  kind: 'citations',
                  content: '',
                  citations: [delta.citation ?? delta.citations].flat().filter(Boolean),
                },
                ...(parentToolUseId ? { parentToolUseId } : {}),
              },
            };
          case 'signature_delta':
          case 'compaction_delta':
            return null; // no-op — CLI handles compaction internally
          default:
            return {
              name: 'raw:event',
              payload: {
                rawType: 'unknown_delta',
                data: { deltaType: delta.type, ...(delta as Record<string, unknown>) },
              },
            };
        }
      }
      case 'content_block_start': {
        const block = se.content_block as Record<string, unknown> | undefined;
        return {
          name: 'stream:block_start',
          payload: {
            index: se.index as number,
            blockType: (block?.type as string) ?? 'unknown',
            ...(block && Object.keys(block).length > 1 ? { contentBlock: block } : {}),
            ...(parentToolUseId ? { parentToolUseId } : {}),
          },
        };
      }
      case 'content_block_stop':
        return null; // no-op
      case 'message_stop':
        return { name: 'stream:end', payload: {} };
      case 'message_start':
      case 'message_delta':
        return null; // no-op
      default:
        return null;
    }
  }

  // ── Control request conversion → ConvertResult ──

  private convertControlRequest(
    event: Extract<ProtocolEvent, { type: 'control_request' }>,
  ): ConvertResult {
    const request = event.request;
    const requestId = event.request_id;
    const events: SocketEvent[] = [];
    const serverActions: ServerAction[] = [];

    switch (request?.subtype) {
      case 'can_use_tool':
        events.push({
          name: 'control:permission',
          payload: {
            requestId,
            toolName: request.tool_name as string,
            toolUseId: request.tool_use_id as string | undefined,
            input: request.input,
            suggestions: request.permission_suggestions as unknown[] | undefined,
            callbackId: request.callback_id as string | undefined,
            blockedPath: request.blocked_path as string | undefined,
            decisionReason: request.decision_reason as string | undefined,
            agentId: request.agent_id as string | undefined,
          },
        });
        break;

      case 'hook_callback': {
        const hookInput = request.input as Record<string, unknown> | undefined;
        events.push({
          name: 'control:hook_callback',
          payload: {
            requestId,
            callbackId: (request.callback_id as string) ?? '',
            input: hookInput,
            toolUseId: request.tool_use_id as string | undefined,
          },
        });
        break;
      }

      case 'elicitation': {
        const elInput = request.input as Record<string, unknown> | undefined;
        const mode = elInput?.mode as string | undefined;
        const inputType = mode === 'url' ? 'url' : mode === 'form' ? 'select' : 'text';
        const options =
          mode === 'form'
            ? Object.keys(
                (elInput?.requested_schema as { properties?: Record<string, unknown> })
                  ?.properties ?? {},
              )
            : undefined;
        const requestedSchema = elInput?.requested_schema as Record<string, unknown> | undefined;
        events.push({
          name: 'control:elicitation',
          payload: {
            requestId,
            prompt: (elInput?.message as string) ?? '',
            inputType: inputType as 'text' | 'url' | 'select',
            options,
            url: mode === 'url' ? (elInput?.url as string | undefined) : undefined,
            elicitationId: request.elicitation_id as string | undefined,
            mcpServerName: (elInput?.mcp_server_name ?? request.mcp_server_name) as
              | string
              | undefined,
            requestedSchema,
          },
        });
        break;
      }

      case 'open_diff': {
        const diffInput = request.input as Record<string, unknown> | undefined;
        const originalFilePath = (diffInput?.originalFilePath as string) ?? '';
        const newFilePath = (diffInput?.newFilePath as string) ?? '';
        serverActions.push({
          action: 'read_diff',
          requestId,
          originalPath: originalFilePath,
          newPath: newFilePath,
        });
        break;
      }

      case 'mcp_message': {
        const mcpInput = request.input as Record<string, unknown> | undefined;
        const serverName = (mcpInput?.server_name ?? request.tool_name ?? '') as string;
        const mcpMsg = (mcpInput?.message ?? mcpInput ?? {}) as Record<string, unknown>;

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

      // Dual-output: emit SocketEvent + auto-respond ServerAction
      case 'open_url': {
        const urlInput = request.input as Record<string, unknown> | undefined;
        const url = (urlInput?.url as string) ?? '';
        events.push({ name: 'action:open_url', payload: { url } });
        serverActions.push({
          action: 'auto_respond',
          requestId,
          subtype: 'open_url',
          response: { type: 'open_url_response' },
        });
        break;
      }

      case 'open_file': {
        const fileInput = request.input as Record<string, unknown> | undefined;
        const filePath = (fileInput?.file_path as string) ?? '';
        const location = fileInput?.location as
          | { startLine?: number; endLine?: number; searchText?: string }
          | undefined;
        events.push({ name: 'action:open_file', payload: { filePath, location } });
        serverActions.push({
          action: 'auto_respond',
          requestId,
          subtype: 'open_file',
          response: { type: 'open_file_response' },
        });
        break;
      }

      case 'show_notification': {
        const notifInput = request.input as Record<string, unknown> | undefined;
        events.push({
          name: 'notification:show',
          payload: {
            message: (notifInput?.message as string) ?? '',
            severity: ((notifInput?.severity as string) ?? 'info') as 'error' | 'warning' | 'info',
            buttons: notifInput?.buttons as string[] | undefined,
            onlyIfNotVisible: notifInput?.onlyIfNotVisible as boolean | undefined,
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

      // Passthrough — server handles via sendControlRequest/control_response cycle
      case 'initialize':
        break;

      // Auto-respond with server-enriched response
      case 'get_settings':
      case 'set_model':
      case 'set_permission_mode':
        serverActions.push({
          action: 'auto_respond',
          requestId,
          subtype: request.subtype,
          response: {},
          input: request.input,
        });
        break;

      // Unknown subtype — forward to client for tracking
      default:
        serverActions.push({
          action: 'forward_to_client',
          requestId,
          subtype: request?.subtype ?? '',
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
}
