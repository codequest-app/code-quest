import { type ProviderClientConfig, providerClientConfigSchema } from '@code-quest/shared';
import type {
  AdapterOutput,
  ClientMessage,
  ControlResponseEvent,
  ParseResult,
  ProviderAdapter,
} from '../types.ts';
import { isRecord } from '../utils.ts';
import type { LaunchOptions } from './launch-options.ts';
import { ClaudeProtocol } from './protocol.ts';
import type { ProtocolMessage } from './schemas.ts';
import { transformAssistantEvent } from './transforms/assistant.ts';
import { transformControlRequest } from './transforms/control.ts';
import { transformResultEvent } from './transforms/result.ts';
import { transformStreamEvent } from './transforms/stream.ts';
import { transformSystemEvent } from './transforms/system.ts';
import { transformUserEvent } from './transforms/user.ts';

interface ConvertResult {
  events: ClientMessage[];
  serverActions: never[];
  controlResponses: ControlResponseEvent[];
}

const EMPTY: ConvertResult = { events: [], serverActions: [], controlResponses: [] };

interface RequestMapping {
  subtype: string;
  mapPayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
}

const serverNamePayload = (p: Record<string, unknown>) => {
  const { serverName, ...rest } = p;
  return { server_name: serverName, ...rest };
};

const REQUEST_MAPPINGS: Record<string, RequestMapping> = {
  // settings
  'settings:set_model': { subtype: 'set_model' },
  'settings:set_permission_mode': { subtype: 'set_permission_mode' },
  'settings:set_thinking_level': { subtype: 'set_max_thinking_tokens' },
  'settings:set_proactive': { subtype: 'set_proactive' },
  'settings:remote_control': { subtype: 'remote_control' },
  'settings:apply': { subtype: 'apply_flag_settings' },
  'settings:get_context_usage': { subtype: 'get_context_usage' },
  // message
  'message:interrupt': { subtype: 'interrupt' },
  'message:stop_task': { subtype: 'stop_task' },
  'message:cancel_async': { subtype: 'cancel_async_message' },
  'message:rewind': { subtype: 'rewind_files' },
  // session
  'session:generate_title': { subtype: 'generate_session_title' },
  'session:initialize': { subtype: 'initialize' },
  // mcp
  'mcp:reconnect': { subtype: 'mcp_reconnect', mapPayload: serverNamePayload },
  'mcp:toggle': { subtype: 'mcp_toggle', mapPayload: serverNamePayload },
  'mcp:servers': { subtype: 'mcp_status' },
  'mcp:set_servers': { subtype: 'mcp_set_servers' },
  'mcp:message': { subtype: 'mcp_message', mapPayload: serverNamePayload },
  'mcp:authenticate': { subtype: 'mcp_authenticate', mapPayload: serverNamePayload },
  'mcp:clear_auth': { subtype: 'mcp_clear_auth', mapPayload: serverNamePayload },
  // claude-specific auth
  'auth:authenticate': { subtype: 'claude_authenticate' },
  'auth:oauth_callback': { subtype: 'claude_oauth_callback' },
  'auth:oauth_wait': { subtype: 'claude_oauth_wait_for_completion' },
  'mcp:oauth_callback': {
    subtype: 'mcp_oauth_callback_url',
    mapPayload: (p) => {
      const { serverName, callbackUrl, ...rest } = p;
      return { server_name: serverName, callback_url: callbackUrl, ...rest };
    },
  },
};

function convertRateLimitEvent(event: ProtocolMessage): ClientMessage {
  const rli = event.rate_limit_info as Record<string, unknown>;
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

function convertAuthStatus(event: ProtocolMessage): ClientMessage {
  return {
    name: 'notification:auth_status',
    payload: {
      status: event.isAuthenticating ? 'authenticating' : 'authenticated',
      output: Array.isArray(event.output) ? event.output.join('\n') : undefined,
      account: event.account,
    },
  };
}

export class ClaudeAdapter implements ProviderAdapter<ProtocolMessage, LaunchOptions> {
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

  parseLine(line: string): ParseResult<ProtocolMessage> {
    return this.protocol.parseLine(line);
  }

  transform(event: ProtocolMessage): AdapterOutput {
    const { events, serverActions, controlResponses } = this.convertEvent(event);
    return { events, controlResponses, serverActions };
  }

  formatRequest(
    event: string,
    payload: Record<string, unknown>,
  ): { subtype: string; input: Record<string, unknown> } {
    const mapping = REQUEST_MAPPINGS[event];
    if (!mapping) throw new Error(`Unknown request event: ${event}`);
    const input = mapping.mapPayload ? mapping.mapPayload(payload) : payload;
    return { subtype: mapping.subtype, input };
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

  private convertEvent(event: ProtocolMessage): ConvertResult {
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
      return transformControlRequest(event as Record<string, unknown>);
    }

    // All other types produce only ClientMessages
    const se = this.convertOtherEvent(event);
    if (se === null) return EMPTY;
    const events = Array.isArray(se) ? se : [se];
    return { events, serverActions: [], controlResponses: [] };
  }

  // ── Non-control events → ClientMessage ──

  private convertOtherEvent(event: ProtocolMessage): ClientMessage | ClientMessage[] | null {
    const e = event as Record<string, unknown>;
    switch (event.type) {
      case 'system':
        return transformSystemEvent(e);
      case 'assistant':
        return transformAssistantEvent(e);
      case 'user':
        return transformUserEvent(e);
      case 'result':
        return transformResultEvent(e);
      case 'stream_event':
        return transformStreamEvent(e);
      case 'rate_limit_event':
        return convertRateLimitEvent(event);
      case 'speech_to_text_message':
        return {
          name: 'speech:message',
          payload: { channelId: event.channelId, text: event.text, done: event.done },
        };
      case 'streamlined_text':
        return { name: 'stream:text', payload: { text: event.text } };
      case 'streamlined_tool_use_summary':
        return { name: 'stream:tool_summary', payload: { toolSummary: event.tool_summary } };
      case 'error':
        return {
          name: 'error:message',
          payload: { message: event.error?.message ?? 'Unknown error' },
        };
      case 'experiment_gates':
        return { name: 'app:experiment_gates', payload: { gates: event.gates } };
      case 'available_models':
        return { name: 'app:models', payload: { models: event.models } };
      case 'notification':
        return { name: 'notification:toast', payload: { message: event.message } };
      case 'auth_status':
        return convertAuthStatus(event);
      case 'auth_url':
        return {
          name: 'notification:auth_url',
          payload: { url: event.url, method: event.method ?? 'oauth' },
        };
      default: {
        if (typeof e.rawType === 'string' && isRecord(e.data)) {
          return { name: 'raw:event', payload: { rawType: e.rawType, data: e.data } };
        }
        return { name: 'raw:event', payload: { rawType: event.type, data: e } };
      }
    }
  }
}
