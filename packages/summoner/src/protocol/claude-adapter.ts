import {
  type ContentBlock,
  type ProviderClientConfig,
  providerClientConfigSchema,
} from '@code-quest/shared';
import type { LaunchOptions } from '../claude/launch-options.ts';
import type {
  AdapterOutput,
  ControlResponseEvent,
  ParseResult,
  ProviderAdapter,
  ServerAction,
  SocketEvent,
} from '../types.ts';
import { ClaudeProtocol } from './claude-protocol.ts';
import type { ProtocolEvent } from './claude-schemas.ts';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

interface ConvertResult {
  events: SocketEvent[];
  serverActions: ServerAction[];
  controlResponses: ControlResponseEvent[];
}

const EMPTY: ConvertResult = { events: [], serverActions: [], controlResponses: [] };

export class ClaudeAdapter implements ProviderAdapter<ProtocolEvent, LaunchOptions> {
  private readonly protocol = new ClaudeProtocol();

  readonly clientConfig: ProviderClientConfig = providerClientConfigSchema.parse({
    brand: {
      name: 'Claude',
      company: 'Anthropic',
      docsUrl: 'https://docs.anthropic.com/en/docs/claude-code/overview',
      placeholder: '⌘ Esc to focus or unfocus Claude',
      loginTitle: 'Login to Claude',
    },
    permissionModes: [
      {
        id: 'normal',
        label: 'Ask before edits',
        description: 'Claude will ask for approval before making each edit',
      },
      {
        id: 'acceptEdits',
        label: 'Edit automatically',
        description: 'Claude will edit your selected text or the whole file',
      },
      {
        id: 'plan',
        label: 'Plan mode',
        description: 'Claude will explore the code and present a plan before editing',
      },
      {
        id: 'bypassPermissions',
        label: 'Bypass permissions',
        description:
          'Claude will not ask for approval before running potentially dangerous commands',
      },
    ],
    authMethods: [
      { id: 'claudeai', label: 'Claude AI' },
      { id: 'console', label: 'Anthropic Console' },
      { id: 'api-key', label: 'API Key' },
      { id: '3p', label: 'Third Party' },
      { id: 'not-specified', label: 'Not Specified' },
    ],
    mcpScopes: [
      { id: 'project', label: 'Project' },
      { id: 'local', label: 'Local' },
      { id: 'user', label: 'User' },
      { id: 'claudeai', label: 'claude.ai', prefix: 'claude.ai ' },
      { id: 'managed', label: 'Managed' },
      { id: 'enterprise', label: 'Enterprise' },
    ],
    usageTiers: [
      { key: 'five_hour', label: 'Session (5hr)', shortLabel: '5hr' },
      { key: 'seven_day', label: 'Weekly (7 day)', shortLabel: '7day' },
      { key: 'seven_day_sonnet', label: 'Weekly Sonnet', shortLabel: 'Sonnet' },
    ],
    defaultModels: [
      {
        value: 'default',
        displayName: 'Default (recommended)',
        description: 'Opus 4.6 · Most capable for complex work',
        supportsEffort: true,
        supportedEffortLevels: ['low', 'medium', 'high', 'max'],
        supportsAdaptiveThinking: true,
        supportsFastMode: true,
      },
      {
        value: 'sonnet',
        displayName: 'Sonnet',
        description: 'Sonnet 4.6 · Best for everyday tasks',
        supportsEffort: true,
        supportedEffortLevels: ['low', 'medium', 'high', 'max'],
        supportsAdaptiveThinking: true,
      },
      {
        value: 'haiku',
        displayName: 'Haiku',
        description: 'Haiku 4.5 · Fastest for quick answers',
      },
    ],
    defaultModelDescription: 'Most capable for complex work',
  });

  get command(): string {
    return this.protocol.command;
  }

  buildArgs(options?: LaunchOptions): string[] {
    return this.protocol.buildArgs(options);
  }

  parseLine(line: string): ParseResult<ProtocolEvent> {
    return this.protocol.parseLine(line);
  }

  transform(event: ProtocolEvent): AdapterOutput {
    const { events, serverActions, controlResponses } = this.convertEvent(event);
    return { events, controlResponses, serverActions };
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
        const obj = JSON.parse(entry.raw.trim());
        if (!isRecord(obj)) continue;
        const resp = isRecord(obj.response) ? obj.response : undefined;
        if (typeof resp?.request_id === 'string') ids.add(resp.request_id);
      } catch {
        // ignore
      }
    }
    return ids;
  }

  // ── Core dispatch ──

  private convertEvent(event: ProtocolEvent): ConvertResult {
    if (event.type === 'keep_alive') return EMPTY;

    if (event.type === 'control_response') {
      const resp = event.response;
      return {
        events: [],
        serverActions: [],
        controlResponses: [
          {
            requestId: resp.request_id,
            success: resp.subtype === 'success',
            response: resp.response,
            error: resp.error,
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
      const rli = event.rate_limit_info;
      return {
        name: 'system:rate_limit',
        payload: {
          info: {
            status: rli.status ?? '',
            rateLimitType: rli.rateLimitType,
            resetsAt: rli.resetsAt != null ? String(rli.resetsAt) : undefined,
            utilization: rli.utilization != null ? rli.utilization : undefined,
            overageStatus: rli.overageStatus,
            isUsingOverage: rli.isUsingOverage,
          },
        },
      };
    }

    if (event.type === 'speech_to_text_message') {
      return {
        name: 'speech:message',
        payload: { channelId: event.channelId, text: event.text, done: event.done },
      };
    }

    if (event.type === 'streamlined_text') {
      return { name: 'stream:text', payload: { text: event.text } };
    }

    if (event.type === 'streamlined_tool_use_summary') {
      return { name: 'stream:tool_summary', payload: { toolSummary: event.tool_summary } };
    }

    if (event.type === 'error') {
      return {
        name: 'error:message',
        payload: { message: event.error?.message ?? 'Unknown error' },
      };
    }

    if (event.type === 'experiment_gates') {
      return { name: 'app:experiment_gates', payload: { gates: event.gates } };
    }

    if (event.type === 'available_models') {
      return { name: 'app:models', payload: { models: event.models } };
    }

    if (event.type === 'notification') {
      return { name: 'notification:toast', payload: { message: event.message } };
    }

    if (event.type === 'auth_status') {
      return {
        name: 'notification:auth_status',
        payload: {
          status: event.isAuthenticating ? 'authenticating' : 'authenticated',
          output: Array.isArray(event.output) ? event.output.join('\n') : undefined,
          account: event.account,
        },
      };
    }

    if (event.type === 'auth_url') {
      return {
        name: 'notification:auth_url',
        payload: { url: event.url, method: event.method ?? 'oauth' },
      };
    }

    // Unknown/unhandled → raw:event
    const data = event as unknown as Record<string, unknown>;
    if (typeof data.rawType === 'string' && isRecord(data.data)) {
      return { name: 'raw:event', payload: { rawType: data.rawType, data: data.data } };
    }
    return { name: 'raw:event', payload: { rawType: event.type, data } };
  }

  // ── System events ──

  private convertSystemEvent(
    event: Extract<ProtocolEvent, { type: 'system' }>,
  ): SocketEvent | null {
    if (event.subtype === 'init') {
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
          config: event as Record<string, unknown>,
        },
      };
    }

    if (event.subtype === 'status') {
      return {
        name: 'session:status',
        payload: {
          status: event.status ?? '',
          permissionMode: event.permissionMode,
        },
      };
    }

    if (event.subtype === 'hook_started') {
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

    if (event.subtype === 'hook_response') {
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

    if (event.subtype === 'task_started') {
      return {
        name: 'system:task_started',
        payload: { description: event.description, taskType: event.task_type },
      };
    }

    if (event.subtype === 'task_notification') {
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

    if (event.subtype === 'task_progress') {
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
    if (event.subtype === 'post_turn_summary' || event.subtype === 'session_state_changed') {
      return null;
    }

    if (event.subtype === 'api_retry') {
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

    if (event.subtype === 'bridge_state') {
      return {
        name: 'system:remote_control',
        payload: {
          info: { state: event.state, detail: event.detail },
        },
      };
    }

    if (event.subtype === 'compact_boundary') {
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
        rawType: `system/${event.subtype}`,
        data: event as unknown as Record<string, unknown>,
      },
    };
  }

  // ── Assistant events ──

  private convertAssistantEvent(
    event: Extract<ProtocolEvent, { type: 'assistant' }>,
  ): SocketEvent | null {
    const parentToolUseId = event.parent_tool_use_id ?? undefined;
    const content = event.message?.content;
    if (!Array.isArray(content)) return null;

    const blocks: ContentBlock[] = [];
    for (const b of content) {
      switch (b.type) {
        case 'text':
          blocks.push({ type: 'text', text: String(b.text ?? '') });
          break;
        case 'thinking':
          blocks.push({ type: 'thinking', thinking: String(b.thinking ?? '') });
          break;
        case 'tool_use':
          blocks.push({
            type: 'tool_use',
            toolId: String(b.id ?? ''),
            toolName: String(b.name ?? ''),
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
    const parentToolUseId = event.parent_tool_use_id ?? undefined;
    const content = event.message?.content;
    if (!Array.isArray(content)) return null;

    const blocks: ContentBlock[] = [];
    for (const b of content) {
      switch (b.type) {
        case 'text':
          blocks.push({ type: 'text', text: String(b.text ?? '') });
          break;
        case 'tool_result':
          blocks.push({
            type: 'tool_result',
            toolUseId: String(b.tool_use_id ?? ''),
            toolName: typeof b.name === 'string' ? b.name : undefined,
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
    const usage = event.usage;
    const resultPayload = {
      stats: {
        totalCostUsd: event.total_cost_usd,
        durationMs: event.duration_ms,
        inputTokens: usage?.input_tokens,
        outputTokens: usage?.output_tokens,
        cacheReadInputTokens: usage?.cache_read_input_tokens,
        cacheCreationInputTokens: usage?.cache_creation_input_tokens,
        numTurns: event.num_turns,
        modelUsage: event.modelUsage,
      },
      errors: event.errors,
      isError: event.is_error,
      subtype: event.subtype,
    };

    const resultEvent: SocketEvent = { name: 'message:result', payload: resultPayload };

    if (event.is_error && Array.isArray(event.errors) && event.errors.length > 0) {
      return [
        resultEvent,
        { name: 'error:message', payload: { message: event.errors.join('; ') } },
      ];
    }

    return resultEvent;
  }

  // ── Stream events ──

  private convertStreamEvent(
    event: Extract<ProtocolEvent, { type: 'stream_event' }>,
  ): SocketEvent | null {
    const se = event.event;
    if (!se) return null;

    const parentToolUseId = event.parent_tool_use_id ?? undefined;

    switch (se.type) {
      case 'content_block_delta': {
        const delta = se.delta;
        if (!delta) return null;

        switch (delta.type) {
          case 'text_delta':
            return {
              name: 'stream:chunk',
              payload: {
                chunk: { kind: 'text', content: delta.text ?? '' },
                ...(parentToolUseId ? { parentToolUseId } : {}),
              },
            };
          case 'thinking_delta':
            return {
              name: 'stream:chunk',
              payload: {
                chunk: { kind: 'thinking', content: delta.thinking ?? '' },
                ...(parentToolUseId ? { parentToolUseId } : {}),
              },
            };
          case 'input_json_delta':
            return {
              name: 'stream:chunk',
              payload: {
                chunk: { kind: 'input_json', content: delta.partial_json ?? '' },
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
                  citations: [delta.citations ?? delta.citation].flat().filter(Boolean),
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
                data: { deltaType: delta.type, ...delta },
              },
            };
        }
      }
      case 'content_block_start': {
        const block = se.content_block;
        return {
          name: 'stream:block_start',
          payload: {
            index: se.index ?? 0,
            blockType: block?.type ?? 'unknown',
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
            callbackId: request.callback_id ?? '',
            input: request.input,
            toolUseId: request.tool_use_id,
          },
        });
        break;

      case 'elicitation': {
        const elInput = isRecord(request.input) ? request.input : undefined;
        const mode = typeof elInput?.mode === 'string' ? elInput.mode : undefined;
        const inputType = mode === 'url' ? 'url' : mode === 'form' ? 'select' : 'text';
        const reqSchema = isRecord(elInput?.requested_schema)
          ? elInput.requested_schema
          : undefined;
        const options =
          mode === 'form'
            ? Object.keys(
                (isRecord(reqSchema?.properties) ? reqSchema.properties : undefined) ?? {},
              )
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
              (typeof elInput?.mcp_server_name === 'string'
                ? elInput.mcp_server_name
                : undefined) ?? request.mcp_server_name,
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

      // Dual-output: emit SocketEvent + auto-respond ServerAction
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
          toolName: request?.tool_name,
          toolUseId: request?.tool_use_id,
          input: request?.input,
          suggestions: request?.permission_suggestions,
          callbackId: request?.callback_id,
        });
        break;
    }

    return { events, serverActions, controlResponses: [] };
  }
}
